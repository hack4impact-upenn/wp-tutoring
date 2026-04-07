import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { useAuth } from "@/features/auth/AuthContext"
import { LayoutDashboard, LogOut, Menu, UserRound, X } from "lucide-react"
import logo from "../../assets/51b2a5476f8be324b14fb9197d7339afe2398dbc.png"

interface NavigationProps {
  scrolled: boolean
}

export function Navigation({ scrolled }: NavigationProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false)

  const closeMobile = () => setMobileOpen(false)

  const confirmSignOut = () => {
    signOut()
    navigate("/")
    closeMobile()
    setSignOutDialogOpen(false)
  }

  const linkClass = (path: string) =>
    `transition-colors ${
      location.pathname === path
        ? "text-primary font-medium"
        : "text-foreground hover:text-primary"
    }`

  const navLinks = (
    <>
      <Link to="/" className={linkClass("/")} onClick={closeMobile}>
        Home
      </Link>
      <Link to="/about" className={linkClass("/about")} onClick={closeMobile}>
        About Us
      </Link>
      <Link to="/contact" className={linkClass("/contact")} onClick={closeMobile}>
        Contact
      </Link>
    </>
  )

  const profileTriggerClassName =
    "flex h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-left text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  const authenticatedDesktop = (
    <DropdownMenu>
      <DropdownMenuTrigger className={profileTriggerClassName} aria-label="Account menu">
        <UserRound className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="max-w-[10rem] truncate">{user?.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        {user?.role === "admin" && (
          <>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                navigate("/admin-dashboard")
              }}
            >
              <LayoutDashboard className="size-4" />
              Admin Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          variant="destructive"
          onSelect={(e) => {
            e.preventDefault()
            setSignOutDialogOpen(true)
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const authenticatedMobile = (
    <DropdownMenu>
      <DropdownMenuTrigger className={`${profileTriggerClassName} w-full justify-between`}>
        <span className="flex min-w-0 items-center gap-2">
          <UserRound className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate">{user?.name}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[12rem]">
        {user?.role === "admin" && (
          <>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                navigate("/admin-dashboard")
                closeMobile()
              }}
            >
              <LayoutDashboard className="size-4" />
              Admin Dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          variant="destructive"
          onSelect={(e) => {
            e.preventDefault()
            setSignOutDialogOpen(true)
            closeMobile()
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  /** Same for signed-in and signed-out; only the trailing control differs (profile vs Admin Sign In). */
  const applyFormLinks = (
    <>
      <Link
        to="/apply/tutor"
        className={linkClass("/apply/tutor")}
        onClick={closeMobile}
      >
        Tutor form
      </Link>
      <Link
        to="/apply/tutee"
        className={linkClass("/apply/tutee")}
        onClick={closeMobile}
      >
        Parent form
      </Link>
    </>
  )

  const authSectionDesktop = (
    <div className="flex flex-wrap items-center gap-6 lg:gap-8">
      {applyFormLinks}
      {isAuthenticated ? (
        authenticatedDesktop
      ) : (
        <Button
          size="sm"
          onClick={() => {
            navigate("/sign-in")
            closeMobile()
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Admin Sign In
        </Button>
      )}
    </div>
  )

  const authSectionMobile = (
    <div className="flex flex-col gap-4">
      {applyFormLinks}
      {isAuthenticated ? (
        authenticatedMobile
      ) : (
        <Button
          size="sm"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => {
            navigate("/sign-in")
            closeMobile()
          }}
        >
          Admin Sign In
        </Button>
      )}
    </div>
  )

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur-sm shadow-md" : "bg-background/80 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="WPTP Logo" className="h-12 w-auto" />
              <h2 className="hidden text-xl font-semibold text-primary lg:block">West Philly Tutoring</h2>
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              {navLinks}
              {authSectionDesktop}
            </div>

            <button
              type="button"
              className="p-2 text-foreground md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t bg-background/95 shadow-lg backdrop-blur-sm md:hidden">
            <div className="container mx-auto flex flex-col gap-4 px-4 py-4">
              {navLinks}
              {authSectionMobile}
            </div>
          </div>
        )}
      </nav>

      <Dialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>
              You will need to sign in again to access the admin dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setSignOutDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmSignOut}>
              Sign out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
