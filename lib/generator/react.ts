import type { DesignTokens, GeneratedFile, ProjectInfo, SectionType, SiteModel } from "@/lib/types";
import { buildSiteModel, legalIntro, legalSections } from "./model";
import type { LegalPage } from "./model";
import { slugify } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function renderProjectFiles(
  info: ProjectInfo,
  model: SiteModel,
  tokens: DesignTokens
): Record<string, GeneratedFile> {
  const files: Record<string, GeneratedFile> = {};
  const add = (path: string, content: string, language: string) => {
    files[path] = { path, content, language };
  };

  add("app/layout.tsx", layoutFile(model), "typescript");
  add("app/page.tsx", pageFile(model), "typescript");
  add("app/blog/page.tsx", blogPageFile(model), "typescript");
  add("app/blog/[slug]/page.tsx", blogPostPageFile(model), "typescript");
  add("app/terms/page.tsx", legalPageFile("terms", model), "typescript");
  add("app/privacy/page.tsx", legalPageFile("privacy", model), "typescript");
  add("app/refund/page.tsx", legalPageFile("refund", model), "typescript");
  add("app/globals.css", globalsFile(tokens), "css");
  add("tailwind.config.ts", tailwindConfigFile(tokens), "typescript");
  add("postcss.config.mjs", postcssFile(), "javascript");
  add("next.config.mjs", nextConfigFile(), "javascript");
  add("tsconfig.json", tsconfigFile(), "json");
  add("package.json", packageJsonFile(model), "json");
  add(".gitignore", gitignoreFile(), "plaintext");
  add("README.md", readmeFile(info, model), "markdown");
  add("components/siteData.ts", siteDataFile(model, tokens), "typescript");
  add("components/site/blogData.ts", blogDataFile(model), "typescript");
  add("components/site/shopData.ts", shopDataFile(model), "typescript");
  add("components/site/cn.ts", cnFile(), "typescript");
  add("components/site/Icon.tsx", iconFile(), "typescript");
  add("components/site/Button.tsx", buttonFile(), "typescript");
  add("components/site/Section.tsx", sectionFile(), "typescript");
  add("components/site/SiteHeader.tsx", siteHeaderFile(), "typescript");
  add("components/site/Hero.tsx", heroFile(), "typescript");
  add("components/site/Footer.tsx", footerFile(), "typescript");
  add("components/site/language.tsx", languageFile(), "typescript");
  add("components/site/cart.ts", cartFile(), "typescript");
  add("components/site/AddToCart.tsx", addToCartFile(), "typescript");
  add("components/site/WhatsAppButton.tsx", whatsappButtonFile(), "typescript");

  if (model.isEcommerce) {
    add("app/products/page.tsx", productsPageFile(model), "typescript");
    add("app/products/[slug]/page.tsx", productPageFile(model), "typescript");
    add("app/cart/page.tsx", cartPageFile(), "typescript");
    add("app/checkout/page.tsx", checkoutPageFile(), "typescript");
    add("app/order-tracking/page.tsx", orderTrackingPageFile(), "typescript");
  }

  for (const type of model.sections.map((s) => s.type)) {
    if (type === "hero") continue;
    const name = componentName(type);
    add(`components/site/${name}.tsx`, sectionComponentFile(type), "typescript");
  }

  return files;
}

export function componentName(type: SectionType): string {
  switch (type) {
    case "services":
      return "Services";
    case "courses":
      return "Courses";
    case "portfolio":
      return "Portfolio";
    case "testimonials":
      return "Testimonials";
    case "pricing":
      return "Pricing";
    case "faq":
      return "Faq";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

/* ------------------------------------------------------------------ */
/* Static / config files                                               */
/* ------------------------------------------------------------------ */

function layoutFile(model: SiteModel): string {
  return `import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { LanguageProvider } from "@/components/site/language";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: ${JSON.stringify(model.metaTitle)},
  description: ${JSON.stringify(model.metaDescription)},
  openGraph: {
    title: ${JSON.stringify(model.metaTitle)},
    description: ${JSON.stringify(model.metaDescription)},
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable + " " + serif.variable}>
      <body className="bg-paper font-sans text-ink antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
`;
}

function pageFile(model: SiteModel): string {
  const types = model.sections.map((s) => s.type);
  const imports = types
    .map((t) => `import { ${componentName(t)} } from "@/components/site/${componentName(t)}";`)
    .join("\n");
  const cases = types
    .map(
      (t) => `          case "${t}":
            return <${componentName(t)} key={section.id} data={section} />;`
    )
    .join("\n");

  return `import { siteData } from "@/components/siteData";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
${imports}

export default function Home() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader brand={siteData.brand} nav={siteData.nav} isEcommerce={${model.isEcommerce}} />
      {siteData.sections.map((section) => {
        switch (section.type) {
${cases}
          default:
            return null;
        }
      })}
      <Footer brand={siteData.brand} nav={siteData.nav} />
      <WhatsAppButton />
    </main>
  );
}
`;
}

function blogDataFile(model: SiteModel): string {
  const posts = model.blog.map((p) => ({
    title: p.title,
    slug: p.slug,
    date: p.date,
    tag: p.tag,
    excerpt: p.excerpt,
    body: p.body,
  }));

  return `export interface BlogPost {
  title: string;
  slug: string;
  date: string;
  tag: string;
  excerpt: string;
  body: string[];
}

export const blogPosts: BlogPost[] = ${JSON.stringify(posts, null, 2)};
`;
}

function blogPageFile(model: SiteModel): string {
  return `import type { Metadata } from "next";
import { siteData } from "@/components/siteData";
import { blogPosts } from "@/components/site/blogData";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";

export const metadata: Metadata = {
  title: ${JSON.stringify(`${model.brand} — Blog`)},
  description: ${JSON.stringify(`Latest updates, guides and insights from ${model.brand}.`)},
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader brand={siteData.brand} nav={siteData.nav} />
      <section className="mx-auto w-full max-w-6xl px-4 pb-24 pt-20 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Blog</p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Latest updates &amp; insights
        </h1>
        <p className="mt-4 max-w-2xl text-base text-ink-soft">{siteData.tagline}</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <a
              key={post.slug}
              href={\`/blog/\${post.slug}\`}
              className="group flex flex-col rounded border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-accent hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-accent">{post.tag}</span>
                <time className="text-ink-soft">{post.date}</time>
              </div>
              <h2 className="mt-4 font-heading text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-accent">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-ink-soft">{post.excerpt}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                Read article
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </span>
            </a>
          ))}
        </div>
      </section>
      <Footer brand={siteData.brand} nav={siteData.nav} />
    </main>
  );
}
`;
}

function blogPostPageFile(model: SiteModel): string {
  return `import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { siteData } from "@/components/siteData";
import { blogPosts } from "@/components/site/blogData";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return { title: "Not found" };
  return {
    title: ${JSON.stringify(`${model.brand} — `)} + post.title,
    description: post.excerpt,
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader brand={siteData.brand} nav={siteData.nav} />
      <article className="mx-auto w-full max-w-3xl px-4 pb-24 pt-16 sm:px-6">
        <a href="/blog" className="text-sm font-semibold text-accent">
          &larr; Back to blog
        </a>
        <div className="mt-6 flex items-center gap-3 text-xs">
          <span className="rounded-full bg-accent-soft px-2.5 py-1 font-semibold text-accent">{post.tag}</span>
          <time className="text-ink-soft">{post.date}</time>
        </div>
        <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-ink-soft">
          {post.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </article>
      <Footer brand={siteData.brand} nav={siteData.nav} />
    </main>
  );
}
`;
}

function legalPageFile(page: LegalPage, model: SiteModel): string {
  const brand = model.brand;
  const pageTitles: Record<LegalPage, string> = {
    terms: "Terms & Services",
    privacy: "Privacy Policy",
    refund: "Refund Policy",
  };
  const pageNames: Record<LegalPage, string> = {
    terms: "TermsPage",
    privacy: "PrivacyPage",
    refund: "RefundPage",
  };
  const pageTitle = pageTitles[page];
  const updated = "15 Feb 2025";

  const intro = legalIntro(page, brand);
  const sections = legalSections(page, brand)
    .map(
      ({ heading, text }) => `        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold tracking-tight">${heading}</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">${text}</p>
        </section>`
    )
    .join("\n");

  return `import type { Metadata } from "next";
import { siteData } from "@/components/siteData";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";

export const metadata: Metadata = {
  title: ${JSON.stringify(`${brand} — ${pageTitle}`)},
  description: ${JSON.stringify(intro)},
};

export default function ${pageNames[page]}() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader brand={siteData.brand} nav={siteData.nav} />
      <article className="mx-auto w-full max-w-3xl px-4 pb-24 pt-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Legal</p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">${pageTitle}</h1>
        <p className="mt-4 text-sm text-ink-soft">Last updated: ${updated}</p>
        <p className="mt-6 leading-relaxed text-ink-soft">${intro}</p>
${sections}
      </article>
      <Footer brand={siteData.brand} nav={siteData.nav} />
    </main>
  );
}
`;
}

function globalsFile(tokens: DesignTokens): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

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
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-sans), system-ui, sans-serif;
}

