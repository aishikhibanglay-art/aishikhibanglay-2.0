import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "course";
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  schema?: object | object[];
  noIndex?: boolean;
  lang?: string;
}

const SITE_NAME = "AI শিখি বাংলায়";
const SITE_URL = "https://aishikhibanglay.com";
const DEFAULT_IMAGE = `${SITE_URL}/opengraph.jpg`;
const DEFAULT_DESCRIPTION =
  "বাংলাদেশের #১ AI শিক্ষামূলক প্ল্যাটফর্ম। বাংলায় AI, ChatGPT, Python, Machine Learning, Data Science, ডিজিটাল মার্কেটিং শিখুন। বিশেষজ্ঞ শিক্ষকদের কাছ থেকে ভিডিও কোর্স, ভেরিফাইড সার্টিফিকেট ও লাইভ কমিউনিটি সাপোর্ট পান।";
const DEFAULT_KEYWORDS =
  "AI শিখি বাংলায়, বাংলায় AI শিক্ষা, ChatGPT বাংলা, Python বাংলায়, Machine Learning, Data Science, ডিজিটাল মার্কেটিং, অনলাইন কোর্স বাংলাদেশ, AI কোর্স, ফ্রিল্যান্সিং, বাংলা অনলাইন শিক্ষা, Artificial Intelligence";

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  publishedAt,
  modifiedAt,
  author = "AI শিখি বাংলায়",
  schema,
  noIndex = false,
  lang = "bn",
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — বাংলায় AI শিখুন, ভবিষ্যৎ গড়ুন`;
  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL;
  const ogImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description: DEFAULT_DESCRIPTION,
    sameAs: [
      "https://www.facebook.com/aishikhibanglay",
      "https://www.youtube.com/@aishikhibanglay",
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "BD",
      addressLocality: "Dhaka",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "info@aishikhibanglay.com",
      availableLanguage: ["Bengali", "English"],
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/courses?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const schemas = [orgSchema, websiteSchema, ...(schema ? (Array.isArray(schema) ? schema : [schema]) : [])];

  return (
    <Helmet>
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      {!noIndex && <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type === "article" ? "article" : "website"} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:locale" content="bn_BD" />
      <meta property="og:locale:alternate" content="en_US" />
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      {modifiedAt && <meta property="article:modified_time" content={modifiedAt} />}
      {author && type === "article" && <meta property="article:author" content={author} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@aishikhibanglay" />
      <meta name="twitter:creator" content="@aishikhibanglay" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={fullTitle} />

      {/* Extra meta for quality */}
      <meta name="theme-color" content="#7c3aed" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="geo.region" content="BD" />
      <meta name="geo.country" content="Bangladesh" />
      <meta name="language" content="Bengali" />
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="general" />

      {/* JSON-LD Structured Data */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}
