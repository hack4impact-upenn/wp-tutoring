"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BookOpen, Menu, X } from "lucide-react"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/apply/tutor", label: "Become a Tutor" },
  { href: "/apply/tutee", label: "Find a Tutor" },
  { href: "/admin", label: "Admin" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            WPTP
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={pathname === link.href ? "secondary" : "ghost"}
                size="sm"
                className={
                  pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                }
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Mobile toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav
          className="border-t border-border bg-card px-4 pb-4 pt-2 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                <Button
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    pathname === link.href
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
