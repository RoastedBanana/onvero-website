"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnveroLogo, OnveroIcon } from "@/components/ui/onvero-logo";
import { useLanguage, useTranslation } from "@/lib/language-context";

function parseCookieUser(): { firstName: string; lastName: string } | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/onvero_user=([^;]+)/);
  if (!match) return null;
  try { return JSON.parse(decodeURIComponent(match[1])); } catch { return null; }
}

const NAV_ITEMS = [
  { id: "hero",       de: "Home",        en: "Home",         href: "/",            section: "hero"       },
  { id: "leistungen", de: "Leistungen",  en: "Services",     href: "/#leistungen", section: "leistungen" },
  { id: "projekte",   de: "Referenzen",  en: "References",   href: "/#projekte",   section: "projekte"   },
  { id: "chatbot",    de: "Fragen",      en: "FAQ",          href: "/#chatbot",    section: "chatbot"    },
  { id: "ueber-uns",  de: "Über uns",    en: "About us",     href: "/ueber-uns",   section: null         },
];

export function Navbar() {
  const pathname = usePathname();
  const { lang, setLang } = useLanguage();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("hero");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<{ firstName: string; lastName: string } | null>(null);

  useEffect(() => {
    setLoggedInUser(parseCookieUser());
  }, []);

  // Scroll shadow
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Active section tracking
  useEffect(() => {
    if (pathname === "/ueber-uns") {
      setActiveTab("ueber-uns");
      return;
    }
    if (pathname !== "/") return;

    const sectionIds = NAV_ITEMS.filter((i) => i.section).map((i) => i.section!);
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveTab(id);
        },
        { rootMargin: "-35% 0px -45% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl" : "bg-transparent"
      }`}
      style={
        scrolled
          ? { borderBottom: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(15,15,15,0.85)" }
          : {}
      }
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center" aria-label="Onvero" onClick={() => setActiveTab("hero")}>
          <OnveroLogo className="hidden md:block h-10 w-auto" />
          <OnveroIcon className="md:hidden h-10 w-auto" />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const label = lang === "de" ? item.de : item.en;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setActiveTab(item.id)}
                className="relative px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200"
                style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.45)" }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                }}
              >
                {label}
                {isActive && (
                  <motion.span
                    layoutId="lamp"
                    className="absolute inset-0 rounded-full -z-10"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    {/* Lamp glow — points downward for top-mounted navbar */}
                    <span
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full"
                      style={{ backgroundColor: "rgba(255,255,255,0.55)" }}
                    >
                      <span
                        className="absolute w-14 h-8 rounded-full -left-3 top-0"
                        style={{ backgroundColor: "rgba(255,255,255,0.12)", filter: "blur(8px)" }}
                      />
                    </span>
                  </motion.span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: language toggle + CTA */}
        <div className="hidden md:flex items-center gap-3">
          {/* DE · EN pill */}
          <button
            onClick={() => setLang(lang === "de" ? "en" : "de")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-200"
            style={{ border: "1px solid rgba(255,255,255,0.12)", background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
          >
            <span style={{ color: lang === "de" ? "#ffffff" : "rgba(255,255,255,0.35)" }}>DE</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <span style={{ color: lang === "en" ? "#ffffff" : "rgba(255,255,255,0.35)" }}>EN</span>
          </button>

          {/* CTA */}
          <Button
            asChild
            className="bg-white hover:bg-white/90 text-black text-sm font-semibold border-0 rounded-xl px-5 shadow-lg shadow-black/30"
          >
            <Link href="/buchen">
              {t("Erstgespräch buchen →", "Book a call →")}
            </Link>
          </Button>

          {/* Anmelden / Dashboard */}
          {loggedInUser ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              style={{
                color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
            >
              {loggedInUser.firstName} →
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              style={{
                color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; }}
            >
              Anmelden
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden transition-colors"
          style={{ color: "rgba(255,255,255,0.6)" }}
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden backdrop-blur-xl px-6 py-5 flex flex-col gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(15,15,15,0.95)" }}
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="text-sm font-medium py-2 transition-colors"
              style={{ color: activeTab === item.id ? "#ffffff" : "rgba(255,255,255,0.55)" }}
              onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
            >
              {lang === "de" ? item.de : item.en}
            </Link>
          ))}

          <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => setLang(lang === "de" ? "en" : "de")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ border: "1px solid rgba(255,255,255,0.12)", background: "transparent" }}
            >
              <span style={{ color: lang === "de" ? "#ffffff" : "rgba(255,255,255,0.35)" }}>DE</span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
              <span style={{ color: lang === "en" ? "#ffffff" : "rgba(255,255,255,0.35)" }}>EN</span>
            </button>
            <Button
              asChild
              className="bg-white hover:bg-white/90 text-black text-sm font-semibold border-0 rounded-xl flex-1"
            >
              <Link href="/buchen" onClick={() => setMobileOpen(false)}>
                {t("Erstgespräch buchen →", "Book a call →")}
              </Link>
            </Button>
            <Link
              href={loggedInUser ? "/dashboard" : "/login"}
              className="text-sm font-medium py-2 px-4 rounded-xl"
              style={{ color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.12)" }}
              onClick={() => setMobileOpen(false)}
            >
              {loggedInUser ? `${loggedInUser.firstName} →` : "Anmelden"}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
