"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, ChevronDown } from "lucide-react";
import { useAuthStore, getDashboardRoute } from "@/store/auth";
import { clsx } from "clsx";

const navLinks = [
  { label: "Explore Jobs", href: "/jobs" },
  { label: "Find Creatives", href: "/creatives" },
  { label: "Client Workspace", href: "/client" },
  { label: "Creative Studio", href: "/creative" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FCFAFF]/80 backdrop-blur-md border-b border-[#EEEAF5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold tracking-tight text-[#171526]">
              ZE:creatives
            </span>
            <Sparkles className="w-4 h-4 text-[#7957F5]" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#777386]">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={clsx(
                  "hover:text-[#171526] transition-colors",
                  pathname === link.href && "text-[#171526] font-semibold"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              href="/jobs"
              className="p-2 text-[#777386] hover:text-[#171526] transition-colors rounded-full hover:bg-black/5"
            >
              <svg width="20" height="20" className="w-5 h-5 text-[#777386]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-brand-lavender transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-lavender flex items-center justify-center">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold text-brand-primary">
                        {user.first_name[0]}{user.last_name[0]}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-brand-text">{user.first_name}</span>
                  <ChevronDown className="w-4 h-4 text-brand-muted" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 card p-2 shadow-card-hover"
                    >
                      <Link
                        href={getDashboardRoute(user.role)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#7957F5] hover:bg-[#E9DFFF]/40 rounded-lg transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        ⚡ My Dashboard
                      </Link>
                      <Link
                        href="/client"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[#171526] hover:bg-[#FCFAFF] rounded-lg transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        💼 Client Workspace
                      </Link>
                      <Link
                        href="/creative"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-[#171526] hover:bg-[#FCFAFF] rounded-lg transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        🎨 Creative Studio
                      </Link>
                      {(user.role === "admin" || user.role === "super_admin") && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          🛡️ Admin Moderation
                        </Link>
                      )}
                      <div className="divider my-1 border-t border-[#EEEAF5]" />
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link href="/sign-in" className="text-sm font-medium text-[#171526] hover:text-[#7957F5] transition-colors">
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
            className="md:hidden p-2 text-brand-muted hover:text-brand-primary transition-colors"
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
            className="md:hidden border-t border-brand-border bg-white"
          >
            <div className="container-app py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2 text-brand-text font-medium rounded-lg hover:bg-brand-lavender transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="divider mt-2 pt-2 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link href={getDashboardRoute(user!.role)} className="btn-secondary" onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </Link>
                    <button onClick={() => { logout(); setMobileOpen(false); }} className="btn-outline text-red-500 border-red-300">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/sign-in" className="btn-outline" onClick={() => setMobileOpen(false)}>
                      Sign In
                    </Link>
                    <Link href="/join" className="btn-primary" onClick={() => setMobileOpen(false)}>
                      Get Started
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
