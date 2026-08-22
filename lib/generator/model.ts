import type {
  BlogPost,
  ProjectInfo,
  ShopProduct,
  SiteFaq,
  SiteItem,
  SiteModel,
  SiteSection,
  SiteStats,
  TeamMember,
  SectionType,
} from "@/lib/types";
import { slugify } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Section detection — driven by project type + details + explicit req */
/* ------------------------------------------------------------------ */

const INDUSTRY_SECTIONS: Record<string, SectionType[]> = {
  education: ["courses", "about", "testimonials", "contact"],
  technology: ["services", "about", "portfolio", "contact"],
  business: ["services", "about", "testimonials", "contact"],
  healthcare: ["services", "about", "testimonials", "contact"],
  creative: ["portfolio", "services", "about", "contact"],
  "real-estate": ["services", "about", "portfolio", "contact"],
  food: ["about", "testimonials", "contact"],
  fitness: ["services", "about", "testimonials", "contact"],
  ecommerce: ["products", "services", "about", "testimonials", "contact"],
  ngo: ["about", "services", "contact"],
  services: ["services", "about", "testimonials", "contact"],
  other: ["about", "services", "contact"],
};

const SECTION_KEYWORDS: Array<{ type: SectionType; words: string[] }> = [
  { type: "about", words: ["about", "mission", "who we are", "our story", "since", "founded", "background"] },
  { type: "services", words: ["service", "offer", "what we do", "solution", "consult", "support", "training program", "programs"] },
  { type: "courses", words: ["course", "training", "learn", "class", "ms office", "excel", "web development", "python", "canva", "graphic", "digital marketing", "workshop"] },
  { type: "portfolio", words: ["portfolio", "our work", "projects", "gallery", "case study", "samples"] },
  { type: "testimonials", words: ["testimonial", "review", "feedback", "success story", "client", "student say", "what people say"] },
  { type: "pricing", words: ["pricing", "plan", "package", "fee", "cost", "membership", "subscription", "tuition"] },
  { type: "faq", words: ["faq", "question", "frequently", "help"] },
  { type: "products", words: ["product", "shop", "store", "buy", "order", "cart", "checkout", "sell", "sale", "delivery", "catalog"] },
  { type: "contact", words: ["contact", "get in touch", "reach", "location", "address", "phone", "email", "visit", "enrol", "admission", "register"] },
];

const ECOMMERCE_HINTS = ["ecommerce", "e-commerce", "online store", "shop", "retail", "buy", "sell", "product", "cart", "checkout", "order", "delivery", "catalog"];

