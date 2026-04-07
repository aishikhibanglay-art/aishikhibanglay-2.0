import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface SiteSettings {
  site_name: string;
  site_tagline: string;
  site_logo_url: string | null;
  contact_email: string;
  contact_phone: string | null;
  whatsapp_number: string | null;
  whatsapp_button_enabled: boolean;
  social_links: {
    facebook?: string;
    youtube?: string;
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
    twitter?: string;
  };
  footer_copyright: string;
  adsense_enabled: boolean;
  adsense_publisher_id: string | null;
  adsense_header_id: string | null;
  adsense_mid_id: string | null;
  adsense_sidebar_id: string | null;
  adsense_footer_id: string | null;
}

const DEFAULTS: SiteSettings = {
  site_name: "AI শিখি বাংলায়",
  site_tagline: "বাংলায় AI শিখুন, ভবিষ্যৎ গড়ুন",
  site_logo_url: null,
  contact_email: "info@aishikhibanglay.com",
  contact_phone: null,
  whatsapp_number: null,
  whatsapp_button_enabled: false,
  social_links: {},
  footer_copyright: "© 2025 AI শিখি বাংলায়। সর্বস্বত্ব সংরক্ষিত।",
  adsense_enabled: false,
  adsense_publisher_id: null,
  adsense_header_id: null,
  adsense_mid_id: null,
  adsense_sidebar_id: null,
  adsense_footer_id: null,
};

// Parse a DB value: could be JSON string or raw string
function parseVal(raw: unknown): unknown {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

// Safely get a string or null (never returns "null" string)
function str(v: unknown, fallback: string): string {
  const parsed = parseVal(v);
  if (parsed === null || parsed === undefined || parsed === "null") return fallback;
  return String(parsed);
}
function strOrNull(v: unknown): string | null {
  const parsed = parseVal(v);
  if (parsed === null || parsed === undefined || parsed === "null") return null;
  const s = String(parsed);
  if (s === "null" || s === "undefined" || s === "") return null;
  return s;
}
function bool(v: unknown): boolean {
  const parsed = parseVal(v);
  return parsed === true || parsed === "true" || parsed === 1;
}
function obj<T extends object>(v: unknown, fallback: T): T {
  const parsed = parseVal(v);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as T;
  return fallback;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase.from("site_settings").select("key, value");
        if (data) {
          const map: Record<string, unknown> = {};
          data.forEach((row) => { map[row.key] = row.value; });
          setSettings({
            site_name: str(map.site_name, DEFAULTS.site_name),
            site_tagline: str(map.site_tagline, DEFAULTS.site_tagline),
            site_logo_url: strOrNull(map.site_logo_url),
            contact_email: str(map.contact_email, DEFAULTS.contact_email),
            contact_phone: strOrNull(map.contact_phone),
            whatsapp_number: strOrNull(map.whatsapp_number),
            whatsapp_button_enabled: bool(map.whatsapp_button_enabled),
            social_links: obj(map.social_links, {}),
            footer_copyright: str(map.footer_copyright, DEFAULTS.footer_copyright),
            adsense_enabled: bool(map.adsense_enabled),
            adsense_publisher_id: strOrNull(map.adsense_publisher_id),
            adsense_header_id: strOrNull(map.adsense_header_id),
            adsense_mid_id: strOrNull(map.adsense_mid_id),
            adsense_sidebar_id: strOrNull(map.adsense_sidebar_id),
            adsense_footer_id: strOrNull(map.adsense_footer_id),
          });
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { settings, loading };
}
