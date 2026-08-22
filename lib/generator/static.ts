import type { DesignTokens, SiteModel, SiteSection } from "@/lib/types";
import { legalIntro, legalSections } from "./model";

/* ------------------------------------------------------------------ */
/* Compact inline SVG icon set (mirrors the Lucide icons used in the   */
/* generated React site, so the preview stays visually consistent).    */
/* ------------------------------------------------------------------ */

const ICON_PATHS: Record<string, string> = {
  "map-pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  quote: '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4v1a2 2 0 0 1-2 2v2a4 4 0 0 0 4-4V5a2 2 0 0 0-2-2z"/><path d="M6 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4v1a2 2 0 0 1-2 2v2a4 4 0 0 0 4-4V5a2 2 0 0 0-2-2z"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2M9 2v2M15 20v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2"/>',
  "trending-up": '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  sparkles:
    '<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z"/>',
  compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  layers:
    '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  rocket:
    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  shield:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  table: '<path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
  palette:
    '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
};

function svgIcon(name?: string, className = "ic"): string {
  const inner = (name && ICON_PATHS[name]) || '<circle cx="12" cy="12" r="9"/>';
  return `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

function placeholderImg(seed: string, w: number, h: number): string {
  const palettes = [
    ["#6366f1", "#a855f7"], ["#0ea5e9", "#06b6d4"], ["#ec4899", "#f43f5e"],
    ["#f59e0b", "#f97316"], ["#10b981", "#14b8a6"], ["#8b5cf6", "#a78bfa"],
    ["#3b82f6", "#2563eb"], ["#ef4444", "#dc2626"], ["#14b8a6", "#2dd4bf"],
    ["#f97316", "#fb923c"],
  ];
  const [c1, c2] = palettes[Math.abs(hashStr(seed)) % palettes.length];
  const letter = seed.charAt(0).toUpperCase();
  const label = seed.length > 16 ? seed.substring(0, 16) + "…" : seed;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="g${Math.abs(hashStr(seed))}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="${w}" height="${h}" rx="12" fill="url(#g${Math.abs(hashStr(seed))})"/>
    <circle cx="${w * 0.75}" cy="${h * 0.25}" r="${Math.min(w, h) * 0.18}" fill="rgba(255,255,255,.1)"/>
    <circle cx="${w * 0.2}" cy="${h * 0.8}" r="${Math.min(w, h) * 0.25}" fill="rgba(255,255,255,.07)"/>
    <rect x="${w * 0.08}" y="${h * 0.65}" width="${w * 0.35}" height="6" rx="3" fill="rgba(255,255,255,.2)"/>
    <rect x="${w * 0.08}" y="${h * 0.75}" width="${w * 0.25}" height="6" rx="3" fill="rgba(255,255,255,.12)"/>
    <text x="50%" y="44%" font-family="system-ui,-apple-system,sans-serif" font-size="${Math.max(18, Math.min(36, w / 10))}" font-weight="700" fill="rgba(255,255,255,.85)" text-anchor="middle">${esc(letter)}</text>
    <text x="50%" y="58%" font-family="system-ui,-apple-system,sans-serif" font-size="${Math.max(10, Math.min(14, w / 28))}" fill="rgba(255,255,255,.55)" text-anchor="middle">${esc(label)}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/* ------------------------------------------------------------------ */
/* Lightweight EN/AR dictionary for the preview (UI chrome only —       */
/* user-authored headings keep their own text).                         */
/* ------------------------------------------------------------------ */

const I18N: Record<string, { en: string; ar: string }> = {
  get_started: { en: "Get started", ar: "ابدأ الآن" },
  trusted: { en: "Trusted local provider", ar: "مزوّد محلي موثوق" },
  open_new: { en: "Open for new work", ar: "متاحون لمشاريع جديدة" },
  people_served: { en: "People served", ar: "شخص خدمناهم" },
  commitment: { en: "Commitment", ar: "الالتزام" },
  learn_more: { en: "Learn more", ar: "اعرف المزيد" },
  read_article: { en: "Read article", ar: "اقرأ المقال" },
  back_blog: { en: "Back to blog", ar: "العودة إلى المدونة" },
  send_message: { en: "Send message", ar: "إرسال الرسالة" },
  your_name: { en: "Name", ar: "الاسم" },
  name_ph: { en: "Your name", ar: "اسمك" },
  your_email: { en: "Email", ar: "البريد الإلكتروني" },
  email_ph: { en: "you@example.com", ar: "you@example.com" },
  your_message: { en: "Message", ar: "الرسالة" },
  message_ph: { en: "Tell us about your enquiry", ar: "أخبرنا عن استفسارك" },
  blog: { en: "Blog", ar: "المدونة" },
  blog_updates: { en: "Latest updates & insights", ar: "أحدث التحديثات والرؤى" },
  terms: { en: "Terms & Services", ar: "الشروط والخدمات" },
  privacy: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  refund: { en: "Refund Policy", ar: "سياسة الاسترداد" },
  legal: { en: "Legal", ar: "قانوني" },
  updated: { en: "Last updated", ar: "آخر تحديث" },
  about: { en: "About us", ar: "من نحن" },
  services: { en: "Our services", ar: "خدماتنا" },
  learning: { en: "Learning", ar: "التعلّم" },
  our_work: { en: "Our work", ar: "أعمالنا" },
  testimonials: { en: "Testimonials", ar: "آراء العملاء" },
  pricing: { en: "Pricing", ar: "الأسعار" },
  faq: { en: "FAQ", ar: "الأسئلة الشائعة" },
  contact: { en: "Contact", ar: "تواصل معنا" },
  most_popular: { en: "Most popular", ar: "الأكثر طلباً" },
  per_month: { en: " / month", ar: " / شهرياً" },
  choose: { en: "Choose ", ar: "اختر " },
  whatsapp: { en: "Chat on WhatsApp", ar: "تواصل عبر واتساب" },
  all_rights: { en: "All rights reserved", ar: "جميع الحقوق محفوظة" },
};

function tn(key: string): string {
  return (I18N[key] || { en: key, ar: key }).en;
}


/* ------------------------------------------------------------------ */
/* Section renderers (static mirror of the React components)           */
/* ------------------------------------------------------------------ */

function renderHero(s: SiteSection, model: SiteModel, tokens: DesignTokens): string {
  const stats =
    s.stats && s.stats.length
      ? `<div class="hero-stats">${s.stats
          .map((st) => `<div><b>${esc(st.value)}</b><span>${esc(st.label)}</span></div>`)
          .join("")}</div>`
      : "";
  const ctas = `<div class="btn-row">
    ${s.cta ? `<a class="btn btn-primary btn-lg" href="${esc(s.cta.href)}">${esc(s.cta.label)} ${svgIcon("arrow-right")}</a>` : ""}
    ${s.ctaSecondary ? `<a class="btn btn-outline btn-lg" href="${esc(s.ctaSecondary.href)}">${esc(s.ctaSecondary.label)}</a>` : ""}
  </div>`;

  if (tokens.heroStyle === "centered") {
    return `<section id="hero" class="hero hero-centered">
      <span class="pill">${svgIcon("sparkles")} <span data-i18n="trusted">${esc(tn("trusted"))}</span></span>
      <h1>${esc(s.heading)}</h1>
      <p class="lead">${esc(s.sub || "")}</p>
      <img src="${placeholderImg(model.brand, 800, 320)}" alt="${esc(model.brand)}" class="hero-banner-img" />
      ${ctas}
      ${stats}
    </section>`;
  }
  if (tokens.heroStyle === "overlay") {
    return `<section id="hero" class="hero hero-overlay">
      <span class="pill pill-light">${svgIcon("sparkles")} <span data-i18n="trusted">${esc(tn("trusted"))}</span></span>
      <h1>${esc(s.heading)}</h1>
      <p class="lead">${esc(s.sub || "")}</p>
      ${ctas}
      ${stats}
    </section>`;
  }
  return `<section id="hero" class="hero hero-split">
    <div>
      <span class="pill">${svgIcon("sparkles")} <span data-i18n="trusted">${esc(tn("trusted"))}</span></span>
      <h1>${esc(s.heading)}</h1>
      <p class="lead">${esc(s.sub || "")}</p>
      ${ctas}
      ${stats}
    </div>
    <div class="hero-visual">
      <img src="${placeholderImg(model.brand, 560, 420)}" alt="${esc(model.brand)}" class="hero-img" />
      <div class="hero-card">
        <div class="hero-card-top">
          <span class="chip chip-dot"><span data-i18n="open_new">${esc(tn("open_new"))}</span></span>
          <span class="chip chip-star">${svgIcon("star")} 4.9 / 5</span>
        </div>
        <div>
          <div class="hero-logo">${esc(model.brand.charAt(0).toUpperCase())}</div>
          <p class="hero-card-text">${esc(model.tagline || model.brand)}</p>
        </div>
        <div class="hero-card-grid">
          <div><b>500+</b><span data-i18n="people_served">${esc(tn("people_served"))}</span></div>
          <div><b>100%</b><span data-i18n="commitment">${esc(tn("commitment"))}</span></div>
        </div>
      </div>
    </div>
  </section>`;
}

function renderAbout(s: SiteSection): string {
  return `<section id="${esc(s.id)}" class="section">
    <div class="wrap">
      <div class="section-head left">
        <p class="eyebrow" data-i18n="about">${esc(tn("about"))}</p>
        <h2>${esc(s.heading)}</h2>
        <p class="lead">${esc(s.sub || "")}</p>
      </div>
      <div class="grid grid-3">
        ${s.items
          .map(
            (item) => `<div class="card card-soft">
              <img src="${placeholderImg(item.title, 360, 160)}" alt="${esc(item.title)}" class="card-img" />
              <div class="icon-badge">${svgIcon(item.icon)}</div>
              <h3>${esc(item.title)}</h3>
              <p>${esc(item.text)}</p>
            </div>`
          )
          .join("")}
      </div>
      ${s.cta ? `<div class="mt-40"><a class="btn btn-outline" href="${esc(s.cta.href)}">${esc(s.cta.label)}</a></div>` : ""}
    </div>
  </section>`;
}

function renderServices(s: SiteSection): string {
  return `<section id="${esc(s.id)}" class="section alt">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow" data-i18n="services">${esc(tn("services"))}</p>
        <h2>${esc(s.heading)}</h2>
        <p class="lead">${esc(s.sub || "")}</p>
      </div>
      <div class="grid grid-3">
        ${s.items
          .map(
            (item) => `<div class="card">
              <img src="${placeholderImg(item.title, 360, 160)}" alt="${esc(item.title)}" class="card-img" />
              <div class="icon-badge">${svgIcon(item.icon)}</div>
              <h3>${esc(item.title)}</h3>
              <p>${esc(item.text)}</p>
            </div>`
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

function renderCourses(s: SiteSection): string {
  return `<section id="${esc(s.id)}" class="section">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow" data-i18n="learning">${esc(tn("learning"))}</p>
        <h2>${esc(s.heading)}</h2>
        <p class="lead">${esc(s.sub || "")}</p>
      </div>
      <div class="grid grid-3">
        ${s.items
          .map(
            (item) => `<a class="card card-link" href="#contact">
              <img src="${placeholderImg(item.title, 360, 160)}" alt="${esc(item.title)}" class="card-img" />
              <div class="card-top">
                <div class="icon-badge">${svgIcon(item.icon)}</div>
                ${item.meta ? `<span class="tag">${esc(item.meta)}</span>` : ""}
              </div>
              <h3>${esc(item.title)}</h3>
              <p>${esc(item.text)}</p>
              <span class="learn-more"><span data-i18n="learn_more">${esc(tn("learn_more"))}</span> ${svgIcon("arrow-right")}</span>
            </a>`
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

function renderPortfolio(s: SiteSection): string {
  return `<section id="${esc(s.id)}" class="section alt">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow" data-i18n="our_work">${esc(tn("our_work"))}</p>
        <h2>${esc(s.heading)}</h2>
        <p class="lead">${esc(s.sub || "")}</p>
      </div>
      <div class="grid grid-3">
        ${s.items
          .map(
            (item, i) => `<div class="card">
              <img src="${placeholderImg(item.title, 400, 220)}" alt="${esc(item.title)}" class="card-img" />
              <h3>${esc(item.title)}</h3>
              <p>${esc(item.text)}</p>
            </div>`
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

function renderTestimonials(s: SiteSection): string {
  return `<section id="${esc(s.id)}" class="section">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow" data-i18n="testimonials">${esc(tn("testimonials"))}</p>
        <h2>${esc(s.heading)}</h2>
        <p class="lead">${esc(s.sub || "")}</p>
      </div>
      <div class="grid grid-3">
        ${s.items
          .map(
            (item) => `<figure class="card card-soft quote-card">
              <div class="stars">${svgIcon("star")}${svgIcon("star")}${svgIcon("star")}${svgIcon("star")}${svgIcon("star")}</div>
              <blockquote>&ldquo;${esc(item.text)}&rdquo;</blockquote>
              <figcaption>
                <img src="${placeholderImg(item.title, 48, 48)}" alt="${esc(item.title)}" class="avatar-img" />
                <div><b>${esc(item.title)}</b>${item.meta ? `<small>${esc(item.meta)}</small>` : ""}</div>
              </figcaption>
            </figure>`
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

function renderPricing(s: SiteSection): string {
  return `<section id="${esc(s.id)}" class="section alt">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow" data-i18n="pricing">${esc(tn("pricing"))}</p>
        <h2>${esc(s.heading)}</h2>
        <p class="lead">${esc(s.sub || "")}</p>
      </div>
      <div class="grid grid-3">
        ${s.items
          .map((item, i) => {
            const featured = i === 1;
            return `<div class="card${featured ? " card-featured" : ""}">
              ${featured ? `<span class="badge" data-i18n="most_popular">${esc(tn("most_popular"))}</span>` : ""}
              <h3>${esc(item.title)}</h3>
              ${item.meta ? `<p class="price">${esc(item.meta)}<small data-i18n="per_month">${esc(tn("per_month"))}</small></p>` : ""}
              <p>${esc(item.text)}</p>
              <ul class="features">
                <li>${svgIcon("check")} Full access to core services</li>
                <li>${svgIcon("check")} Priority email support</li>
                <li>${svgIcon("check")} Free consultation call</li>
              </ul>
              <a class="btn ${featured ? "btn-primary" : "btn-outline"} btn-block" href="#contact"><span data-i18n="choose">${esc(tn("choose"))}</span> ${esc(item.title)}</a>
            </div>`;
          })
          .join("")}
      </div>
    </div>
  </section>`;
}

function renderFaq(s: SiteSection): string {
  return `<section id="${esc(s.id)}" class="section">
    <div class="wrap narrow">
      <div class="section-head">
        <p class="eyebrow" data-i18n="faq">${esc(tn("faq"))}</p>
        <h2>${esc(s.heading)}</h2>
        <p class="lead">${esc(s.sub || "")}</p>
      </div>
      <div class="faq-list">
        ${(s.faqs ?? [])
          .map(
            (f) => `<details class="faq" open>
              <summary>${esc(f.q)}</summary>
              <p>${esc(f.a)}</p>
            </details>`
          )
          .join("")}
      </div>
    </div>
  </section>`;
}

function renderContact(s: SiteSection): string {
  return `<section id="contact" class="section alt">
    <div class="wrap">
      <div class="section-head">
        <p class="eyebrow" data-i18n="contact">${esc(tn("contact"))}</p>
        <h2>${esc(s.heading)}</h2>
        <p class="lead">${esc(s.sub || "")}</p>
      </div>
      <div class="grid grid-2 contact-grid">
        <div class="contact-info">
          ${s.items
            .map(
              (item) => `<div class="contact-row">
                <div class="icon-badge">${svgIcon(item.icon)}</div>
                <div><b>${esc(item.title)}</b><p>${esc(item.text)}</p></div>
              </div>`
            )
            .join("")}
        </div>
        <form class="card contact-form" onsubmit="return false;">
          <label><span data-i18n="your_name">${esc(tn("your_name"))}</span><input placeholder="${esc(tn("name_ph"))}" required/></label>
          <label><span data-i18n="your_email">${esc(tn("your_email"))}</span><input type="email" placeholder="${esc(tn("email_ph"))}" required/></label>
          <label><span data-i18n="your_message">${esc(tn("your_message"))}</span><textarea rows="4" placeholder="${esc(tn("message_ph"))}" required></textarea></label>
          <button class="btn btn-primary btn-block" type="submit" data-i18n="send_message">${esc(tn("send_message"))}</button>
        </form>
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------------ */
/* Full document                                                       */
/* ------------------------------------------------------------------ */

export function renderPreviewHtml(model: SiteModel, tokens: DesignTokens): string {
  const nav = model.nav
    .map((item) =>
      item.href.startsWith("/")
        ? `<a href="#${esc(item.href.slice(1))}" data-page="${esc(item.href.slice(1))}">${esc(item.label)}</a>`
        : `<a href="${esc(item.href)}">${esc(item.label)}</a>`
    )
    .join("");

  const sections = model.sections
    .map((s) => {
      switch (s.type) {
        case "hero":
          return renderHero(s, model, tokens);
        case "about":
          return renderAbout(s);
        case "services":
          return renderServices(s);
        case "courses":
          return renderCourses(s);
        case "portfolio":
          return renderPortfolio(s);
        case "testimonials":
          return renderTestimonials(s);
        case "pricing":
          return renderPricing(s);
        case "faq":
          return renderFaq(s);
        case "contact":
          return renderContact(s);
        default:
          return "";
      }
    })
    .join("\n");

  const year = new Date().getFullYear();
  const blog = renderBlogPreview(model);
  const terms = renderLegalPreview("terms", model);
  const privacy = renderLegalPreview("privacy", model);
  const refund = renderLegalPreview("refund", model);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(model.metaTitle)} — Preview</title>
<style>
${css(tokens)}
</style>
</head>
<body>
<header class="site-header">
  <div class="wrap header-inner">
    <a href="#top" class="brand">
      <span class="brand-mark">${esc(model.brand.charAt(0).toUpperCase())}</span>
      <span>${esc(model.brand)}</span>
    </a>
    <nav class="nav">${nav}</nav>
    <div class="header-actions">
      <button type="button" class="lang-toggle" id="lang-toggle" aria-label="Switch language">ع</button>
      <a class="btn btn-primary btn-sm" href="#contact" data-i18n="get_started">${esc(tn("get_started"))}</a>
    </div>
  </div>
</header>
<main id="top" data-pageview="home">
${sections}
</main>
${blog}
${terms}
${privacy}
${refund}
<footer class="site-footer">
  <div class="wrap footer-inner">
    <div class="brand"><span class="brand-mark">${esc(model.brand.charAt(0).toUpperCase())}</span><span>${esc(model.brand)}</span></div>
    <nav class="nav">${nav}</nav>
  </div>
  <div class="wrap footer-legal">
    <a href="#blog" data-page="blog" data-i18n="blog">${esc(tn("blog"))}</a>
    <span class="dot" aria-hidden="true">·</span>
    <a href="#terms" data-page="terms" data-i18n="terms">${esc(tn("terms"))}</a>
    <span class="dot" aria-hidden="true">·</span>
    <a href="#privacy" data-page="privacy" data-i18n="privacy">${esc(tn("privacy"))}</a>
    <span class="dot" aria-hidden="true">·</span>
    <a href="#refund" data-page="refund" data-i18n="refund">${esc(tn("refund"))}</a>
  </div>
  <div class="wrap footer-copy">&copy; ${year} ${esc(model.brand)}. <span data-i18n="all_rights">${esc(tn("all_rights"))}</span>.</div>
</footer>
<a class="whatsapp-float" href="https://wa.me/${esc(model.whatsappDigits)}" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
  ${whatsappIcon()}
</a>
<script>
${routerScript()}
</script>
<script>
${i18nScript()}
</script>
</body>
</html>
`;
}

function whatsappIcon(): string {
  return `<svg class="wa-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`;
}

/* ------------------------------------------------------------------ */
/* Blog + legal page views (toggled by the in-preview page switcher)   */
/* ------------------------------------------------------------------ */

function renderBlogPreview(model: SiteModel): string {
  const cards = model.blog
    .map(
      (p) => `<a class="card card-link" href="#post-${esc(p.slug)}" data-page="post-${esc(p.slug)}">
        <div class="card-top">
          <span class="tag">${esc(p.tag)}</span>
          <time class="card-date">${esc(p.date)}</time>
        </div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.excerpt)}</p>
        <span class="learn-more"><span data-i18n="read_article">${esc(tn("read_article"))}</span> ${svgIcon("arrow-right")}</span>
      </a>`
    )
    .join("");

  const posts = model.blog
    .map(
      (p) => `    <article id="page-post-${esc(p.slug)}" data-pageview="post-${esc(p.slug)}" hidden class="page">
    <div class="wrap narrow page-pad">
      <a href="#blog" data-page="blog" class="back-link"><span data-i18n="back_blog">${esc(tn("back_blog"))}</span> &larr;</a>
      <div class="card-top post-meta"><span class="tag">${esc(p.tag)}</span><time class="card-date">${esc(p.date)}</time></div>
      <h1 class="page-title">${esc(p.title)}</h1>
      <div class="post-body">
${p.body.map((para) => `        <p>${esc(para)}</p>`).join("\n")}
      </div>
    </div>
  </article>`
    )
    .join("\n");

  return `<main id="page-blog" data-pageview="blog" hidden class="page">
  <div class="wrap page-pad">
    <p class="eyebrow" data-i18n="blog">${esc(tn("blog"))}</p>
    <h1 class="page-title" data-i18n="blog_updates">${esc(tn("blog_updates"))}</h1>
    <p class="lead">${esc(model.tagline)}</p>
    <div class="grid grid-3 blog-grid">${cards}</div>
  </div>
</main>
${posts}`;
}

function renderLegalPreview(page: "terms" | "privacy" | "refund", model: SiteModel): string {
  const titles: Record<string, string> = {
    terms: tn("terms"),
    privacy: tn("privacy"),
    refund: tn("refund"),
  };
  const title = titles[page];
  const sections = legalSections(page, model.brand)
    .map(
      ({ heading, text }) => `    <section class="legal-section">
      <h2>${esc(heading)}</h2>
      <p>${esc(text)}</p>
    </section>`
    )
    .join("\n");

  return `<main id="page-${page}" data-pageview="${page}" hidden class="page">
  <div class="wrap narrow page-pad">
    <p class="eyebrow" data-i18n="legal">${esc(tn("legal"))}</p>
    <h1 class="page-title" data-i18n="${page}">${esc(title)}</h1>
    <p class="updated"><span data-i18n="updated">${esc(tn("updated"))}</span>: 15 Feb 2025</p>
    <p class="intro">${esc(legalIntro(page, model.brand))}</p>
    ${sections}
  </div>
</main>`;
}

function routerScript(): string {
  return `(function () {
  var views = document.querySelectorAll("[data-pageview]");
  function show(id) {
    views.forEach(function (v) {
      v.hidden = v.getAttribute("data-pageview") !== id;
    });
    window.scrollTo({ top: 0 });
  }
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    var page = a.getAttribute("data-page");
    if (page) {
      e.preventDefault();
      show(page);
      return;
    }
    var href = a.getAttribute("href") || "";
    if (href.charAt(0) === "#" && href.length > 1) {
      var home = document.querySelector('[data-pageview="home"]');
      if (home && home.hidden) {
        home.hidden = false;
        views.forEach(function (v) {
          if (v !== home) v.hidden = true;
        });
      }
    }
  });
  if (location.hash.indexOf("#post-") === 0) {
    show(location.hash.slice(1));
  }
})();`;
}

function i18nScript(): string {
  const dict = Object.entries(I18N).map(
    ([k, v]) => `${JSON.stringify(k)}:{en:${JSON.stringify(v.en)},ar:${JSON.stringify(v.ar)}}`
  );
  return `(function () {
  var dict = { ${dict.join(",")} };
  var KEY = "preview-lang";
  var lang = "en";
  try { var saved = localStorage.getItem(KEY); if (saved === "ar" || saved === "en") lang = saved; } catch (e) {}
  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var entry = dict[key];
      if (entry) el.textContent = entry[lang];
    });
    var btn = document.getElementById("lang-toggle");
    if (btn) btn.textContent = lang === "ar" ? "EN" : "ع";
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }
  var btn = document.getElementById("lang-toggle");
  if (btn) {
    btn.addEventListener("click", function () {
      lang = lang === "en" ? "ar" : "en";
      apply();
    });
  }
  apply();
})();`;
}

/* ------------------------------------------------------------------ */
/* Stylesheet                                                          */
/* ------------------------------------------------------------------ */

function css(tokens: DesignTokens): string {
  return `
:root {
  --accent: ${tokens.accent};
  --accent-rgb: ${tokens.accentRgb};
  --accent-soft: ${tokens.accentSoft};
  --on-accent: ${tokens.onAccent};
  --radius: ${tokens.radius};
  --ink: #0f172a;
  --ink-soft: #475569;
  --paper: #ffffff;
  --paper-soft: #f8fafc;
  --border: #e2e8f0;
  --font-serif: Georgia, "Times New Roman", serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, sans-serif; color: var(--ink); background: var(--paper); line-height: 1.6; -webkit-font-smoothing: antialiased; }
a { text-decoration: none; color: inherit; }
img, svg { display: inline-block; vertical-align: middle; }
h1, h2, h3 { line-height: 1.15; letter-spacing: -0.02em; text-wrap: balance; }
p { color: var(--ink-soft); }
::selection { background: var(--accent-soft); }

.wrap { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
.wrap.narrow { max-width: 780px; }
.mt-40 { margin-top: 40px; }

/* Header */
.site-header { position: sticky; top: 0; z-index: 40; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.88); backdrop-filter: blur(10px); }
.header-inner { display: flex; align-items: center; justify-content: space-between; height: 64px; gap: 16px; }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 15px; }
.brand-mark { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: var(--accent); color: var(--on-accent); font-weight: 700; }
.nav { display: flex; gap: 24px; }
.nav a { font-size: 14px; font-weight: 500; color: var(--ink-soft); transition: color .2s; }
.nav a:hover { color: var(--accent); }

/* Buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border-radius: var(--radius); font-weight: 500; font-size: 14px; padding: 11px 20px; border: 1px solid transparent; cursor: pointer; transition: all .2s; }
.btn svg { width: 16px; height: 16px; }
.btn-primary { background: var(--accent); color: var(--on-accent); box-shadow: 0 1px 2px rgba(0,0,0,.08); }
.btn-primary:hover { opacity: .9; }
.btn-outline { border-color: #cbd5e1; color: var(--ink); background: var(--paper); }
.btn-outline:hover { border-color: var(--accent); color: var(--accent); }
.btn-sm { padding: 8px 14px; font-size: 13px; }
.btn-lg { padding: 14px 26px; font-size: 15px; }
.btn-block { width: 100%; }
.btn-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }

/* Section scaffolding */
.section { padding: 96px 0; }
.section.alt { background: var(--paper-soft); }
.section-head { max-width: 640px; margin: 0 auto 48px; text-align: center; }
.section-head.left { margin-left: 0; text-align: left; }
.eyebrow { color: var(--accent); font-size: 12px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; margin-bottom: 12px; }
.section-head h2 { font-size: clamp(28px, 4vw, 40px); font-weight: 700; }
.section-head .lead { margin-top: 16px; font-size: 16px; }

/* Grids + cards */
.grid { display: grid; gap: 24px; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
@media (max-width: 900px) { .grid-3 { grid-template-columns: repeat(2, 1fr); } .grid-2 { grid-template-columns: 1fr; } }
@media (max-width: 620px) { .grid-3, .grid-2 { grid-template-columns: 1fr; } .section { padding: 64px 0; } .nav { display: none; } }

.card { border: 1px solid var(--border); background: var(--paper); border-radius: var(--radius); padding: 28px; transition: transform .25s, box-shadow .25s; }
.card-soft { background: var(--paper-soft); }
.card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px -12px rgba(15,23,42,.18); }
.card-link { display: flex; flex-direction: column; }
.icon-badge { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; background: var(--accent-soft); color: var(--accent); margin-bottom: 20px; }
.icon-badge svg { width: 24px; height: 24px; }
.card h3 { font-size: 19px; margin-bottom: 10px; }
.card p { font-size: 14px; }
.card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.tag { background: var(--accent-soft); color: var(--accent); font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; }
.learn-more { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px; font-size: 14px; font-weight: 600; color: var(--accent); }
.learn-more svg { width: 16px; height: 16px; }

/* Hero */
.hero { position: relative; overflow: hidden; border-bottom: 1px solid var(--border); }
.hero::before { content: ""; position: absolute; inset: 0; background: radial-gradient(60% 50% at 50% 0%, var(--accent-soft), transparent 70%); pointer-events: none; }
.hero-centered { max-width: 840px; margin: 0 auto; padding: 96px 24px 96px; text-align: center; }
.hero-centered h1, .hero-overlay h1 { font-size: clamp(36px, 6vw, 60px); font-weight: 700; margin-top: 28px; }
.hero-centered .lead, .hero-overlay .lead { max-width: 640px; margin: 24px auto 0; font-size: 18px; }
.hero-split { display: grid; grid-template-columns: 1.1fr .9fr; gap: 48px; align-items: center; padding: 80px 24px 80px; max-width: 1120px; margin: 0 auto; }
.hero-split h1 { font-size: clamp(34px, 5vw, 56px); font-weight: 700; margin-top: 24px; }
.hero-split .lead { max-width: 520px; margin-top: 24px; font-size: 17px; }
@media (max-width: 900px) { .hero-split { grid-template-columns: 1fr; } }
.pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px; background: var(--accent-soft); color: var(--accent); font-size: 12px; font-weight: 600; }
.pill svg { width: 14px; height: 14px; }
.pill-light { background: rgba(255,255,255,.12); color: #fff; border: 1px solid rgba(255,255,255,.25); }
.hero-stats { display: flex; flex-wrap: wrap; gap: 32px; margin-top: 40px; }
.hero-centered .hero-stats, .hero-overlay .hero-stats { justify-content: center; max-width: 640px; margin: 56px auto 0; }
.hero-stats b { display: block; font-size: 24px; }
.hero-stats span { font-size: 13px; color: var(--ink-soft); }
.hero-overlay { max-width: 840px; margin: 0 auto; padding: 96px 24px 96px; text-align: center; color: #fff; }
.hero-overlay { background: #020617; }
.hero-overlay::before { background: radial-gradient(80% 70% at 50% 0%, var(--accent), transparent 65%); opacity: .65; }
.hero-overlay h1 { color: #fff; }
.hero-overlay .lead { color: rgba(255,255,255,.78); }
.hero-overlay .hero-stats { border-top: 1px solid rgba(255,255,255,.2); padding-top: 32px; }
.hero-overlay .hero-stats b { color: #fff; }
.hero-overlay .hero-stats span { color: rgba(255,255,255,.6); }
.hero-visual { position: relative; }
.hero-visual::before { content: ""; position: absolute; inset: -16px; border-radius: 32px; background: linear-gradient(to top right, rgba(var(--accent-rgb),.25), transparent 60%); filter: blur(28px); }
.hero-card { position: relative; border-radius: 28px; border: 1px solid var(--border); background: linear-gradient(to bottom right, var(--accent), #0f172a); color: #fff; padding: 32px; box-shadow: 0 25px 50px -12px rgba(2,6,23,.5); display: flex; flex-direction: column; justify-content: space-between; gap: 48px; min-height: 380px; }
.hero-card-top { display: flex; align-items: center; justify-content: space-between; }
.chip { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; background: rgba(255,255,255,.15); padding: 6px 12px; font-size: 12px; backdrop-filter: blur(4px); }
.chip-dot::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: #34d399; }
.chip-star svg { width: 14px; height: 14px; fill: #fcd34d; color: #fcd34d; }
.hero-logo { display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 16px; background: rgba(255,255,255,.15); font-weight: 700; font-size: 24px; }
.hero-card-text { color: #fff; font-size: 20px; font-weight: 600; margin-top: 20px; max-width: 320px; }
.hero-card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.hero-card-grid div { background: rgba(255,255,255,.1); border-radius: 12px; padding: 16px; }
.hero-card-grid b { display: block; font-size: 18px; }
.hero-card-grid span { font-size: 12px; color: rgba(255,255,255,.7); }

/* Portfolio media */
.hero-img { display: block; width: 100%; border-radius: 20px; box-shadow: 0 20px 50px -15px rgba(15,23,42,.25); margin-bottom: 16px; }
.hero-banner-img { display: block; width: 100%; max-width: 800px; margin: 32px auto 0; border-radius: 16px; box-shadow: 0 20px 50px -15px rgba(15,23,42,.2); }
.card-img { display: block; width: 100%; height: 180px; object-fit: cover; border-radius: 12px; margin-bottom: 16px; }
.avatar-img { display: block; width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-soft); }
.card-media { position: relative; display: flex; align-items: center; justify-content: center; height: 144px; border-radius: 12px; background: linear-gradient(to bottom right, rgba(var(--accent-rgb),.25), var(--paper) 70%, rgba(var(--accent-rgb),.1)); color: var(--accent); margin-bottom: 20px; }
.card-media svg { width: 40px; height: 40px; }
.card-index { position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,.85); padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }

/* Testimonials */
.quote-card blockquote { margin-top: 16px; font-size: 14px; }
.quote-card figcaption { display: flex; align-items: center; gap: 12px; margin-top: 24px; }
.quote-card figcaption small { display: block; color: var(--ink-soft); font-size: 12px; }
.avatar { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-weight: 700; }
.stars svg { width: 16px; height: 16px; fill: #fbbf24; color: #fbbf24; }
.stars { display: flex; gap: 2px; }

/* Pricing */
.card-featured { position: relative; border-color: var(--accent); box-shadow: 0 20px 45px -15px rgba(2,6,23,.25); }
.badge { position: absolute; top: -13px; left: 50%; transform: translateX(-50%); background: var(--accent); color: var(--on-accent); font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 999px; }
.price { font-size: 30px; font-weight: 700; color: var(--ink); margin: 8px 0 12px; }
.price small { font-size: 14px; font-weight: 400; color: var(--ink-soft); }
.features { list-style: none; margin: 20px 0; display: grid; gap: 10px; }
.features li { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.features svg { width: 16px; height: 16px; color: var(--accent); }
.features p { color: var(--ink-soft); }

/* FAQ */
.faq-list { display: grid; gap: 12px; }
.faq { border: 1px solid var(--border); border-radius: var(--radius); background: var(--paper); }
.faq summary { cursor: pointer; padding: 18px 20px; font-weight: 600; font-size: 15px; list-style: none; }
.faq summary::-webkit-details-marker { display: none; }
.faq summary::after { content: "▾"; float: right; color: var(--ink-soft); }
.faq[open] summary::after { content: "▴"; }
.faq p { border-top: 1px solid var(--border); padding: 16px 20px; font-size: 14px; }

/* Contact */
.contact-grid { align-items: start; }
.contact-info { display: grid; gap: 16px; }
.contact-row { display: flex; align-items: flex-start; gap: 16px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--paper); padding: 20px; }
.contact-row .icon-badge { margin-bottom: 0; flex-shrink: 0; }
.contact-row b { font-size: 14px; }
.contact-row p { font-size: 14px; margin-top: 2px; }
.contact-form { display: grid; gap: 16px; }
.contact-form label { display: grid; gap: 6px; font-size: 14px; font-weight: 500; }
.contact-form input, .contact-form textarea { width: 100%; border: 1px solid #cbd5e1; border-radius: var(--radius); padding: 11px 14px; font: inherit; font-size: 14px; outline: none; transition: border-color .2s, box-shadow .2s; }
.contact-form input:focus, .contact-form textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.contact-form textarea { resize: none; }

/* Footer */
.site-footer { border-top: 1px solid var(--border); background: var(--paper); }
.footer-inner { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-top: 40px; padding-bottom: 40px; flex-wrap: wrap; }
.footer-legal { display: flex; align-items: center; justify-content: center; gap: 14px; border-top: 1px solid var(--border); padding-top: 18px; padding-bottom: 18px; font-size: 12px; color: var(--ink-soft); flex-wrap: wrap; }
.footer-legal a { transition: color .2s; }
.footer-legal a:hover { color: var(--accent); }
.footer-legal .dot { color: #cbd5e1; }
.footer-copy { border-top: 1px solid var(--border); padding-top: 16px; padding-bottom: 20px; text-align: center; font-size: 12px; color: var(--ink-soft); }

/* Pages (blog / terms / privacy) */
.page[hidden] { display: none; }
.page-pad { padding: 72px 24px 96px; }
.page-title { font-size: clamp(28px, 4vw, 40px); font-weight: 700; }
.page .lead { margin-top: 16px; font-size: 16px; }
.updated { margin-top: 14px; font-size: 13px; color: var(--ink-soft); }
.intro { margin-top: 24px; font-size: 15px; }
.blog-grid { margin-top: 40px; }
.card-date { color: var(--ink-soft); }
.post-meta { margin-top: 32px; justify-content: flex-start; gap: 12px; }
.post-meta .tag, .card-top .tag { margin-bottom: 0; }
.post-body { margin-top: 24px; display: grid; gap: 18px; }
.post-body p { font-size: 15px; }
.back-link { display: inline-block; margin-bottom: 24px; font-size: 14px; font-weight: 600; color: var(--accent); }
.legal-section { margin-top: 32px; }
.legal-section h2 { font-size: 19px; font-weight: 700; }
.legal-section p { margin-top: 10px; font-size: 14px; }

/* Header actions + language toggle */
.header-actions { display: flex; align-items: center; gap: 10px; }
.lang-toggle { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 8px; border: 1px solid #cbd5e1; background: var(--paper); color: var(--ink); font-size: 15px; font-weight: 600; cursor: pointer; transition: border-color .2s, color .2s; }
.lang-toggle:hover { border-color: var(--accent); color: var(--accent); }

/* WhatsApp float */
.whatsapp-float { position: fixed; right: 20px; bottom: 20px; z-index: 60; display: flex; align-items: center; justify-content: center; width: 54px; height: 54px; border-radius: 50%; background: #25D366; color: #fff; box-shadow: 0 8px 24px -6px rgba(37, 211, 102, .6); transition: transform .2s; }
.whatsapp-float:hover { transform: scale(1.08); }
.whatsapp-float .wa-icon { width: 28px; height: 28px; }

/* RTL refinements */
html[dir="rtl"] .whatsapp-float { right: auto; left: 20px; }
html[dir="rtl"] .faq summary::after { float: left; }
html[dir="rtl"] .learn-more, html[dir="rtl"] .back-link { flex-direction: row-reverse; }
`;
}
