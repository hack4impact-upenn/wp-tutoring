"""Build invite URLs and send admin invitation emails via SMTP (e.g. Gmail) or Resend."""

from __future__ import annotations

import html
import json
import logging
import os
import smtplib
import ssl
import urllib.error
import urllib.parse
import urllib.request
from email.message import EmailMessage

logger = logging.getLogger(__name__)


def build_invite_url(token: str) -> str:
    # Match frontend dev server port in ADMIN_INVITE_BASE_URL (.env).
    base = os.environ.get("ADMIN_INVITE_BASE_URL", "http://localhost:3000").rstrip("/")
    path = os.environ.get("ADMIN_INVITE_PATH", "/admin/invite")
    if not path.startswith("/"):
        path = "/" + path
    q = urllib.parse.urlencode({"token": token})
    return f"{base}{path}?{q}"


def _invite_bodies(name: str, invite_url: str) -> tuple[str, str, str]:
    subject = "You're invited to the WPTP admin dashboard"
    safe_name = html.escape(name, quote=True)
    body_html = f"""
    <p>Hi {safe_name},</p>
    <p>You've been invited to create an admin account for the West Philadelphia Tutoring Project.</p>
    <p><a href="{html.escape(invite_url, quote=True)}">Create your account</a></p>
    <p>If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="word-break:break-all;">{html.escape(invite_url, quote=True)}</p>
    """
    body_text = (
        f"Hi {name},\n\n"
        "You've been invited to create an admin account for the West Philadelphia Tutoring Project.\n\n"
        f"Open this link to create your account:\n{invite_url}\n"
    )
    return subject, body_html, body_text


def _smtp_configured() -> bool:
    return bool(
        os.environ.get("SMTP_USER", "").strip()
        and os.environ.get("SMTP_PASSWORD", "").strip()
        and os.environ.get("EMAIL_FROM", "").strip()
    )


def _log_invite_config_snapshot(to_email: str) -> None:
    """Log which email path is available (no secrets)."""
    smtp_user = bool(os.environ.get("SMTP_USER", "").strip())
    smtp_pw = bool(os.environ.get("SMTP_PASSWORD", "").strip())
    email_from = bool(os.environ.get("EMAIL_FROM", "").strip())
    resend_key = bool(os.environ.get("RESEND_API_KEY", "").strip())
    resend_from = bool(
        os.environ.get("EMAIL_FROM_RESEND", "").strip() or os.environ.get("EMAIL_FROM", "").strip()
    )
    smtp_ok = smtp_user and smtp_pw and email_from
    resend_ok = resend_key and resend_from
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com").strip()
    port = os.environ.get("SMTP_PORT", "587").strip()
    base_url = os.environ.get("ADMIN_INVITE_BASE_URL", "(default)").strip()
    logger.info(
        "invite_email: to=%s | SMTP configured=%s (user=%s password_set=%s EMAIL_FROM=%s host=%s port=%s) | "
        "Resend configured=%s (key=%s from=%s) | will_try=%s | ADMIN_INVITE_BASE_URL=%s",
        to_email,
        smtp_ok,
        smtp_user,
        smtp_pw,
        email_from,
        host,
        port,
        resend_ok,
        resend_key,
        resend_from,
        "smtp" if smtp_ok else ("resend" if resend_ok else "none"),
        base_url,
    )


def _send_via_smtp(to_email: str, name: str, invite_url: str) -> bool:
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com").strip()
    port = int(os.environ.get("SMTP_PORT", "587") or "587")
    user = os.environ.get("SMTP_USER", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "").strip().replace(" ", "")
    from_addr = os.environ.get("EMAIL_FROM", "").strip()

    logger.info("invite_email: attempting SMTP send host=%s port=%s user=%s to=%s", host, port, user, to_email)

    subject, body_html, body_text = _invite_bodies(name, invite_url)
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.set_content(body_text)
    msg.add_alternative(body_html, subtype="html")

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP(host, port, timeout=30) as server:
            server.starttls(context=context)
            server.login(user, password)
            server.send_message(msg)
    except smtplib.SMTPAuthenticationError as e:
        logger.warning("invite_email: SMTP authentication failed (check app password / 2FA): %s", e)
        raise RuntimeError("Failed to send invitation email") from e
    except smtplib.SMTPException as e:
        logger.warning("invite_email: SMTP error: %s", e)
        raise RuntimeError("Failed to send invitation email") from e
    except OSError as e:
        logger.warning("invite_email: SMTP network/OS error: %s", e)
        raise RuntimeError("Failed to send invitation email") from e

    logger.info("invite_email: SMTP send finished OK to=%s", to_email)
    return True


def _send_via_resend(to_email: str, name: str, invite_url: str) -> bool:
    api_key = os.environ.get("RESEND_API_KEY", "").strip()
    from_addr = (
        os.environ.get("EMAIL_FROM_RESEND", "").strip() or os.environ.get("EMAIL_FROM", "").strip()
    )
    logger.info("invite_email: attempting Resend send from=%s to=%s", from_addr, to_email)

    subject, body_html, body_text = _invite_bodies(name, invite_url)

    payload = json.dumps(
        {
            "from": from_addr,
            "to": [to_email],
            "subject": subject,
            "html": body_html,
            "text": body_text,
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            if resp.status not in (200, 201):
                logger.warning("invite_email: Resend HTTP %s body=%s", resp.status, raw[:500])
                raise RuntimeError("Failed to send invitation email")
            try:
                parsed = json.loads(raw) if raw else {}
                eid = parsed.get("id", "")
                logger.info("invite_email: Resend accepted status=%s id=%s", resp.status, eid or "(none)")
            except json.JSONDecodeError:
                logger.info("invite_email: Resend accepted status=%s (non-JSON body)", resp.status)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        logger.warning("invite_email: Resend HTTPError %s body=%s", e.code, body[:800])
        raise RuntimeError("Failed to send invitation email") from e
    except OSError as e:
        logger.warning("invite_email: Resend request failed: %s", e)
        raise RuntimeError("Failed to send invitation email") from e

    return True


def send_admin_invite_email(to_email: str, name: str, invite_url: str) -> bool:
    """Send via SMTP if SMTP_USER/SMTP_PASSWORD/EMAIL_FROM are set; else Resend; else log and return False."""
    _log_invite_config_snapshot(to_email)

    if _smtp_configured():
        return _send_via_smtp(to_email, name, invite_url)

    api_key = os.environ.get("RESEND_API_KEY", "").strip()
    from_addr = (
        os.environ.get("EMAIL_FROM_RESEND", "").strip() or os.environ.get("EMAIL_FROM", "").strip()
    )
    if api_key and from_addr:
        return _send_via_resend(to_email, name, invite_url)

    logger.warning(
        "invite_email: NOT sending — missing both full SMTP config and Resend config. "
        "Need SMTP_USER+SMTP_PASSWORD+EMAIL_FROM, or RESEND_API_KEY + EMAIL_FROM_RESEND/EMAIL_FROM. to=%s",
        to_email,
    )
    return False
