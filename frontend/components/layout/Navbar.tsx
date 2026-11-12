"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, ChevronDown, ShieldCheck, Briefcase, Palette, LogOut } from "lucide-react";
import { useAuthStore, getDashboardRoute } from "@/store/auth";
import { clsx } from "clsx";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  const isAdmin = isAuthenticated && (user?.role === "admin" || user?.role === "super_admin");
  const isClient = isAuthenticated && user?.role === "client";
  const isCreative = isAuthenticated && user?.role === "creative";

  // Strictly role-scoped navigation: Admins never see Client Workspace or Creative Studio,
  // Clients never see Creative Studio, and Creatives never see Client Workspace.
  const navLinks = isAdmin
    ? [
        { label: "Admin Command Center", href: "/admin" },
        { label: "Browse Creatives", href: "/creatives" },
        { label: "Browse Jobs", href: "/jobs" },
      ]
    : isClient
    ? [
        { label: "Client Workspace", href: "/client" },
        { label: "Find Creatives", href: "/creatives" },
        { label: "Explore Jobs", href: "/jobs" },
      ]
    : isCreative
    ? [
        { label: "Creative Studio", href: "/creative" },
        { label: "Explore Jobs", href: "/jobs" },
        { label: "Creative Directory", href: "/creatives" },
      ]
    : [
        { label: "Explore Jobs", href: "/jobs" },
        { label: "Find Creatives", href: "/creatives" },
        { label: "Hire Talent", href: "/apply/client" },
        { label: "Apply as Creative", href: "/apply/creative" },
      ];

  const roleLabel = isAdmin
    ? user?.role === "super_admin"
      ? "Super Admin"
      : "Admin"
    : isClient
    ? "Client"
    : isCreative
    ? "Creative"
    : "";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FCFAFF]/85 backdrop-blur-md border-b border-[#EEEAF5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href={isAdmin ? "/admin" : "/"} className="flex items-center gap-2 group">
            <span className="text-2xl font-bold tracking-tight text-[#171526]">
              ZE:creatives
            </span>
            <Sparkles className="w-4 h-4 text-[#7957F5]" />
            {isAdmin && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#7957F5]/10 text-[#7957F5] border border-[#7957F5]/20">
                Governance
              </span>
            )}
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#777386]">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={clsx(
                  "hover:text-[#171526] transition-colors",
                  pathname === link.href && "text-[#7957F5] font-semibold"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-[#EEEAF5] bg-white hover:border-[#7957F5]/40 transition-colors shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-[#E9DFFF] flex items-center justify-center">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-[#7957F5]">
                        {(user.first_name?.[0] || "U")}{(user.last_name?.[0] || "")}
                      </span>
                    )}
                  </div>
                  <div className="text-left pr-1">
                    <p className="text-xs font-bold text-[#171526] leading-tight">{user.first_name} {user.last_name}</p>
                    <p className="text-[10px] font-semibold text-[#7957F5] leading-tight">{roleLabel}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#777386]" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-[#EEEAF5] p-2 shadow-xl"
                    >
                      <div className="px-3 py-2 border-b border-[#EEEAF5] mb-1">
                        <p className="text-xs font-bold text-[#171526] truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-[11px] text-[#777386] truncate">{user.email}</p>
                      </div>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#7957F5] hover:bg-[#E9DFFF]/40 rounded-xl transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Admin Command Center
                        </Link>
                      )}

                      {isClient && (
                        <Link
                          href="/client"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#7957F5] hover:bg-[#E9DFFF]/40 rounded-xl transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Briefcase className="w-4 h-4" />
                          Client Workspace
                        </Link>
                      )}

                      {isCreative && (
                        <Link
                          href="/creative"
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#7957F5] hover:bg-[#E9DFFF]/40 rounded-xl transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Palette className="w-4 h-4" />
                          Creative Studio
                        </Link>
                      )}

                      <div className="my-1 border-t border-[#EEEAF5]" />
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-[#171526] hover:text-[#7957F5] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/apply/client"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#171526] text-white text-sm font-medium hover:bg-black transition-all shadow-sm"
                >
                  Post a Job ➔
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 text-[#777386] hover:text-[#7957F5] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-[#EEEAF5] bg-white"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2 text-sm text-[#171526] font-medium rounded-xl hover:bg-[#E9DFFF]/40 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t border-[#EEEAF5] flex flex-col gap-2">
                {isAuthenticated && user ? (
                  <>
                    <Link
                      href={getDashboardRoute(user.role)}
                      className="px-3 py-2 text-sm font-semibold text-[#7957F5] rounded-xl bg-[#E9DFFF]/40"
                      onClick={() => setMobileOpen(false)}
                    >
                      {isAdmin ? "Admin Command Center" : isClient ? "Client Workspace" : "Creative Studio"}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="px-3 py-2 text-sm font-semibold text-left text-red-600 rounded-xl hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      className="px-3 py-2 text-sm font-semibold text-[#171526] rounded-xl border border-[#EEEAF5] text-center"
                      onClick={() => setMobileOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/apply/client"
                      className="px-3 py-2 text-sm font-semibold text-white bg-[#7957F5] rounded-xl text-center"
                      onClick={() => setMobileOpen(false)}
                    >
                      Hire Talent
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
