export type DesignStyle = "modern" | "minimal" | "premium" | "bold";

export type ProjectMode = "frontend" | "full-stack" | "custom";

export type UserRole = "MASTER_ADMIN" | "ADMIN" | "USER" | "CLIENT";

export type Capability =
  | "generation"
  | "frontend"
  | "backend"
  | "api"
  | "database"
  | "auth"
  | "ai_agent"
  | "code_editor"
  | "terminal"
  | "packages"
  | "zip_export"
  | "deployment"
  | "user_management";

export type CapabilityMap = Record<Capability, boolean>;

export interface PermissionProfile {
  id: string;
  name: string;
  description: string;
  capabilities: CapabilityMap;
  builtin?: boolean;
}

export interface PlatformUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  profileId: string;
  overrides: Partial<CapabilityMap>;
  createdAt: number;
}

export interface AgentSettings {
  enabled: boolean;
  instructions: string;
  model: string;
}

export type SectionType =
  | "hero"
  | "about"
  | "services"
  | "courses"
  | "portfolio"
  | "testimonials"
  | "pricing"
  | "faq"
  | "products"
  | "contact";

export interface ProjectInfo {
  name: string;
  industry: string;
  details: string;
  color?: string;
  design?: DesignStyle;
  sections?: string[];
  mode?: ProjectMode;
  createdAt: number;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

export type LogLevel = "info" | "success" | "warn" | "error" | "cmd";

export interface LogLine {
  id: string;
  time: string;
  level: LogLevel;
  text: string;
}

export interface Project {
  id: string;
  info: ProjectInfo;
  files: Record<string, GeneratedFile>;
  previewHtml: string;
  status: "created" | "generated" | "failed";
  aiEnabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface GenerationResult {
  files: Record<string, GeneratedFile>;
  previewHtml: string;
  steps: string[];
  root: string;
}

export interface AIChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIProposedChange {
  path: string;
  content: string;
  reason: string;
}

export interface AIResponse {
  reply: string;
  changes: AIProposedChange[];
  offline: boolean;
}

/* ---- Section content model used by the generated website ---- */

export interface NavItem {
  label: string;
  href: string;
}

export interface SiteItem {
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

export interface TeamMember {
  name: string;
  role: string;
  initials: string;
}

export interface ShopProduct {
  slug: string;
  name: string;
  price: number;
  currency: string;
  tag: string;
  description: string;
  features: string[];
  featured: boolean;
}

export interface SiteSection {
  id: string;
  type: SectionType;
  heading: string;
  sub?: string;
  items: SiteItem[];
  stats?: SiteStats[];
  faqs?: SiteFaq[];
  team?: TeamMember[];
  cta?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
}

export interface BlogPost {
  title: string;
  slug: string;
  date: string;
  tag: string;
  excerpt: string;
  body: string[];
}

export interface SiteModel {
  brand: string;
  tagline: string;
  nav: NavItem[];
  sections: SiteSection[];
  blog: BlogPost[];
  products: ShopProduct[];
  isEcommerce: boolean;
  whatsapp: string;
  whatsappDigits: string;
  calendly: string;
  metaTitle: string;
  metaDescription: string;
}

export interface DesignTokens {
  name: DesignStyle;
  accent: string;
  accentRgb: string;
  accentSoft: string;
  onAccent: string;
  radius: string;
  headingFont: string;
  heroStyle: "centered" | "split" | "overlay";
  ctaGradient: boolean;
  showTopBar: boolean;
}