const KNOWN_TOPICS: string[] = [
  "MS Office", "Microsoft Office", "MS Excel", "Excel", "Word", "PowerPoint",
  "Web Development", "Web Design", "Frontend", "HTML", "CSS", "JavaScript",
  "Python", "React", "Next.js", "Tailwind",
  "Canva", "Graphic Design", "Photoshop", "Illustrator", "UI/UX",
  "Digital Marketing", "SEO", "Social Media",
  "Networking", "Computer Basics", "Typing", "Data Entry",
  "Flutter", "Mobile App", "App Development", "Java", "C++", "MySQL", "Database",
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

function extractTopics(details: string): string[] {
  const norm = normalize(details);
  const found = KNOWN_TOPICS.filter((t) => norm.includes(normalize(t)));
  const unique = Array.from(new Set(found.map((t) => t)));
  return unique.slice(0, 8);
}

function detailSentence(details: string, minLen = 80): string {
  const cleaned = details.replace(/\s+/g, " ").trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter((s) => s.length > 10);
  const longest = sentences.sort((a, b) => b.length - a.length)[0];
  if (longest && longest.length >= minLen) return longest;
  return cleaned.length > 0 ? cleaned : "";
}

function detectSections(info: ProjectInfo): SectionType[] {
  const explicit = (info.sections ?? []).filter(
    (s): s is SectionType =>
      ["about", "services", "courses", "portfolio", "testimonials", "pricing", "faq", "products", "contact"].includes(s)
  );
  const set = new Set<SectionType>(explicit);
  set.add("hero");

  const industry = info.industry.toLowerCase();
  for (const [key, sections] of Object.entries(INDUSTRY_SECTIONS)) {
    if (industry === key || industry.includes(key)) {
      sections.forEach((s) => set.add(s));
      break;
    }
  }

  const norm = normalize(info.details);
  for (const { type, words } of SECTION_KEYWORDS) {
    if (words.some((w) => norm.includes(w))) set.add(type);
  }

  const priority: SectionType[] = [
    "hero", "about", "services", "courses", "products", "portfolio", "testimonials", "pricing", "faq", "contact",
  ];
  const order = priority.filter((s) => set.has(s));
  const extras = Array.from(set).filter((s) => !priority.includes(s));
  return [...order, ...extras];
}

export function isEcommerceProject(info: ProjectInfo): boolean {
  const industry = info.industry.toLowerCase();
  const norm = normalize(info.details);
  return ECOMMERCE_HINTS.some((h) => industry.includes(h) || norm.includes(h));
}

/* ------------------------------------------------------------------ */
/* Content synthesis                                                   */
/* ------------------------------------------------------------------ */

function itemsFromTopics(topics: string[], base: string): SiteItem[] {
  if (topics.length === 0) return [];
  return topics.map((t) => ({
    title: t,
    text: `Structured, practical ${t.toLowerCase()} training designed around real projects and professional outcomes.`,
    icon: iconForTopic(t),
    meta: "Beginner to advanced",
  }));
}

function iconForTopic(topic: string): string {
  const n = topic.toLowerCase();
  if (n.includes("python") || n.includes("java") || n.includes("c++")) return "code";
  if (n.includes("web") || n.includes("html") || n.includes("css") || n.includes("react") || n.includes("javascript")) return "globe";
  if (n.includes("office") || n.includes("excel") || n.includes("word") || n.includes("powerpoint")) return "table";
  if (n.includes("canva") || n.includes("design") || n.includes("photoshop") || n.includes("illustrator") || n.includes("ui")) return "palette";
  if (n.includes("marketing") || n.includes("seo")) return "trending";
  if (n.includes("network") || n.includes("computer") || n.includes("typing") || n.includes("data")) return "cpu";
  return "sparkles";
}

function genericItems(type: SectionType, brand: string): SiteItem[] {
  switch (type) {
    case "services":
      return [
        { title: "Expert guidance", text: `Focused, hands-on guidance from experienced professionals at ${brand}.`, icon: "compass" },
        { title: "Practical projects", text: "Learn by building real, portfolio-ready work from day one.", icon: "layers" },
        { title: "Flexible formats", text: "On-site and online sessions designed around your schedule.", icon: "clock" },
      ];
    case "courses":
      return [
        { title: "Core programs", text: "Structured foundational programs for beginners and professionals.", icon: "book" },
        { title: "Advanced tracks", text: "Deeper dives for those ready to specialise and level up.", icon: "rocket" },
        { title: "Short workshops", text: "Focused workshops covering specific modern skills.", icon: "zap" },
      ];
    case "portfolio":
      return [
        { title: "Brand & identity", text: "Complete visual identities designed with intention.", icon: "palette" },
        { title: "Digital experiences", text: "Websites and interfaces built for real users.", icon: "monitor" },
        { title: "Content & campaigns", text: "Content that communicates clearly and converts.", icon: "megaphone" },
      ];
    default:
      return [
        { title: "Quality first", text: `We hold every detail of ${brand} to a professional standard.`, icon: "shield" },
        { title: "People focused", text: "Everything we do starts with the people we serve.", icon: "users" },
        { title: "Built to last", text: "Decisions made with the long term clearly in view.", icon: "layers" },
      ];
  }
}

function defaultItems(type: SectionType, brand: string, topics: string[]): SiteItem[] {
  if ((type === "services" || type === "courses") && topics.length > 0) {
    return itemsFromTopics(topics, brand);
  }
  return genericItems(type, brand);
}

/* ------------------------------------------------------------------ */
/* Team + product content synthesis                                    */
/* ------------------------------------------------------------------ */

function buildTeam(brand: string): TeamMember[] {
  return [
    { name: "Ayesha Khan", role: "Founder & Director", initials: "AK" },
    { name: "Bilal Ahmed", role: "Head of Programs", initials: "BA" },
    { name: "Sana Malik", role: "Operations Lead", initials: "SM" },
    { name: "Usman Raza", role: "Client Success", initials: "UR" },
  ];
}

function buildProducts(brand: string, topics: string[]): ShopProduct[] {
  const currency = "USD";
  const names = topics.length
    ? topics.slice(0, 6)
    : ["Essential Starter", "Standard Edition", "Pro Bundle", "Premium Kit", "Ultimate Set", "Team Plan"];
  const prices = [29, 49, 79, 99, 149, 199];
  return names.map((n, i) => ({
    slug: slugify(n),
    name: n,
    price: prices[i % prices.length],
    currency,
    tag: i === 0 ? "Best seller" : i === 2 ? "New" : "Popular",
    description: `A practical ${n.toLowerCase()} option from ${brand}, built around clear features, transparent pricing and dependable delivery.`,
    features: [
      `${n} essentials included`,
      "Priority customer support",
      "Free delivery available",
      "30-day refund guarantee",
    ],
    featured: i < 3,
  }));
}

function buildSection(
  type: SectionType,
  brand: string,
  details: string,
  topics: string[],
  index: number
): SiteSection {
  const id = type;
  const brandLabel = brand || "Our organisation";

  switch (type) {
    case "hero": {
      const subFromDetails = detailSentence(details, 80) || `Discover how ${brandLabel} delivers quality, care and real results.`;
      return {
        id,
        type,
        heading: `${brand} — ${topics.length > 0 ? topics.slice(0, 3).join(", ") : "excellence in everything we do"}`,
        sub: subFromDetails,
        items: [],
        stats: [
          { value: "500+", label: "People served" },
          { value: "4.9/5", label: "Average rating" },
          { value: "15+", label: "Years of experience" },
        ],
        cta: { label: "Get started", href: "#contact" },
        ctaSecondary: { label: "Explore services", href: "#services" },
      };
    }
    case "about":
      return {
        id,
        type,
        heading: "About us",
        sub:
          detailSentence(details, 0) ||
          `${brandLabel} is built around one idea: delivering work and experiences that people genuinely value.`,
        items: defaultItems("about", brand, topics),
        team: buildTeam(brand),
        cta: { label: "Contact us", href: "#contact" },
      };
    case "services":
      return {
        id,
        type,
        heading: "What we offer",
        sub: "A focused set of services, delivered with consistency and care.",
        items: defaultItems("services", brand, topics),
        cta: { label: "Get in touch", href: "#contact" },
      };
    case "courses":
      return {
        id,
        type,
        heading: "Courses & programs",
        sub: "Practical, project-driven programs built around modern skills.",
        items: defaultItems("courses", brand, topics),
        cta: { label: "Enrol today", href: "#contact" },
      };
    case "portfolio":
      return {
        id,
        type,
        heading: "Selected work",
        sub: "A look at the kind of work we produce and the results we deliver.",
        items: defaultItems("portfolio", brand, topics),
        cta: { label: "Start a project", href: "#contact" },
      };
    case "products":
      return {
        id,
        type,
        heading: "Featured products",
        sub: "Clear pricing, honest features. Every order is tracked from checkout to delivery.",
        items: [],
        cta: { label: "Shop all", href: "/products" },
      };
    case "testimonials": {
      const quotes: SiteItem[] = [
        { title: "Ameen Ali", text: `The team at ${brand} went above and beyond. The results exceeded everything we expected.`, icon: "user", meta: "Centre director" },
        { title: "Sarah Rahman", text: "Clear communication, honest advice and genuinely great work. Highly recommended.", icon: "user", meta: "Course graduate" },
        { title: "Imran Hossain", text: `Professional from the first call to the final delivery. ${brand} set a new standard for us.`, icon: "user", meta: "Small business owner" },
      ];
      return { id, type, heading: "What people say", sub: "Real feedback from the people we work with.", items: quotes };
    }
    case "pricing": {
      const tiers: SiteItem[] = [
        { title: "Starter", text: "Essential access to core services and resources.", meta: "$49" },
        { title: "Standard", text: "Full access with priority support and extras.", meta: "$99" },
        { title: "Premium", text: "Everything included, plus personalised guidance.", meta: "$199" },
      ];
      return { id, type, heading: "Simple pricing", sub: "Clear, honest pricing with no surprises.", items: tiers };
    }
    case "faq": {
      const faqs: SiteFaq[] = [
        { q: "How do I get started?", a: `Reach out through the contact section and we will guide you through the next steps with ${brand}.` },
        { q: "Do you offer online options?", a: "Yes — flexible online and on-site options are available depending on the program." },
        { q: "What does it cost?", a: "Pricing depends on the service or program you choose. We keep things transparent and simple." },
        { q: "Can I get support after enrolling?", a: "Absolutely. Ongoing support is part of how we work with every client and learner." },
      ];
      return { id, type, heading: "Frequently asked questions", sub: "Answers to the questions we hear most often.", items: [], faqs };
    }
    case "contact":
      return {
        id,
        type,
        heading: "Get in touch",
        sub: "Tell us about your project or enquiry and we will respond promptly.",
        items: [
          { title: "Visit us", text: "123 Main Street, Your City", icon: "map-pin" },
          { title: "Call us", text: "+1 234 567 890", icon: "phone" },
          { title: "Email us", text: "hello@example.com", icon: "mail" },
        ],
        cta: { label: "Send message", href: "#contact" },
      };
  }
}

/* ------------------------------------------------------------------ */
/* Blog content synthesis                                              */
/* ------------------------------------------------------------------ */

function buildBlogPosts(brand: string, topics: string[], tagline: string): BlogPost[] {
  const a = topics[0] ?? "our core services";
  const b = topics[1] ?? "our programs";
  const c = topics[2] ?? "professional development";

  const an = a.charAt(0).toLowerCase() + a.slice(1);
  const bn = b.charAt(0).toLowerCase() + b.slice(1);
  const cn = c.charAt(0).toLowerCase() + c.slice(1);

  return [
    {
      title: `5 ways ${an} can help you move faster`,
      slug: slugify(`5 ways ${an} can help you move faster`),
      date: "14 Feb 2025",
      tag: "Insights",
      excerpt: `A practical look at how investing in ${an} creates real, lasting results — whether you are just starting out or levelling up.`,
      body: [
        `Every serious project starts with the right foundation. At ${brand}, we have seen how ${an} turns good intentions into measurable outcomes for the people and businesses we work with.`,
        `The first lesson is focus. Instead of trying to do everything at once, start with the one area that will move the needle most. ${brand} helps you identify that area and build a clear, realistic plan around it.`,
        `The second is consistency. Progress rarely comes from big leaps — it comes from showing up regularly. Our programs are designed around steady, structured practice so the gains actually stick.`,
        `Finally, keep the long view. ${tagline || "Quality work, delivered professionally"} is only possible when decisions are made with the long term in mind. That is exactly the approach we bring to every engagement.`,
      ],
    },
    {
      title: `A beginner's guide to ${bn}`,
      slug: slugify(`A beginner's guide to ${bn}`),
      date: "28 Jan 2025",
      tag: "Guides",
      excerpt: `New to ${bn}? Here is everything you need to know before you start — in plain language, with no jargon.`,
      body: [
        `If ${bn} feels overwhelming at first, you are not alone. Most people who come to ${brand} tell us the same thing: they want to learn, they just do not know where to begin.`,
        `The good news is that the fundamentals are simpler than they look. This guide walks through the core concepts, the common pitfalls to avoid, and the practical steps you can take in your first week.`,
        `Start with the basics and build up. Skip the shortcuts — they tend to create gaps that show up later. A structured, step-by-step path like the ones offered at ${brand} keeps you moving without getting lost.`,
        `And when you get stuck (everyone does), ask. The best progress happens with guidance from people who have already walked the path — which is exactly the support ${brand} provides.`,
      ],
    },
    {
      title: `Why ${cn} matters more than ever`,
      slug: slugify(`Why ${cn} matters more than ever`),
      date: "09 Jan 2025",
      tag: "Trends",
      excerpt: `The way we work and learn keeps changing. Here is why staying current with ${cn} is no longer optional.`,
      body: [
        `The tools we use every day keep evolving, and so do the skills that matter. ${cn} has moved from a nice-to-have to a genuine advantage for anyone who wants to grow.`,
        `At ${brand}, we see it in the people who join our programs: those who invest in ${cn} move into better roles, take on bigger projects, and make more confident decisions.`,
        `It is not about chasing every trend. It is about building durable skills that transfer across tools and situations — exactly the kind of training our programs are built around.`,
        `The best time to start was yesterday; the second-best time is now. Reach out to ${brand} and let us help you get moving.`,
      ],
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Legal page content (shared by the generated pages + live preview)   */
/* ------------------------------------------------------------------ */

export type LegalPage = "terms" | "privacy" | "refund";

export function legalIntro(page: LegalPage, brand: string): string {
  if (page === "terms") {
    return `These Terms & Services ("Terms") govern your use of the website and services provided by ${brand}. Please read them carefully before using this site.`;
  }
  if (page === "refund") {
    return `This Refund Policy explains the terms under which ${brand} offers refunds for its services, programs and products. We offer a simple and transparent 30-day refund window.`;
  }
  return `This Privacy Policy explains how ${brand} collects, uses and protects your personal information when you visit this website.`;
}

export function legalSections(
  page: LegalPage,
  brand: string
): { heading: string; text: string }[] {
  if (page === "terms") {
    return [
      { heading: "1. Acceptance of terms", text: `By accessing or using the ${brand} website, you agree to be bound by these Terms & Services and all applicable laws. If you do not agree, please do not use this site.` },
      { heading: "2. Services", text: `The content on this website is provided for general information about ${brand}'s services, programs and offerings. We aim to keep it accurate but we do not guarantee that it is complete or error-free.` },
      { heading: "3. Use of the website", text: `You may use this website for lawful, personal or professional purposes. You must not misuse the site, attempt to disrupt its operation, or use any content without permission.` },
      { heading: "4. Intellectual property", text: `All content, branding, text and design on this site belong to ${brand} unless otherwise stated and may not be reused without written permission.` },
      { heading: "5. Limitation of liability", text: `To the maximum extent permitted by law, ${brand} is not liable for any indirect or consequential loss arising from your use of this website or the services described on it.` },
      { heading: "6. Changes to these terms", text: `We may update these Terms & Services from time to time. Continued use of the website after changes means you accept the updated terms.` },
      { heading: "7. Contact", text: `If you have any questions about these Terms & Services, please contact us through the details provided on the website.` },
    ];
  }
  if (page === "refund") {
    return [
      { heading: "1. 30-day refund window", text: `If you are not satisfied with a service or program purchased from ${brand}, you may request a full refund within 30 days of your payment. No questions asked within this period.` },
      { heading: "2. Eligibility", text: `To be eligible for a refund, the request must be made within 30 days of purchase and the refund must not relate to a service that has already been fully delivered or completed.` },
      { heading: "3. How to request a refund", text: `Send your refund request through the contact details provided on this website. Include your name, the service or program purchased, and the date of payment so we can process it quickly.` },
      { heading: "4. Processing time", text: `Approved refunds are processed within 5-7 business days and returned to the original payment method. You will receive a confirmation once the refund is issued.` },
      { heading: "5. Non-refundable items", text: `Fees for services that have already been fully delivered, or digital products that have been fully accessed, may not be refunded unless required by law.` },
      { heading: "6. Changes to this policy", text: `We may update this Refund Policy from time to time. Any changes will be reflected on this page with the updated date.` },
      { heading: "7. Contact", text: `If you have any questions about this Refund Policy, please contact ${brand} through the details provided on the website.` },
    ];
  }
  return [
    { heading: "1. Information we collect", text: `We collect only the information you choose to share with us — for example your name, email address and message when you use the contact form. We do not collect more data than necessary.` },
    { heading: "2. How we use your information", text: `We use the information you provide to respond to your enquiries, provide our services, and improve the website experience. We do not sell your personal data.` },
    { heading: "3. Cookies", text: `This website may use basic browser storage for a better experience. You can disable cookies or similar storage in your browser settings at any time.` },
    { heading: "4. Third parties", text: `We do not share your personal information with third parties except where required by law or where needed to operate our services.` },
    { heading: "5. Data security", text: `We take reasonable steps to protect the information you share with us against loss, misuse or unauthorised access.` },
    { heading: "6. Your rights", text: `You may request access to, correction of, or deletion of the personal information you have provided to ${brand} at any time by contacting us.` },
    { heading: "7. Contact", text: `For any privacy-related questions, please contact us through the details provided on the website.` },
  ];
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function buildSiteModel(info: ProjectInfo): SiteModel {
  const brand = info.name.trim() || "Untitled Project";
  const details = info.details.trim();
  const topics = extractTopics(details);
  const sectionTypes = detectSections(info);
  const isEcommerce = isEcommerceProject(info);

  const sections = sectionTypes.map((type, i) => buildSection(type, brand, details, topics, i));

  const sectionNav = sections
    .filter((s) => s.type !== "hero" && s.type !== "contact")
    .map((s) => ({
      label: navLabel(s.type),
      href: s.type === "products" ? "/products" : `#${s.id}`,
    }))
    .slice(0, 4);
  const nav = [
    ...sectionNav,
    { label: "Contact", href: "#contact" },
    ...(isEcommerce
      ? [
          { label: "Cart", href: "/cart" },
          { label: "Track order", href: "/order-tracking" },
        ]
      : []),
    { label: "Blog", href: "/blog" },
  ];

  const blog = buildBlogPosts(brand, topics, sections.find((s) => s.type === "hero")?.sub ?? "");
  const whatsapp = "+1 234 567 890";

  return {
    brand,
    tagline: sections.find((s) => s.type === "hero")?.sub ?? "",
    nav,
    sections,
    blog,
    products: isEcommerce ? buildProducts(brand, topics) : [],
    isEcommerce,
    whatsapp,
    whatsappDigits: whatsapp.replace(/\D/g, ""),
    calendly: "https://calendly.com/your-handle",
    metaTitle: `${brand} — Official Website`,
    metaDescription: `The official website for ${brand}. ${
      sections.find((s) => s.type === "hero")?.sub ?? "Quality services, delivered professionally."
    }`,
  };
}

function navLabel(type: SectionType): string {
  switch (type) {
    case "services":
      return "Services";
    case "courses":
      return "Courses";
    case "products":
      return "Shop";
    case "portfolio":
      return "Work";
    case "testimonials":
      return "Testimonials";
    case "pricing":
      return "Pricing";
    case "faq":
      return "FAQ";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

export function sectionSlug(section: SiteSection): string {
  return slugify(section.heading);
}

export function sectionList(model: SiteModel): string[] {
  return model.sections.map((s) => s.type);
}
