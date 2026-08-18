# Forge Studio

**AI-powered website builder + private coding agent** — build, edit, and deploy websites with AI assistance.

---

## What is Forge Studio?

Forge Studio is a full-stack development platform that combines:

1. **Website Builder** — Generate complete Next.js/React websites from a single prompt
2. **Seher Agent** — A private AI coding assistant with full tool access (file edit, commands, everything)

Built with Next.js 14, TypeScript, and Tailwind CSS.

---

## Features

### Website Builder
- Generate complete websites from text prompts
- Multiple templates: Light, Dark, Bold
- EN/AR language toggle
- WhatsApp integration
- E-commerce ready (cart, checkout, payments, orders)
- Download as ZIP
- Live preview

### Seher Agent (AI Coding Assistant)
- Terminal-style holographic UI
- Full opencode CLI integration
- File upload (single files + folders)
- File browser with preview
- Model selector (300+ AI models)
- Copy/paste responses
- Keyboard shortcuts (Enter send, Esc cancel)

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/seher873/forge-studio.git
cd forge-studio
npm install
```

### Environment Setup

Create `.env.local`:

```bash
# Wrapper config
WRAP_ENABLED=true
WRAP_MODEL=opencode/big-pickle

# AI Provider Keys (add one or more)
OPENAI_API_KEY=sk-xxxxx        # For GPT-4
ANTHROPIC_API_KEY=sk-ant-xxx   # For Claude
GEMINI_API_KEY=xxx             # For Gemini (free tier available)
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

- `/` — Dashboard
- `/seher` — Seher Agent (AI coding assistant)
- `/admin` — Admin panel (MASTER_ADMIN only)
- `/workspace/[id]` — Project workspace

---

## How It Works

### Website Builder Flow
1. Enter a prompt (e.g., "bakery website with 5 pages, red theme")
2. Generator parses: brand name, pages, sections, colors
3. Pre-built templates fill with your content
4. Live preview in iframe
5. Download as ZIP (HTML/CSS/JS or React/Next.js)

### Seher Agent Flow
1. Type a prompt or upload files
2. Agent sends to opencode CLI (local, no cloud)
3. AI processes with full tool access
4. Response appears in holographic chat UI
5. Copy code, edit files, run commands

---

## Project Structure

```
forge-studio/
├── app/
│   ├── admin/              # Admin panel
│   ├── api/
│   │   ├── ai/             # AI generation endpoint
│   │   └── wrap/           # Seher Agent API
│   │       ├── route.ts    # Main wrapper
│   │       ├── models/     # Model list
│   │       └── files/      # File browser
│   ├── seher/              # Seher Agent UI
│   ├── workspace/          # Project workspace
│   ├── globals.css         # Global styles + holographic theme
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Dashboard
├── components/
│   ├── admin/              # Admin components
│   ├── dashboard/          # Dashboard components
│   ├── ui/                 # Shared UI components
│   └── workspace/          # Workspace components
├── lib/
│   ├── generator/          # Website generation engine
│   │   ├── index.ts        # Main generator
│   │   ├── model.ts        # Site model builder
│   │   ├── react.ts        # React code generator
│   │   ├── static.ts       # Static HTML generator
│   │   ├── fullstack.ts    # Full-stack generator
│   │   └── tokens.ts       # Design tokens
│   ├── store.tsx           # Global state management
│   ├── permissions.ts      # Role-based access
│   └── types.ts            # TypeScript types
├── public/                 # Static assets
├── .env.local              # Environment variables (not in git)
└── package.json
```

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State:** React Context + Hooks
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **AI Backend:** opencode CLI (local)
- **Database:** Client-side (localStorage/sessionStorage)

---

## Deployment

### Local (Current)
Best for personal use. Run `npm run dev` and access locally.

### Production (Future)
To deploy as a SaaS product:

| Service | Purpose | Cost |
|---------|---------|------|
| Vercel | Frontend hosting | Free tier |
| Railway | Backend (API) | $5-20/month |
| Supabase | Database | Free tier |
| Stripe | Payments | 2.9% per txn |

---

## Business Model

### Pricing Plans

| Plan | Price (USD) | Price (PKR) | Features |
|------|-------------|-------------|----------|
| **Free** | $0 | Rs 0 | 10 queries/day, slow model |
| **Starter** | $9/month | Rs 2,520 | 200 queries, fast model |
| **Pro** | $29/month | Rs 8,120 | Unlimited queries, all models, file upload |
| **Team** | $79/month | Rs 22,120 | 5 users, priority support, API access |

### Revenue Projections

| Users | Plan | Monthly Revenue |
|-------|------|-----------------|
| 100 | Starter ($9) | $900 (Rs 252,000) |
| 500 | Pro ($29) | $14,500 (Rs 40,60,000) |
| 1000 | Pro ($29) | $29,000 (Rs 81,20,000) |

### Cost Breakdown

| Item | Monthly Cost |
|------|--------------|
| Vercel (frontend) | Free |
| Railway (backend) | $5-20 |
| Database | Free tier |
| AI API (per user) | $0.01-0.05/query |
| Domain | $12/year |
| **Total** | **~$20-30/month** |

### Break-even
5-10 paying users covers all costs.

---

## How to Sell

### Phase 1: Launch (Week 1-2)
1. Build landing page with Forge Studio itself
2. Create Twitter/X account
3. Post daily: "I built a free AI coding tool"
4. Record demo video

### Phase 2: Growth (Week 3-4)
1. Launch on ProductHunt (free)
2. Post on Reddit (r/webdev, r/SaaS)
3. Create Discord community
4. Upload tutorials to YouTube

### Phase 3: Monetization (Month 2)
1. Add Stripe for payments
2. Launch paid plans
3. Collect testimonials
4. Start email marketing

### Phase 4: Scale (Month 3+)
1. Google Ads ($5-10/day)
2. Facebook Groups (Pakistan developers)
3. LinkedIn outreach
4. Urdu/Hindi YouTube tutorials

### Marketing Channels

| Channel | Action | Cost |
|---------|--------|------|
| Twitter/X | Daily posts, threads | Free |
| YouTube | Tutorial videos | Free |
| ProductHunt | Launch day | Free |
| Reddit | Community posts | Free |
| Google Ads | "AI website builder" | $5-10/day |
| Facebook | Developer groups | Free |

---

## Security

- `.env.local` is gitignored (never committed)
- API keys stay on server (never sent to browser)
- Role-based access (MASTER_ADMIN, ADMIN, USER)
- Session-based authentication
- Input validation on all endpoints

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `WRAP_ENABLED` | Yes | Enable Seher Agent (`true`/`false`) |
| `WRAP_MODEL` | No | Default AI model |
| `WRAP_KEY` | No | Access key for agent |
| `OPENAI_API_KEY` | No | OpenAI API key |
| `ANTHROPIC_API_KEY` | No | Anthropic API key |
| `GEMINI_API_KEY` | No | Google Gemini API key |

---

## License

Private — All rights reserved by Seher.

---

## Author

**Seher** — Full-stack developer, AI enthusiast.

Built with ❤️ in Pakistan.
