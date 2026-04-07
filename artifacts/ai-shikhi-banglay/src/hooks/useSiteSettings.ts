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

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("key, value");
        if (data) {
          const map: Record<string, unknown> = {};
          data.forEach((row) => { map[row.key] = row.value; });
          setSettings({
            site_name: (map.site_name as string) || DEFAULTS.site_name,
            site_tagline: (map.site_tagline as string) || DEFAULTS.site_tagline,
            site_logo_url: (map.site_logo_url as string | null) ?? null,
            contact_email: (map.contact_email as string) || DEFAULTS.contact_email,
            contact_phone: (map.contact_phone as string | null) ?? null,
            whatsapp_number: (map.whatsapp_number as string | null) ?? null,
            whatsapp_button_enabled: Boolean(map.whatsapp_button_enabled),
            social_links: (map.social_links as SiteSettings["social_links"]) || {},
            footer_copyright: (map.footer_copyright as string) || DEFAULTS.footer_copyright,
            adsense_enabled: Boolean(map.adsense_enabled),
            adsense_publisher_id: (map.adsense_publisher_id as string | null) ?? null,
            adsense_header_id: (map.adsense_header_id as string | null) ?? null,
            adsense_mid_id: (map.adsense_mid_id as string | null) ?? null,
            adsense_sidebar_id: (map.adsense_sidebar_id as string | null) ?? null,
            adsense_footer_id: (map.adsense_footer_id as string | null) ?? null,
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
