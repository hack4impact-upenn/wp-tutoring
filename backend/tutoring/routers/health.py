from fastapi import APIRouter, Request

router = APIRouter(tags=["health"])

_WORKSPACE = "/api/admin/dashboard/workspace"


@router.get("/health")
def health(request: Request) -> dict[str, str | bool | int]:
    """Liveness check. `has_workspace` confirms this process is the current WPTP API (not a stale uvicorn)."""
    paths = {getattr(r, "path", "") for r in request.app.routes if getattr(r, "path", None)}
    api_paths = [p for p in paths if p.startswith("/api")]
    return {
        "status": "ok",
        "has_workspace": _WORKSPACE in paths,
        "api_route_count": len(api_paths),
    }
