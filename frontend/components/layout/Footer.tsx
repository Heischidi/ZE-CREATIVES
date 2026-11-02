import Link from "next/link";
import { Sparkles, Globe, Mail, Share2, Compass, ArrowRight } from "lucide-react";

const footerLinks = {
  "For Creatives": [
    { label: "Browse Jobs", href: "/jobs" },
    { label: "Find Creatives", href: "/creatives" },
    { label: "Pricing", href: "/pricing" },
  ],
  "For Clients": [
    { label: "Post a Job", href: "/apply/client" },
    { label: "Hiring Guide", href: "/apply/client" },
    { label: "Pricing", href: "/pricing" },
  ],
  Company: [
    { label: "About Us", href: "/" },
    { label: "Blog", href: "/" },
    { label: "Careers", href: "/" },
    { label: "Contact", href: "/" },
  ],
  Support: [
    { label: "Help Center", href: "/" },
    { label: "Safety", href: "/" },
    { label: "Terms of Service", href: "/" },
    { label: "Privacy Policy", href: "/" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#FCFAFF] border-t border-[#EEEAF5] text-[#171526]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          {/* Brand & Socials */}
          <div className="md:col-span-3">
            <Link href="/" className="flex items-center gap-2 mb-2">
              <span className="text-xl font-bold tracking-tight text-[#171526]">
                ZE:creatives
              </span>
              <Sparkles className="w-4 h-4 text-[#7957F5]" />
            </Link>
            <p className="text-xs text-[#777386] mb-5">
              The creative job marketplace
            </p>
            <div className="flex gap-2.5">
              {[
                { Icon: Globe, href: "#", label: "Web" },
                { Icon: Share2, href: "#", label: "Network" },
                { Icon: Mail, href: "#", label: "Email" },
                { Icon: Compass, href: "#", label: "Explore" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 rounded-full bg-white border border-[#EEEAF5] hover:border-[#7957F5] hover:text-[#7957F5] transition-colors flex items-center justify-center text-[#777386]"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav Columns */}
          <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h4 className="font-semibold text-[#171526] mb-3 text-xs tracking-wide">
                  {category}
                </h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[#777386] hover:text-[#171526] text-xs transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter Box */}
          <div className="md:col-span-3">
            <h4 className="font-semibold text-[#171526] mb-1.5 text-xs">
              Join our creative community
            </h4>
            <p className="text-xs text-[#777386] mb-3">
              Get the latest jobs, talent and updates.
            </p>
            <div className="flex items-center rounded-full bg-white border border-[#EEEAF5] p-1 shadow-sm focus-within:border-[#7957F5]">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full text-xs text-[#171526] placeholder-[#777386]/70 px-3 py-1.5 bg-transparent outline-none"
              />
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-[#171526] text-white flex items-center justify-center shrink-0 hover:bg-black transition-colors"
              >
                ➔
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#EEEAF5] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#777386]">
          <p>© 2026 ZE:creatives. All rights reserved.</p>
          <p className="flex items-center gap-1 font-medium">
            Designed for dreamers. Built for doers. ✦
          </p>
        </div>
      </div>
    </footer>
  );
}
