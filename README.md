# PriceHunter

Global product price comparison app. Search any product across e-commerce stores in any country.

## Setup

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/pricehunter.git
cd pricehunter
npm install
```

### 2. Create .env file
```bash
cp .env.example .env
```
Edit `.env` and fill in:
```
VITE_SUPABASE_URL=https://wexvjbbnkglqzipiwnfd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Run locally
```bash
npm run dev
```

### 4. Deploy to Netlify
- Connect your GitHub repo to Netlify
- Set environment variables in Netlify dashboard:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Build command: `npm run build`
- Publish directory: `dist`

## Stack
- React + TypeScript + Vite
- Tailwind CSS
- Supabase (auth + database + realtime)
- n8n (scraping automation)
- Firecrawl (web scraping)