::selection {
  background: var(--accent-soft);
  color: var(--ink);
}

h1, h2, h3, h4 {
  text-wrap: balance;
}
`;
}

function tailwindConfigFile(tokens: DesignTokens): string {
  return `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          fg: "var(--on-accent)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          soft: "var(--ink-soft)",
        },
        paper: {
          DEFAULT: "var(--paper)",
          soft: "var(--paper-soft)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        heading: [${JSON.stringify(tokens.headingFont)}],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "float": "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
`;
}

function postcssFile(): string {
  return `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
`;
}

function nextConfigFile(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
`;
}

function tsconfigFile(): string {
  return `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;
}

function packageJsonFile(model: SiteModel): string {
  const pkg = {
    name: slugify(model.brand).replace(/-/g, "-"),
    private: true,
    version: "0.1.0",
    description: model.metaDescription,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
    },
    dependencies: {
      next: "14.2.15",
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      "framer-motion": "^11.11.0",
      "lucide-react": "^0.441.0",
    },
    devDependencies: {
      typescript: "^5.6.2",
      "@types/node": "^20.14.0",
      "@types/react": "^18.3.10",
      "@types/react-dom": "^18.3.0",
      tailwindcss: "^3.4.13",
      postcss: "^8.4.47",
      autoprefixer: "^10.4.20",
    },
  };
  return JSON.stringify(pkg, null, 2);
}

function gitignoreFile(): string {
  return `# dependencies
/node_modules

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# env files
.env
.env*.local

# typescript
*.tsbuildinfo
next-env.d.ts
`;
}

function readmeFile(info: ProjectInfo, model: SiteModel): string {
  return `# ${model.brand}

${model.metaDescription}

## Tech stack

- [Next.js 14](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React icons

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:3000 in your browser.

## Project structure

\`\`\`text
├── app/
│   ├── layout.tsx      # fonts + SEO metadata
│   ├── page.tsx        # page assembly
│   └── globals.css     # design tokens
├── components/
│   ├── siteData.ts     # all site content lives here
│   └── site/           # reusable section components
├── tailwind.config.ts
└── package.json
\`\`\`

## Customising the website

Edit **\`components/siteData.ts\`** to change content, navigation and sections.
Edit **\`app/globals.css\`** to change the accent colour and design tokens.

## Project brief

- **Project name:** ${model.brand}
- **Industry:** ${info.industry}
- **Details:** ${info.details}

Generated with **Forge Studio — AI Website Builder**.
`;
}

/* ------------------------------------------------------------------ */
/* siteData + shared primitives                                        */
/* ------------------------------------------------------------------ */

function siteDataFile(model: SiteModel, tokens: DesignTokens): string {
  const data = {
    brand: model.brand,
    tagline: model.tagline,
    nav: model.nav,
    sections: model.sections,
    metaTitle: model.metaTitle,
    metaDescription: model.metaDescription,
    theme: {
      heroStyle: tokens.heroStyle,
      radius: tokens.radius,
      showTopBar: tokens.showTopBar,
    },
  };
  return `export interface SiteItem {
  title: string;
  text: string;
  icon?: string;
  meta?: string;
}

export interface SiteStats {
  value: string;
  label: string;
}

export interface SiteFaq {
  q: string;
  a: string;
}

export interface SiteNavItem {
  label: string;
  href: string;
}

export interface SiteSection {
  id: string;
  type: string;
  heading: string;
  sub?: string;
  items: SiteItem[];
  stats?: SiteStats[];
  faqs?: SiteFaq[];
  team?: { name: string; role: string; initials: string }[];
  cta?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
}

export interface SiteData {
  brand: string;
  tagline: string;
  nav: SiteNavItem[];
  sections: SiteSection[];
  metaTitle: string;
  metaDescription: string;
  theme: { heroStyle: string; radius: string; showTopBar: boolean };
}

export const siteData: SiteData = ${JSON.stringify(data, null, 2)};
`;
}

function cnFile(): string {
  return `export function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}
`;
}

function iconFile(): string {
  return `import type { LucideIcon } from "lucide-react";
import {
  ArrowRight, BadgeCheck, Book, Check, ChevronDown, Clock, Code, Compass, Cpu,
  Globe, Layers, Mail, MapPin, Megaphone, Menu, Monitor, Palette, Phone, Quote,
  Rocket, Send, Shield, Sparkles, Star, Table, TrendingUp, Users, X, Zap,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  "arrow-right": ArrowRight,
  "badge-check": BadgeCheck,
  "book": Book,
  "check": Check,
  "chevron-down": ChevronDown,
  "clock": Clock,
  "code": Code,
  "compass": Compass,
  "cpu": Cpu,
  "globe": Globe,
  "layers": Layers,
  "mail": Mail,
  "map-pin": MapPin,
  "megaphone": Megaphone,
  "menu": Menu,
  "monitor": Monitor,
  "palette": Palette,
  "phone": Phone,
  "quote": Quote,
  "rocket": Rocket,
  "send": Send,
  "shield": Shield,
  "sparkles": Sparkles,
  "star": Star,
  "table": Table,
  "trending-up": TrendingUp,
  "users": Users,
  "x": X,
  "zap": Zap,
};

export function Icon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const C = map[name];
  if (!C) return null;
  return <C className={className} aria-hidden="true" />;
}
`;
}

function buttonFile(): string {
  return `import type { ReactNode } from "react";
import { cn } from "@/components/site/cn";

interface ButtonProps {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className,
  onClick,
  type = "button",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50";
  const variants = {
    primary: "bg-accent text-accent-fg shadow-sm hover:opacity-90",
    outline: "border border-slate-300 text-ink hover:border-accent hover:text-accent",
    ghost: "text-ink-soft hover:text-accent",
  };
  const sizes = {
    sm: "px-3.5 py-2 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className={classes} onClick={onClick}>
      {children}
    </button>
  );
}
`;
}

function sectionFile(): string {
  return `"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/components/site/cn";
import { useLanguage } from "@/components/site/language";

interface SectionProps {
  id?: string;
  className?: string;
  children: ReactNode;
}

export function Section({ id, className, children }: SectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-20", className)}>
      <motion.div
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-70px" }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </section>
  );
}

interface SectionHeaderProps {
  eyebrow?: string;
  heading: string;
  sub?: string;
  center?: boolean;
  id?: string;
  ctaHref?: string;
}

export function SectionHeader({ eyebrow, heading, sub, center = true, id, ctaHref }: SectionHeaderProps) {
  const { t } = useLanguage();
  const headingText = t(heading, heading);
  const subText = sub ? t(sub, sub) : undefined;
  const eyebrowText = eyebrow ? t(eyebrow, eyebrow) : undefined;
  return (
    <div className={cn("mb-12 max-w-2xl", center && "mx-auto text-center")}>
      {eyebrowText ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrowText}</p>
      ) : null}
      {id && ctaHref ? (
        <a href={ctaHref} className="group inline-block">
          <h2 id={id} className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {headingText}
          </h2>
        </a>
      ) : (
        <h2 id={id} className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {headingText}
        </h2>
      )}
      {subText ? <p className="mt-4 text-base leading-relaxed text-ink-soft">{subText}</p> : null}
    </div>
  );
}
`;
}

function siteHeaderFile(): string {
  return `"use client";
import { useState } from "react";
import { Menu, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/site/Button";
import { LanguageToggle, useLanguage } from "@/components/site/language";
import { useCart } from "@/components/site/cart";

interface SiteHeaderProps {
  brand: string;
  nav: { label: string; href: string }[];
  isEcommerce?: boolean;
}

export function SiteHeader({ brand, nav, isEcommerce = false }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-accent font-heading text-base font-bold text-accent-fg">
            {brand.charAt(0).toUpperCase()}
          </span>
          <span className="font-heading text-[15px] font-semibold tracking-tight">{brand}</span>
        </a>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink-soft transition-colors hover:text-accent"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {isEcommerce ? (
            <a
              href="/cart"
              aria-label="Shopping cart"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-ink transition-colors hover:border-accent hover:text-accent"
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg">
                  {count}
                </span>
              ) : null}
            </a>
          ) : null}
          <LanguageToggle />
          <Button href="#contact" size="sm">
            {t("Get started", "Get started")}
          </Button>
        </div>
        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-ink"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-slate-200 bg-white px-4 py-4 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-50 hover:text-accent"
              >
                {item.label}
              </a>
            ))}
            {isEcommerce ? (
              <>
                <a
                  href="/products"
                  onClick={() => setOpen(false)}
                  className="rounded px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-50 hover:text-accent"
                >
                  {t("Products", "Products")}
                </a>
                <a
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="rounded px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-50 hover:text-accent"
                >
                  {t("Cart", "Cart")}{count > 0 ? \` (\${count})\` : ""}
                </a>
                <a
                  href="/order-tracking"
                  onClick={() => setOpen(false)}
                  className="rounded px-3 py-2 text-sm font-medium text-ink-soft hover:bg-slate-50 hover:text-accent"
                >
                  {t("Track order", "Track order")}
                </a>
              </>
            ) : null}
          </div>
          <Button href="#contact" className="mt-3 w-full" size="sm">
            {t("Get started", "Get started")}
          </Button>
        </nav>
      ) : null}
    </header>
  );
}
`;
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function heroFile(): string {
  return `"use client";
import { siteData, type SiteSection } from "@/components/siteData";
import { Section } from "@/components/site/Section";
import { Button } from "@/components/site/Button";
import { useLanguage } from "@/components/site/language";
import { Star, BadgeCheck, Sparkles } from "lucide-react";

function HeroSplit({ data }: { data: SiteSection }) {
  const { t } = useLanguage();
  return (
    <section id="hero" className="relative overflow-hidden border-b border-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,var(--accent-soft),transparent_70%)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            {t("Trusted local provider", "Trusted local provider")}
          </span>
          <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            {data.heading}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">{data.sub}</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            {data.cta ? (
              <Button href={data.cta.href} size="lg">
                {t(data.cta.label, data.cta.label)}
                <span aria-hidden="true">&rarr;</span>
              </Button>
            ) : null}
            {data.ctaSecondary ? (
              <Button href={data.ctaSecondary.href} size="lg" variant="outline">
                {t(data.ctaSecondary.label, data.ctaSecondary.label)}
              </Button>
            ) : null}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
            {data.stats ? (
              data.stats.map((s) => (
                <div key={s.label}>
                  <p className="font-heading text-2xl font-bold text-ink">{s.value}</p>
                  <p className="text-sm text-ink-soft">{t(s.label, s.label)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink-soft">{t("No upfront fees · Flexible scheduling", "No upfront fees · Flexible scheduling")}</p>
            )}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-accent/25 via-transparent to-accent/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-accent to-slate-900 p-8 shadow-2xl">
            <div className="flex flex-col justify-between gap-12">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {t("Open for new work", "Open for new work")}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-white/80">
                  <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                  4.9 / 5
                </span>
              </div>
              <div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 font-heading text-2xl font-bold text-white">
                  {siteData.brand.charAt(0).toUpperCase()}
                </div>
                <p className="mt-5 max-w-sm font-heading text-2xl font-semibold leading-snug text-white">
                  {siteData.tagline}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-lg font-bold text-white">500+</p>
                  <p className="text-xs text-white/70">{t("People served", "People served")}</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                  <p className="text-lg font-bold text-white">100%</p>
                  <p className="text-xs text-white/70">{t("Commitment", "Commitment")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroCentered({ data }: { data: SiteSection }) {
  const { t } = useLanguage();
  return (
    <section id="hero" className="relative overflow-hidden border-b border-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,var(--accent-soft),transparent_70%)]" />
      <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-24 text-center sm:pt-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          <BadgeCheck className="h-3.5 w-3.5" />
          {siteData.brand}
        </span>
        <h1 className="mt-7 font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
          {data.heading}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">{data.sub}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {data.cta ? (
            <Button href={data.cta.href} size="lg">
              {t(data.cta.label, data.cta.label)}
            </Button>
          ) : null}
          {data.ctaSecondary ? (
            <Button href={data.ctaSecondary.href} size="lg" variant="outline">
              {t(data.ctaSecondary.label, data.ctaSecondary.label)}
            </Button>
          ) : null}
        </div>
        {data.stats ? (
          <div className="mx-auto mt-14 grid max-w-xl grid-cols-3 gap-4">
            {data.stats.map((s) => (
              <div key={s.label} className="border-t border-slate-200 pt-4">
                <p className="font-heading text-2xl font-bold text-ink">{s.value}</p>
                <p className="mt-1 text-sm text-ink-soft">{t(s.label, s.label)}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function HeroOverlay({ data }: { data: SiteSection }) {
  const { t } = useLanguage();
  return (
    <section id="hero" className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_0%,var(--accent),transparent_65%)] opacity-70" />
      <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-24 text-center sm:pt-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          {siteData.brand}
        </span>
        <h1 className="mt-7 font-heading text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
          {data.heading}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/75">{data.sub}</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          {data.cta ? (
            <Button href={data.cta.href} size="lg" className="bg-white text-slate-900 hover:bg-white/90">
              {t(data.cta.label, data.cta.label)}
            </Button>
          ) : null}
          {data.ctaSecondary ? (
            <Button
              href={data.ctaSecondary.href}
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:border-white hover:text-white"
            >
              {t(data.ctaSecondary.label, data.ctaSecondary.label)}
            </Button>
          ) : null}
        </div>
        {data.stats ? (
          <div className="mx-auto mt-14 grid max-w-xl grid-cols-3 gap-4">
            {data.stats.map((s) => (
              <div key={s.label} className="border-t border-white/20 pt-4">
                <p className="font-heading text-2xl font-bold">{s.value}</p>
                <p className="mt-1 text-sm text-white/60">{t(s.label, s.label)}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function Hero({ data }: { data: SiteSection }) {
  const style = siteData.theme.heroStyle;
  if (style === "centered") return <HeroCentered data={data} />;
  if (style === "overlay") return <HeroOverlay data={data} />;
  return <HeroSplit data={data} />;
}
`;
}

/* ------------------------------------------------------------------ */
/* Standard section components                                         */
/* ------------------------------------------------------------------ */

function sectionComponentFile(type: SectionType): string {
  switch (type) {
    case "about":
      return aboutFile();
    case "services":
      return servicesFile();
    case "courses":
      return coursesFile();
    case "portfolio":
      return portfolioFile();
    case "testimonials":
      return testimonialsFile();
    case "pricing":
      return pricingFile();
    case "faq":
      return faqFile();
    case "products":
      return productsFile();
    case "contact":
      return contactFile();
    default:
      return servicesFile();
  }
}

function productsFile(): string {
  return `import type { SiteSection } from "@/components/siteData";
import { Section, SectionHeader } from "@/components/site/Section";
import { Button } from "@/components/site/Button";
import { products, formatPrice } from "@/components/site/shopData";
import { AddToCart } from "@/components/site/AddToCart";

export function Products({ data }: { data: SiteSection }) {
  const featured = products.filter((p) => p.featured).slice(0, 3);
  return (
    <Section id={data.id} className="bg-paper-soft py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Products" heading={data.heading} sub={data.sub} />
        <div className="grid gap-6 md:grid-cols-3">
          {featured.map((p) => (
            <div key={p.slug} className="group flex flex-col rounded-lg border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-ink-soft">{p.tag}</span>
                <span className="text-lg font-semibold text-accent">{formatPrice(p.price, p.currency)}</span>
              </div>
              <h3 className="font-heading text-lg font-semibold">{p.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{p.description}</p>
              <div className="mt-5 flex items-center gap-3">
                <AddToCart product={p} />
                <a href={"/products/" + p.slug} className="text-sm font-medium text-accent hover:underline">
                  Details
                </a>
              </div>
            </div>
          ))}
        </div>
        {data.cta ? (
          <div className="mt-10 text-center">
            <Button href={data.cta.href} variant="outline">
              {data.cta.label}
            </Button>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
`;
}

function aboutFile(): string {
  return `import type { SiteSection } from "@/components/siteData";
import { Section, SectionHeader } from "@/components/site/Section";
import { Icon } from "@/components/site/Icon";
import { Button } from "@/components/site/Button";

export function About({ data }: { data: SiteSection }) {
  return (
    <Section id={data.id} className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="About us" heading={data.heading} sub={data.sub} center={false} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-100 bg-paper-soft p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-accent">
                <Icon name={item.icon} className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.text}</p>
            </div>
          ))}
        </div>
        {data.cta ? (
          <div className="mt-10">
            <Button href={data.cta.href} variant="outline">
              {data.cta.label}
            </Button>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
`;
}

function servicesFile(): string {
  return `import type { SiteSection } from "@/components/siteData";
import { Section, SectionHeader } from "@/components/site/Section";
import { Icon } from "@/components/site/Icon";

export function Services({ data }: { data: SiteSection }) {
  return (
    <Section id={data.id} className="bg-paper-soft py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Our services" heading={data.heading} sub={data.sub} />
        <div className="grid gap-6 md:grid-cols-3">
          {data.items.map((item) => (
            <div key={item.title} className="group rounded-lg border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-accent-fg">
                <Icon name={item.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-heading text-xl font-semibold">{item.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
`;
}

function coursesFile(): string {
  return `import type { SiteSection } from "@/components/siteData";
import { Section, SectionHeader } from "@/components/site/Section";
import { Icon } from "@/components/site/Icon";
import { ArrowRight } from "lucide-react";

export function Courses({ data }: { data: SiteSection }) {
  return (
    <Section id={data.id} className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Learning" heading={data.heading} sub={data.sub} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <a key={item.title} href="#contact" className="group flex flex-col rounded-lg border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/30 hover:shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon name={item.icon} className="h-5 w-5" />
                </div>
                {item.meta ? (
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
                    {item.meta}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{item.text}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                Learn more
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </Section>
  );
}
`;
}

function portfolioFile(): string {
  return `import type { SiteSection } from "@/components/siteData";
import { Section, SectionHeader } from "@/components/site/Section";
import { Icon } from "@/components/site/Icon";

export function Portfolio({ data }: { data: SiteSection }) {
  return (
    <Section id={data.id} className="bg-paper-soft py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Our work" heading={data.heading} sub={data.sub} />
        <div className="grid gap-6 md:grid-cols-3">
          {data.items.map((item, i) => (
            <div key={item.title} className="group overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-accent/25 via-paper to-accent/10">
                <Icon name={item.icon} className="h-10 w-10 text-accent transition-transform duration-300 group-hover:scale-110" />
                <span className="absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-ink backdrop-blur">
                  0\${i + 1}
                </span>
              </div>
              <div className="p-6">
                <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
`;
}

function testimonialsFile(): string {
  return `import type { SiteSection } from "@/components/siteData";
import { Section, SectionHeader } from "@/components/site/Section";
import { Quote, Star } from "lucide-react";

export function Testimonials({ data }: { data: SiteSection }) {
  return (
    <Section id={data.id} className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Testimonials" heading={data.heading} sub={data.sub} />
        <div className="grid gap-6 md:grid-cols-3">
          {data.items.map((item) => (
            <figure key={item.title} className="relative rounded-lg border border-slate-100 bg-paper-soft p-7">
              <Quote className="absolute right-6 top-6 h-6 w-6 text-accent/20" />
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-ink-soft">
                &ldquo;{item.text}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-heading text-sm font-bold text-accent-fg">
                  {item.title.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.meta ? <p className="text-xs text-ink-soft">{item.meta}</p> : null}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </Section>
  );
}
`;
}

function pricingFile(): string {
  return `import type { SiteSection } from "@/components/siteData";
import { Section, SectionHeader } from "@/components/site/Section";
import { Button } from "@/components/site/Button";
import { Check } from "lucide-react";

export function Pricing({ data }: { data: SiteSection }) {
  return (
    <Section id={data.id} className="bg-paper-soft py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Pricing" heading={data.heading} sub={data.sub} />
        <div className="grid gap-6 md:grid-cols-3">
          {data.items.map((item, i) => {
            const featured = i === 1;
            return (
              <div
                key={item.title}
                className={
                  "relative rounded-lg border p-7 " +
                  (featured
                    ? "border-accent bg-white shadow-xl"
                    : "border-slate-200 bg-white shadow-sm")
                }
              >
                {featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-accent-fg">
                    Most popular
                  </span>
                ) : null}
                <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
                {item.meta ? (
                  <p className="mt-2 font-heading text-3xl font-bold">
                    {item.meta}
                    <span className="text-sm font-medium text-ink-soft"> / month</span>
                  </p>
                ) : null}
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{item.text}</p>
                <ul className="mt-5 space-y-2.5">
                  {["Full access to core services", "Priority email support", "Free consultation call"].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button href="#contact" className="mt-7 w-full" variant={featured ? "primary" : "outline"}>
                  Choose {item.title}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
`;
}

function faqFile(): string {
  return `"use client";
import { useState } from "react";
import type { SiteSection } from "@/components/siteData";
import { Section, SectionHeader } from "@/components/site/Section";
import { ChevronDown } from "lucide-react";

export function Faq({ data }: { data: SiteSection }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section id={data.id} className="py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeader eyebrow="FAQ" heading={data.heading} sub={data.sub} />
        <div className="space-y-3">
          {(data.faqs ?? []).map((faq, i) => {
            const open = openIndex === i;
            return (
              <div key={faq.q} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={open}
                >
                  <span className="font-heading text-[15px] font-semibold">{faq.q}</span>
                  <ChevronDown
                    className={
                      "h-4 w-4 shrink-0 text-ink-soft transition-transform duration-200 " +
                      (open ? "rotate-180" : "")
                    }
                  />
                </button>
                {open ? (
                  <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-ink-soft">
                    {faq.a}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
`;
}

function contactFile(): string {
  return `"use client";
import { useState } from "react";
import type { SiteSection } from "@/components/siteData";
import { Section, SectionHeader } from "@/components/site/Section";
import { Icon } from "@/components/site/Icon";
import { Button } from "@/components/site/Button";
import { useLanguage } from "@/components/site/language";
import { CheckCircle2 } from "lucide-react";

export function Contact({ data }: { data: SiteSection }) {
  const [sent, setSent] = useState(false);
  const { t } = useLanguage();

  return (
    <Section id={data.id} className="bg-paper-soft py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow={t("Contact", "Contact")} heading={data.heading} sub={data.sub} />
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            {data.items.map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon name={item.icon} className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{t(item.title, item.title)}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
          <form
            className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <CheckCircle2 className="h-12 w-12 text-accent" />
                <p className="font-heading text-lg font-semibold">{t("Thank you for reaching out.", "Thank you for reaching out.")}</p>
                <p className="text-sm text-ink-soft">{t("We will get back to you shortly.", "We will get back to you shortly.")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
                    {t("Name", "Name")}
                  </label>
                  <input
                    id="name"
                    required
                    className="w-full rounded border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder={t("Your name", "Your name")}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                    {t("Email", "Email")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full rounded border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="mb-1.5 block text-sm font-medium">
                    {t("Message", "Message")}
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    className="w-full resize-none rounded border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                    placeholder={t("Tell us about your enquiry", "Tell us about your enquiry")}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {t("Send message", "Send message")}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </Section>
  );
}
`;
}

function footerFile(): string {
  return `"use client";
import type { SiteNavItem } from "@/components/siteData";
import { useLanguage } from "@/components/site/language";

interface FooterProps {
  brand: string;
  nav: SiteNavItem[];
}

export function Footer({ brand, nav }: FooterProps) {
  const year = new Date().getFullYear();
  const { t } = useLanguage();
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-accent font-heading text-base font-bold text-accent-fg">
            {brand.charAt(0).toUpperCase()}
          </span>
          <span className="font-heading text-[15px] font-semibold tracking-tight">{brand}</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Footer">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-ink-soft transition-colors hover:text-accent">
              {t(item.label, item.label)}
            </a>
          ))}
        </nav>
      </div>
      <div className="border-t border-slate-100 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-x-6 gap-y-2 px-4 text-xs text-ink-soft sm:flex-row">
          <a href="/blog" className="transition-colors hover:text-accent">{t("Blog", "Blog")}</a>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <a href="/terms" className="transition-colors hover:text-accent">{t("Terms & Services", "Terms & Services")}</a>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <a href="/privacy" className="transition-colors hover:text-accent">{t("Privacy Policy", "Privacy Policy")}</a>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <a href="/refund" className="transition-colors hover:text-accent">{t("Refund Policy", "Refund Policy")}</a>
        </div>
        <div className="mt-3 text-center text-xs text-ink-soft">
          &copy; {year} {brand}. {t("All rights reserved", "All rights reserved")}.
        </div>
      </div>
    </footer>
  );
}
`;
}

/* ------------------------------------------------------------------ */
/* Language (EN/AR) provider + toggle                                  */
/* ------------------------------------------------------------------ */

function languageFile(): string {
  return `"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

const DICT: Record<string, { en: string; ar: string }> = {
  "Get started": { en: "Get started", ar: "ابدأ الآن" },
  "Explore services": { en: "Explore services", ar: "استكشف خدماتنا" },
  "Contact us": { en: "Contact us", ar: "تواصل معنا" },
  "Get in touch": { en: "Get in touch", ar: "تواصل معنا" },
  "Enrol today": { en: "Enrol today", ar: "سجّل اليوم" },
  "Start a project": { en: "Start a project", ar: "ابدأ مشروعاً" },
  "Shop all": { en: "Shop all", ar: "تسوّق الكل" },
  "Send message": { en: "Send message", ar: "إرسال الرسالة" },
  "Book a session": { en: "Book a session", ar: "احجز جلسة" },
  "WhatsApp us": { en: "WhatsApp us", ar: "راسلنا على واتساب" },
  "Book via Calendly": { en: "Book via Calendly", ar: "احجز عبر كالندلي" },
  "About us": { en: "About us", ar: "من نحن" },
  "What we offer": { en: "What we offer", ar: "ما نقدمه" },
  "Courses & programs": { en: "Courses & programs", ar: "الدورات والبرامج" },
  "Selected work": { en: "Selected work", ar: "أعمال مختارة" },
  "Featured products": { en: "Featured products", ar: "منتجات مميزة" },
  "What people say": { en: "What people say", ar: "ماذا يقول الناس" },
  "Simple pricing": { en: "Simple pricing", ar: "أسعار بسيطة" },
  "Frequently asked questions": { en: "Frequently asked questions", ar: "الأسئلة الشائعة" },
  "Our services": { en: "Our services", ar: "خدماتنا" },
  "Learning": { en: "Learning", ar: "التعلّم" },
  "Our work": { en: "Our work", ar: "أعمالنا" },
  "Testimonials": { en: "Testimonials", ar: "آراء العملاء" },
  "Pricing": { en: "Pricing", ar: "الأسعار" },
  "FAQ": { en: "FAQ", ar: "الأسئلة الشائعة" },
  "Products": { en: "Products", ar: "المنتجات" },
  "Cart": { en: "Cart", ar: "السلة" },
  "Track order": { en: "Track order", ar: "تتبع الطلب" },
  "Blog": { en: "Blog", ar: "المدونة" },
  "Contact": { en: "Contact", ar: "تواصل معنا" },
  "About": { en: "About", ar: "من نحن" },
  "Services": { en: "Services", ar: "الخدمات" },
  "Courses": { en: "Courses", ar: "الدورات" },
  "Portfolio": { en: "Portfolio", ar: "الأعمال" },
  "Store": { en: "Store", ar: "المتجر" },
  "Checkout": { en: "Checkout", ar: "إتمام الشراء" },
  "People served": { en: "People served", ar: "شخص خدمناهم" },
  "Average rating": { en: "Average rating", ar: "متوسط التقييم" },
  "Years of experience": { en: "Years of experience", ar: "سنوات الخبرة" },
  "Open for new work": { en: "Open for new work", ar: "متاحون لمشاريع جديدة" },
  "Trusted local provider": { en: "Trusted local provider", ar: "مزوّد محلي موثوق" },
  "Learn more": { en: "Learn more", ar: "اعرف المزيد" },
  "Read article": { en: "Read article", ar: "اقرأ المقال" },
  "Back to blog": { en: "Back to blog", ar: "العودة إلى المدونة" },
  "Latest updates & insights": { en: "Latest updates & insights", ar: "أحدث التحديثات والرؤى" },
  "Terms & Services": { en: "Terms & Services", ar: "الشروط والخدمات" },
  "Privacy Policy": { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  "Refund Policy": { en: "Refund Policy", ar: "سياسة الاسترداد" },
  "All rights reserved": { en: "All rights reserved", ar: "جميع الحقوق محفوظة" },
  "Name": { en: "Name", ar: "الاسم" },
  "Email": { en: "Email", ar: "البريد الإلكتروني" },
  "Phone": { en: "Phone", ar: "الهاتف" },
  "Address": { en: "Address", ar: "العنوان" },
  "Message": { en: "Message", ar: "الرسالة" },
  "Your name": { en: "Your name", ar: "اسمك" },
  "Your email": { en: "Your email", ar: "بريدك الإلكتروني" },
  "Your message": { en: "Your message", ar: "رسالتك" },
  "Tell us about your enquiry": { en: "Tell us about your enquiry", ar: "أخبرنا عن استفسارك" },
  "Most popular": { en: "Most popular", ar: "الأكثر طلباً" },
  "Visit us": { en: "Visit us", ar: "زورونا" },
  "Call us": { en: "Call us", ar: "اتصلوا بنا" },
  "Email us": { en: "Email us", ar: "راسلونا" },
  "Add to cart": { en: "Add to cart", ar: "أضف إلى السلة" },
  "Added ✓": { en: "Added ✓", ar: "تمت الإضافة ✓" },
  "Buy now": { en: "Buy now", ar: "اشترِ الآن" },
  "Subtotal": { en: "Subtotal", ar: "المجموع الفرعي" },
  "Proceed to checkout": { en: "Proceed to checkout", ar: "إتمام عملية الشراء" },
  "Continue shopping": { en: "Continue shopping", ar: "مواصلة التسوق" },
  "Your cart is empty": { en: "Your cart is empty", ar: "سلتك فارغة" },
  "Payment method": { en: "Payment method", ar: "طريقة الدفع" },
  "Place order": { en: "Place order", ar: "تأكيد الطلب" },
  "Cash on Delivery": { en: "Cash on Delivery", ar: "الدفع عند الاستلام" },
  "Order placed": { en: "Order placed", ar: "تم تأكيد الطلب" },
  "Order status": { en: "Order status", ar: "حالة الطلب" },
  "Back to home": { en: "Back to home", ar: "العودة للرئيسية" },
  "Order number": { en: "Order number", ar: "رقم الطلب" },
  "We will contact you to confirm": { en: "We will contact you to confirm", ar: "سنتواصل معك للتأكيد" },
  "Place an order": { en: "Place an order", ar: "أكمل طلبك" },
  "1. Cart": { en: "1. Cart", ar: "١. السلة" },
  "2. Checkout": { en: "2. Checkout", ar: "٢. إتمام الشراء" },
  "3. Track": { en: "3. Track", ar: "٣. التتبع" },
  "Delivery": { en: "Delivery", ar: "التوصيل" },
  "Order confirmed": { en: "Order confirmed", ar: "تم تأكيد الطلب" },
  "Shipped": { en: "Shipped", ar: "تم الشحن" },
  "Delivered": { en: "Delivered", ar: "تم التوصيل" },
  "Reserve your slot in advance — pick the time that works for you.": {
    en: "Reserve your slot in advance — pick the time that works for you.",
    ar: "احجز موعدك مسبقاً — اختر الوقت الذي يناسبك.",
  },
  "A focused set of services, delivered with consistency and care.": {
    en: "A focused set of services, delivered with consistency and care.",
    ar: "مجموعة مركّزة من الخدمات، نقدّمها باستمرارية وعناية.",
  },
  "Practical, project-driven programs built around modern skills.": {
    en: "Practical, project-driven programs built around modern skills.",
    ar: "برامج عملية قائمة على المشاريع ومبنية على المهارات الحديثة.",
  },
  "A look at the kind of work we produce and the results we deliver.": {
    en: "A look at the kind of work we produce and the results we deliver.",
    ar: "نظرة على نوع الأعمال التي ننتجها والنتائج التي نحققها.",
  },
  "Clear pricing, honest features. Every order is tracked from checkout to delivery.": {
    en: "Clear pricing, honest features. Every order is tracked from checkout to delivery.",
    ar: "أسعار واضحة وميزات صادقة. كل طلب يُتتبّع من الدفع حتى التوصيل.",
  },
  "Real feedback from the people we work with.": {
    en: "Real feedback from the people we work with.",
    ar: "آراء حقيقية من الأشخاص الذين نعمل معهم.",
  },
  "Clear, honest pricing with no surprises.": {
    en: "Clear, honest pricing with no surprises.",
    ar: "أسعار واضحة وصادقة دون مفاجآت.",
  },
  "Answers to the questions we hear most often.": {
    en: "Answers to the questions we hear most often.",
    ar: "إجابات عن الأسئلة التي نسمعها كثيراً.",
  },
  "Tell us about your project or enquiry and we will respond promptly.": {
    en: "Tell us about your project or enquiry and we will respond promptly.",
    ar: "أخبرنا عن مشروعك أو استفسارك وسنرد عليك بسرعة.",
  },
  "No upfront fees · Flexible scheduling": { en: "No upfront fees · Flexible scheduling", ar: "بدون رسوم مسبقة · جداول مرنة" },
  "Thank you for reaching out.": { en: "Thank you for reaching out.", ar: "شكراً لتواصلك معنا." },
  "We will get back to you shortly.": { en: "We will get back to you shortly.", ar: "سنعاود التواصل معك قريباً." },
  "Order summary": { en: "Order summary", ar: "ملخص الطلب" },
  "Details": { en: "Details", ar: "التفاصيل" },
  "Featured": { en: "Featured", ar: "مميز" },
  "What is included": { en: "What is included", ar: "ما الذي تتضمنه" },
  "Back to products": { en: "Back to products", ar: "العودة إلى المنتجات" },
  "Processing…": { en: "Processing…", ar: "جارٍ المعالجة…" },
  "Browse products": { en: "Browse products", ar: "تصفح المنتجات" },
  "Continue": { en: "Continue", ar: "متابعة" },
};

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("forge-lang");
      if (saved === "ar" || saved === "en") setLang(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    try {
      window.localStorage.setItem("forge-lang", lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const t = (key: string, fallback?: string): string => {
    const entry = DICT[key];
    if (!entry) return fallback ?? key;
    return lang === "ar" ? entry.ar : entry.en;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-slate-200 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
      aria-label="Toggle language"
      title={lang === "en" ? "العربية" : "English"}
    >
      {lang === "en" ? "ع" : "EN"}
    </button>
  );
}
`;
}

/* ------------------------------------------------------------------ */
/* Shop data + client cart                                             */
/* ------------------------------------------------------------------ */

function shopDataFile(model: SiteModel): string {
  const products = JSON.stringify(model.products, null, 2);
  return `export interface ShopProduct {
  slug: string;
  name: string;
  price: number;
  currency: string;
  tag: string;
  description: string;
  features: string[];
  featured: boolean;
}

export interface ShopConfig {
  whatsapp: string;
  whatsappDigits: string;
  calendly: string;
  paymentMethods: ("stripe" | "paypal" | "jazzcash" | "easypaisa" | "cod")[];
}

export const products: ShopProduct[] = ${products};

export const shopConfig: ShopConfig = {
  whatsapp: ${JSON.stringify(model.whatsapp)},
  whatsappDigits: ${JSON.stringify(model.whatsappDigits)},
  calendly: ${JSON.stringify(model.calendly)},
  paymentMethods: ["stripe", "paypal", "jazzcash", "easypaisa", "cod"],
};

export function formatPrice(price: number, currency: string): string {
  return currency + " " + price.toFixed(2);
}
`;
}

function cartFile(): string {
  return `"use client";
import { useSyncExternalStore } from "react";

export interface CartItem {
  slug: string;
  name: string;
  price: number;
  qty: number;
}

export interface CartProduct {
  slug: string;
  name: string;
  price: number;
}

const KEY = "forge-cart";
let items: CartItem[] = [];
let listeners: (() => void)[] = [];

function load(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) items = JSON.parse(raw);
  } catch {
    /* ignore */
  }
}
load();

function emit(): void {
  listeners.forEach((l) => l());
}

function save(): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
  emit();
}

export function subscribe(fn: () => void): () => void {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

export function getSnapshot(): CartItem[] {
  return items;
}

export function addToCart(product: CartProduct, qty = 1): void {
  const existing = items.find((i) => i.slug === product.slug);
  if (existing) {
    items = items.map((i) =>
      i.slug === product.slug ? { ...i, qty: i.qty + qty } : i
    );
  } else {
    items = [...items, { slug: product.slug, name: product.name, price: product.price, qty }];
  }
  save();
}

export function setQty(slug: string, qty: number): void {
  items = items.map((i) => (i.slug === slug ? { ...i, qty: Math.max(1, qty) } : i));
  save();
}

export function removeFromCart(slug: string): void {
  items = items.filter((i) => i.slug !== slug);
  save();
}

export function clearCart(): void {
  items = [];
  save();
}

export function cartCount(): number {
  return items.reduce((n, i) => n + i.qty, 0);
}

export function cartSubtotal(): number {
  return items.reduce((n, i) => n + i.qty * i.price, 0);
}

export function useCart() {
  const current = useSyncExternalStore(subscribe, getSnapshot);
  return {
    items: current,
    count: cartCount(),
    subtotal: cartSubtotal(),
    add: addToCart,
    setQty,
    remove: removeFromCart,
    clear: clearCart,
  };
}
`;
}

function addToCartFile(): string {
  return `"use client";
import { useState } from "react";
import { useCart } from "@/components/site/cart";
import { useLanguage } from "@/components/site/language";
import type { ShopProduct } from "@/components/site/shopData";

export function AddToCart({ product, large = false }: { product: ShopProduct; large?: boolean }) {
  const { add } = useCart();
  const { t } = useLanguage();
  const [added, setAdded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        add({ slug: product.slug, name: product.name, price: product.price });
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1600);
      }}
      className={
        "inline-flex items-center justify-center gap-2 rounded-lg bg-accent font-semibold text-accent-fg transition-opacity hover:opacity-90 " +
        (large ? "px-6 py-3 text-base" : "px-4 py-2.5 text-sm")
      }
    >
      {added ? t("Added ✓", "Added ✓") : t("Add to cart", "Add to cart")}
    </button>
  );
}
`;
}

function whatsappButtonFile(): string {
  return `import { shopConfig } from "@/components/site/shopData";

export function WhatsAppButton() {
  const href =
    "https://wa.me/" +
    shopConfig.whatsappDigits +
    "?text=" +
    encodeURIComponent("Hello! I would like to know more about your services.");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
      </svg>
    </a>
  );
}
`;
}

/* ------------------------------------------------------------------ */
/* Shop pages                                                          */
/* ------------------------------------------------------------------ */

function productsPageFile(model: SiteModel): string {
  return `import { siteData } from "@/components/siteData";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { products, formatPrice } from "@/components/site/shopData";
import { AddToCart } from "@/components/site/AddToCart";

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader brand={siteData.brand} nav={siteData.nav} isEcommerce />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Store</p>
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">Featured products</h1>
          <p className="mt-4 text-base text-ink-soft">
            Clear pricing, honest features. Every order is tracked from checkout to delivery.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.slug}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
                  {p.tag}
                </span>
                {p.featured ? (
                  <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">Featured</span>
                ) : null}
              </div>
              <h2 className="mt-5 font-heading text-xl font-semibold">{p.name}</h2>
              <p className="mt-2 flex-1 text-sm text-ink-soft">{p.description}</p>
              <ul className="mt-4 space-y-1.5">
                {p.features.slice(0, 3).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink-soft">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-2.5 w-2.5">
                        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <span className="font-heading text-lg font-bold text-ink">{formatPrice(p.price, p.currency)}</span>
                <a href={"/products/" + p.slug} className="text-sm font-semibold text-accent hover:underline">
                  Details
                </a>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <AddToCart product={p} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <Footer brand={siteData.brand} nav={siteData.nav} />
      <WhatsAppButton />
    </main>
  );
}
`;
}

function productPageFile(model: SiteModel): string {
  return `import { notFound } from "next/navigation";
import { siteData } from "@/components/siteData";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { products, formatPrice } from "@/components/site/shopData";
import { AddToCart } from "@/components/site/AddToCart";
import { Button } from "@/components/site/Button";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = products.find((p) => p.slug === params.slug);
  if (!product) notFound();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader brand={siteData.brand} nav={siteData.nav} isEcommerce />
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <div className="flex flex-col justify-center rounded-3xl border border-slate-200 bg-gradient-to-br from-accent-soft via-paper to-paper p-10">
          <span className="self-start rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            {product.tag}
          </span>
          <div className="mt-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent font-heading text-3xl font-bold text-accent-fg">
            {product.name.charAt(0).toUpperCase()}
          </div>
          <p className="mt-6 font-heading text-2xl font-bold text-ink">{formatPrice(product.price, product.currency)}</p>
          {product.featured ? (
            <p className="mt-2 text-sm font-medium text-accent">Most popular</p>
          ) : null}
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Store</p>
          <h1 className="font-heading text-4xl font-bold tracking-tight">{product.name}</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">{product.description}</p>
          <h2 className="mt-8 font-heading text-lg font-semibold">What is included</h2>
          <ul className="mt-4 space-y-2.5">
            {product.features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-ink-soft">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <AddToCart product={product} large />
            <Button href="/checkout" variant="outline" size="lg">
              Buy now
            </Button>
          </div>
          <a href="/products" className="mt-6 inline-block text-sm font-semibold text-accent hover:underline">
            &larr; Back to products
          </a>
        </div>
      </section>
      <Footer brand={siteData.brand} nav={siteData.nav} />
      <WhatsAppButton />
    </main>
  );
}
`;
}

function cartPageFile(): string {
  return `"use client";
import { siteData } from "@/components/siteData";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { useCart } from "@/components/site/cart";
import { useLanguage } from "@/components/site/language";
import { Button } from "@/components/site/Button";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartPage() {
  const { items, count, subtotal, setQty, remove } = useCart();
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader brand={siteData.brand} nav={siteData.nav} isEcommerce />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t("Cart", "Cart")}</h1>
          <span className="text-sm text-ink-soft">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <p className="text-lg font-semibold">{t("Your cart is empty", "Your cart is empty")}</p>
            <p className="max-w-sm text-sm text-ink-soft">
              Add some products from the store and come back here to check out.
            </p>
            <Button href="/products">Continue shopping</Button>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {items.map((item) => (
              <div
                key={item.slug}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 last:border-0"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{item.name}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setQty(item.slug, item.qty - 1)}
                      className="flex h-9 w-9 items-center justify-center text-ink-soft transition-colors hover:text-accent"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(item.slug, item.qty + 1)}
                      className="flex h-9 w-9 items-center justify-center text-ink-soft transition-colors hover:text-accent"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="w-20 text-right font-semibold text-ink">{(item.price * item.qty).toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => remove(item.slug)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-paper-soft px-5 py-5">
              <span className="text-base font-semibold text-ink">{t("Subtotal", "Subtotal")}</span>
              <span className="font-heading text-2xl font-bold text-ink">{subtotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        {items.length > 0 ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Button href="/products" variant="outline">Continue shopping</Button>
            <Button href="/checkout" size="lg">Proceed to checkout</Button>
          </div>
        ) : null}
      </section>
      <Footer brand={siteData.brand} nav={siteData.nav} />
      <WhatsAppButton />
    </main>
  );
}
`;
}

function checkoutPageFile(): string {
  return `"use client";
import { useState } from "react";
import { siteData } from "@/components/siteData";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { useCart } from "@/components/site/cart";
import { useLanguage } from "@/components/site/language";
import { shopConfig } from "@/components/site/shopData";
import { Button } from "@/components/site/Button";

type Status = "idle" | "processing" | "success" | "error";

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

function paymentMethodLabel(method: string): string {
  switch (method) {
    case "stripe":
      return "Stripe (card)";
    case "paypal":
      return "PayPal";
    case "jazzcash":
      return "JazzCash";
    case "easypaisa":
      return "Easypaisa";
    default:
      return "Cash on Delivery";
  }
}

export default function CheckoutPage() {
  const { items, count, subtotal, clear } = useCart();
  const { t } = useLanguage();
  const [method, setMethod] = useState("cod");
  const [form, setForm] = useState<CustomerInfo>({ name: "", email: "", phone: "", address: "" });
  const [status, setStatus] = useState<Status>("idle");
  const [orderId, setOrderId] = useState<string | null>(null);

  const valid = items.length > 0 && form.name.trim() && form.email.trim() && form.phone.trim();

  async function placeOrder() {
    if (!valid) return;
    setStatus("processing");
    const payload = {
      method,
      customer: form,
      items: items.map((i) => ({ slug: i.slug, name: i.name, price: i.price, qty: i.qty })),
      total: subtotal,
      currency: "USD",
    };

    try {
      let url: string | null = null;
      if (method === "stripe" || method === "paypal") {
        const res = await fetch("/api/payments/" + method, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.url) url = data.url;
      }

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const orderData = await orderRes.json().catch(() => ({}));

      if (orderRes.ok && orderData.order) {
        setOrderId(orderData.order.id);
        setStatus("success");
        clear();
        recordLocalOrder(orderData.order);
      } else if (url) {
        window.location.href = url;
      } else {
        fallbackSuccess();
      }
    } catch {
      fallbackSuccess();
    }
  }

  function fallbackSuccess() {
    const id = "FORGE-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const local = {
      id,
      method,
      items: items.map((i) => ({ slug: i.slug, name: i.name, price: i.price, qty: i.qty })),
      total: subtotal,
      status: "placed",
      createdAt: new Date().toISOString(),
    };
    recordLocalOrder(local);
    setOrderId(id);
    setStatus("success");
    clear();
  }

  function recordLocalOrder(order: { id: string }) {
    try {
      const existing = JSON.parse(window.localStorage.getItem("forge-orders") || "[]");
      existing.push(order);
      window.localStorage.setItem("forge-orders", JSON.stringify(existing));
    } catch {
      /* ignore */
    }
  }

  if (status === "success") {
    return (
      <main className="min-h-screen bg-paper text-ink">
        <SiteHeader brand={siteData.brand} nav={siteData.nav} isEcommerce />
        <section className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-8 w-8">
              <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight">{t("Order placed", "Order placed")}</h1>
          <p className="mt-3 text-base text-ink-soft">{t("We will contact you to confirm", "We will contact you to confirm")}</p>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-ink-soft">{t("Order number", "Order number")}</p>
            <p className="mt-1 font-mono text-lg font-bold text-ink">{orderId}</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button href="/order-tracking">Track order</Button>
            <Button href="/products" variant="outline">Continue shopping</Button>
          </div>
        </section>
        <Footer brand={siteData.brand} nav={siteData.nav} />
        <WhatsAppButton />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader brand={siteData.brand} nav={siteData.nav} isEcommerce />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t("Checkout", "Checkout")}</h1>

          <h2 className="mt-10 font-heading text-lg font-semibold">1. Contact details</h2>
          <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-ink">
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:border-accent"
                placeholder="Your name"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-ink">
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:border-accent"
                placeholder="+1 234 567 890"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-ink sm:col-span-2">
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:border-accent"
                placeholder="you@example.com"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-ink sm:col-span-2">
              Address
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-ink outline-none transition-colors focus:border-accent"
                placeholder="123 Main Street, City"
              />
            </label>
          </div>

          <h2 className="mt-10 font-heading text-lg font-semibold">{t("Payment method", "Payment method")}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {shopConfig.paymentMethods.map((m) => (
              <label
                key={m}
                className={
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors " +
                  (method === m ? "border-accent bg-accent-soft text-ink" : "border-slate-200 bg-white text-ink-soft hover:border-slate-300")
                }
              >
                <input
                  type="radio"
                  name="method"
                  value={m}
                  checked={method === m}
                  onChange={() => setMethod(m)}
                  className="accent-[color:var(--accent)]"
                />
                {paymentMethodLabel(m)}
              </label>
            ))}
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-heading text-lg font-semibold">{t("Order summary", "Order summary")}</h2>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item.slug} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-ink-soft">
                    {item.name} <span className="text-ink-soft/60">&times; {item.qty}</span>
                  </span>
                  <span className="font-semibold text-ink">{(item.price * item.qty).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
              <span className="font-semibold text-ink">{t("Subtotal", "Subtotal")}</span>
              <span className="font-heading text-xl font-bold text-ink">{subtotal.toFixed(2)}</span>
            </div>
            <p className="mt-4 text-xs text-ink-soft">
              By placing this order you agree to our Terms &amp; Services. Pay online or on delivery — your choice.
            </p>
            <button
              type="button"
              onClick={placeOrder}
              disabled={!valid || status === "processing"}
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-accent px-6 py-3 text-base font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "processing" ? "Processing…" : t("Place order", "Place order")}
            </button>
            {!valid && items.length > 0 ? (
              <p className="mt-3 text-center text-xs text-red-500">
                Please add your name, email and phone to continue.
              </p>
            ) : null}
            {items.length === 0 ? (
              <p className="mt-3 text-center text-xs text-ink-soft">
                Your cart is empty.{" "}
                <a href="/products" className="font-semibold text-accent hover:underline">
                  Browse products
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </section>
      <Footer brand={siteData.brand} nav={siteData.nav} />
      <WhatsAppButton />
    </main>
  );
}
`;
}

function orderTrackingPageFile(): string {
  return `"use client";
import { useState } from "react";
import { siteData } from "@/components/siteData";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { useLanguage } from "@/components/site/language";
import { Button } from "@/components/site/Button";

const STAGES = ["placed", "confirmed", "shipped", "delivered"];

function stageIndex(status: string): number {
  const i = STAGES.indexOf(status);
  return i === -1 ? 0 : i;
}

export default function OrderTrackingPage() {
  const { t } = useLanguage();
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<{
    id: string;
    status: string;
    items: { name: string; qty: number; price: number }[];
    total: number;
    createdAt: string;
    source: string;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  async function track(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId.trim()) return;
    setLoading(true);
    setNotFound(false);
    try {
      const res = await fetch("/api/orders?orderId=" + encodeURIComponent(orderId.trim()));
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.order) {
        setResult({ ...data.order, source: "live" });
      } else {
        const local = readLocalOrders().find((o: { id: string }) => o.id === orderId.trim());
        if (local) {
          setResult({ ...local, source: "demo" });
        } else {
          setNotFound(true);
          setResult(null);
        }
      }
    } catch {
      const local = readLocalOrders().find((o: { id: string }) => o.id === orderId.trim());
      if (local) {
        setResult({ ...local, source: "demo" });
      } else {
        setNotFound(true);
        setResult(null);
      }
    } finally {
      setLoading(false);
    }
  }

  function readLocalOrders() {
    try {
      return JSON.parse(window.localStorage.getItem("forge-orders") || "[]");
    } catch {
      return [];
    }
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <SiteHeader brand={siteData.brand} nav={siteData.nav} isEcommerce />
      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Delivery</p>
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{t("Track order", "Track order")}</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Enter your order number to see its current status. Orders are tracked from checkout to delivery.
        </p>

        <form onSubmit={track} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="e.g. FORGE-ABC123"
            className="flex-1 rounded-lg border border-slate-200 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading || !orderId.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "…" : t("Track order", "Track order")}
          </button>
        </form>

        {notFound ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-ink-soft">
            No order found with that number.
          </div>
        ) : null}

        {result ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-ink-soft">{t("Order number", "Order number")}</p>
                <p className="font-mono text-base font-bold text-ink">{result.id}</p>
              </div>
              <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent">
                {result.status}
              </span>
            </div>

            <ol className="mt-8 grid grid-cols-4 gap-2">
              {STAGES.map((stage, i) => {
                const reached = i <= stageIndex(result.status);
                return (
                  <li key={stage} className="flex flex-col items-center gap-2 text-center">
                    <span
                      className={
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold " +
                        (reached ? "bg-accent text-accent-fg" : "bg-slate-100 text-ink-soft")
                      }
                    >
                      {i + 1}
                    </span>
                    <span className={"text-[11px] font-medium " + (reached ? "text-ink" : "text-ink-soft")}>
                      {t(stage.charAt(0).toUpperCase() + stage.slice(1), stage.charAt(0).toUpperCase() + stage.slice(1))}
                    </span>
                  </li>
                );
              })}
            </ol>

            <ul className="mt-8 space-y-2 border-t border-slate-100 pt-5">
              {result.items.map((item) => (
                <li key={item.name} className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">
                    {item.name} <span className="text-ink-soft/60">&times; {item.qty}</span>
                  </span>
                  <span className="font-semibold text-ink">{(item.price * item.qty).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="font-semibold text-ink">{t("Subtotal", "Subtotal")}</span>
              <span className="font-heading text-xl font-bold text-ink">{Number(result.total || 0).toFixed(2)}</span>
            </div>

            {result.source === "demo" ? (
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Demo mode: no API server is running, so this order was looked up locally in your browser.
              </p>
            ) : null}

            <div className="mt-6">
              <Button href="/products" variant="outline">Continue shopping</Button>
            </div>
          </div>
        ) : null}
      </section>
      <Footer brand={siteData.brand} nav={siteData.nav} />
      <WhatsAppButton />
    </main>
  );
}
`;
}

/* Re-export for static preview generator */
export { buildSiteModel };
