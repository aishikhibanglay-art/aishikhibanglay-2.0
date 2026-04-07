import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  BookOpen, Menu, X, ChevronRight, Facebook, Youtube,
  Instagram, Linkedin, Twitter, MessageCircle, Mail,
  Phone, Send
} from "lucide-react";

const navLinks = [
  { href: "/", label: "হোম" },
  { href: "/courses", label: "কোর্সসমূহ" },
  { href: "/blog", label: "ব্লগ" },
  { href: "/community", label: "কমিউনিটি" },
  { href: "/about", label: "আমাদের সম্পর্কে" },
  { href: "/contact", label: "যোগাযোগ" },
];

function SocialIcon({ platform, url }: { platform: string; url: string }) {
  if (!url) return null;
  const icons: Record<string, React.ReactNode> = {
    facebook: <Facebook className="w-4 h-4" />,
    youtube: <Youtube className="w-4 h-4" />,
    instagram: <Instagram className="w-4 h-4" />,
    linkedin: <Linkedin className="w-4 h-4" />,
    twitter: <Twitter className="w-4 h-4" />,
  };
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-violet-600 flex items-center justify-center text-gray-400 hover:text-white transition-all"
    >
      {icons[platform]}
    </a>
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [location] = useLocation();
  const { user, profile } = useAuth();
  const { settings } = useSiteSettings();

  const dashboardHref = profile?.role && ["super_admin", "admin"].includes(profile.role)
    ? "/admin"
    : "/dashboard";

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              {settings.site_logo_url ? (
                <img src={settings.site_logo_url} alt={settings.site_name} className="h-9 w-auto" />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="font-bold text-white text-sm hidden sm:block">{settings.site_name}</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-violet-400 bg-violet-500/10"
                      : "text-gray-300 hover:text-white hover:bg-gray-800/60"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Auth Button */}
            <div className="flex items-center gap-3">
              {user ? (
                <Link href={dashboardHref}>
                  <button className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                    ড্যাশবোর্ড
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <button className="text-sm font-medium text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                      লগইন
                    </button>
                  </Link>
                  <Link href="/signup">
                    <button className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                      রেজিস্ট্রেশন
                    </button>
                  </Link>
                </div>
              )}

              {/* Mobile toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-800 bg-gray-900">
            <nav className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-violet-400 bg-violet-500/10"
                      : "text-gray-300 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-gray-900/80 border-t border-gray-800/60 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Col 1: Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-white">{settings.site_name}</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">{settings.site_tagline}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(settings.social_links).map(([platform, url]) => (
                  url ? <SocialIcon key={platform} platform={platform} url={url} /> : null
                ))}
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">দ্রুত লিংক</h3>
              <ul className="space-y-2.5">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-400 hover:text-violet-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Legal */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">নীতিমালা</h3>
              <ul className="space-y-2.5">
                {[
                  { href: "/privacy-policy", label: "গোপনীয়তা নীতি" },
                  { href: "/terms", label: "শর্তাবলী" },
                  { href: "/refund-policy", label: "রিফান্ড নীতি" },
                  { href: "/cookie-policy", label: "কুকি নীতি" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-gray-400 hover:text-violet-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Contact + Newsletter */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">যোগাযোগ</h3>
              <ul className="space-y-3 mb-6">
                {settings.contact_email && (
                  <li className="flex items-center gap-2 text-sm text-gray-400">
                    <Mail className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <a href={`mailto:${settings.contact_email}`} className="hover:text-violet-400 transition-colors break-all">
                      {settings.contact_email}
                    </a>
                  </li>
                )}
                {settings.contact_phone && (
                  <li className="flex items-center gap-2 text-sm text-gray-400">
                    <Phone className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <a href={`tel:${settings.contact_phone}`} className="hover:text-violet-400 transition-colors">
                      {settings.contact_phone}
                    </a>
                  </li>
                )}
                {settings.whatsapp_number && (
                  <li className="flex items-center gap-2 text-sm text-gray-400">
                    <MessageCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <a
                      href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-green-400 transition-colors"
                    >
                      WhatsApp
                    </a>
                  </li>
                )}
              </ul>

              {/* Newsletter */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">নিউজলেটার</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="আপনার ইমেইল"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors min-w-0"
                  />
                  <button
                    onClick={() => { if (email) { alert("ধন্যবাদ! সাবস্ক্রাইব হয়েছে।"); setEmail(""); } }}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800/60 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">{settings.footer_copyright}</p>
            <p className="text-xs text-gray-600">Made with ❤️ in Bangladesh</p>
          </div>
        </div>

        {/* WhatsApp floating button */}
        {settings.whatsapp_button_enabled && settings.whatsapp_number && (
          <a
            href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/40 transition-all hover:scale-110"
          >
            <MessageCircle className="w-7 h-7 text-white" />
          </a>
        )}
      </footer>
    </div>
  );
}
