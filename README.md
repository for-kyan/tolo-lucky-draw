# TSDS (Tolo Studio Draw System) — Ephemeral Live Raffle & Event Broadcast System

**TSDS** is a privacy-first, real-time lucky draw and raffle presentation platform built for live events. Participant lists are processed strictly in client-side browser memory (RAM) with zero server-side retention of entrant PII, while winner reveals and live display styling sync instantaneously across stage screens via WebSockets.

---

## Devlopment History and Choice Rationale
This project was built with the assistance of the publicily accessible version of Google Gemini. The developer prior to this project had experience in some js, php, SQL, java and C languages. However this project as much as was about building the software, served as a learning process to understand this new world of AI assisted coding whichnow exists and as a way to better understand next/react .js , postgres as well as using them in such a tech stack with github, vercel and supabase. Forgive the clunky nature of learning, but its a journey we must all travel. Best practices were kept in mind and adherence was attempted. I hope this project can provide any viewwers with some insight and entertainment.

It Should be kept in mind, while the AI was benefical, it made errors and due to security (I assume) certain symbols where hardcoded to not display in the output, breaking the code in cases. This little code project still required some old fashioned debugging and tracing, perhaps I missed a new tool, its entirely possible.


## Core Architecture & Privacy Model

Unlike traditional raffle tools that store participant spreadsheets in cloud databases, TSDS enforces an **ephemeral data architecture**:

* **Zero-Retention Participant Data:** Uploaded Excel spreadsheets (`.xlsx`, `.xls`) and generated numeric pools live exclusively inside the operator's browser session memory. Closing the workspace, deleting the draw, or signing out permanently purges all entrant data.
* **Real-Time Multi-Screen Broadcasts:** Powered by **Supabase Realtime Broadcast channels** (`lucky-draw-room:<drawId>`), a single operator console can drive multiple passive 4K display screens simultaneously with sub-second latency.
* **Role-Based Access Control:** **Supabase Auth** and PostgreSQL handle user verification (`admin` vs. `operator` roles) and anonymous system-wide draw usage metrics without ever touching participant names.

```text
┌──────────────────────────────────────────────────────────┐
│                  Vercel Edge / Cloud                     │
│               Next.js App Router (TypeScript)            │
└────────────────────────────┬─────────────────────────────┘
                             │
             ┌───────────────┴───────────────┐
             ▼                               ▼
┌─────────────────────────┐     ┌──────────────────────────┐
│   Supabase Auth & DB    │     │ Supabase Realtime Socket │
│ (User Roles & Metadata) │     │ (Ephemeral Broadcasts)   │
└─────────────────────────┘     └────────────┬─────────────┘
                                             │
                       ┌─────────────────────┼─────────────────────┐
                       ▼                     ▼                     ▼
            ┌────────────────────┐ ┌───────────────────┐ ┌───────────────────┐
            │  Operator Console  │ │  Stage Display 1  │ │  Stage Display 2  │
            │  (/dashboard/[id]) │ │  (/display/[id])  │ │  (/display/[id])  │
            │  • Client RAM Pool │ │  • Passive View   │ │  • Passive View   │
            │  • Live Styling    │ │  • Google Fonts   │ │  • 5 Animations   │
            └────────────────────┘ └───────────────────┘ └───────────────────┘
```

---

## Key Features

* **Flexible Entry Ingestion (`SheetJS`):**
  * **Standard Names List:** Single-entry participant rows with optional ticket numbers.
  * **Weighted Entries:** Supports entry multipliers (`Entries` / `Weight`) or sequential ticket ranges (e.g., `1-150`).
  * **Numbers Generator:** Instant in-memory numeric pool generation between custom start/end bounds.
  * **Optional Extra Column:** Automatically detects an additional spreadsheet column (e.g., `Subtitle`, `Department`, `Prize`, `Table`) and displays it above or below the main reveal.
* **Live Stage Display Customization:**
  * Dynamic **Google Fonts** loading by font family name.
  * Real-time **Font Size (`+` / `-`)** scaling with viewport-safe text wrapping.
  * Custom **Backdrop Image** upload with adjustable **Background Blur (`0px–24px`)**.
  * Toggleable **Frosted Glass Card (`Font Background`)** and custom hex text colors.
  * **Screen Position Offset:** Pin winner reveals to the **Top Third**, **Middle Third**, or **Bottom Third** of the screen to avoid stage logos or lower-thirds graphics.
  * **5 Reveal Animations:** *Rolling Shuffle*, *Slot Machine Spin*, *Clean Fade-In*, *Zoom-Pop*, and *Matrix RGB Glitch*.
* **Multi-Language Support:** Built-in localization for **English (`EN`)**, **Spanish (`ES`)**, **French (`FR`)**, **Arabic (`AR`)**, and **Traditional Chinese (`ZH`)**.

---

## Tech Stack

* **Framework:** Next.js (App Router) with React & TypeScript
* **Styling:** Tailwind CSS
* **Authentication & Realtime:** Supabase (`@supabase/supabase-js`)
* **Spreadsheet Parsing:** SheetJS (`xlsx`)
* **Hosting:** Vercel

---

## Project Structure

```text
├── app/
│   ├── login/                 # Supabase authentication entry
│   ├── manage/                # Role-based workspace directory & admin console
│   ├── dashboard/[drawId]/    # Operator control panel & live aesthetics studio
│   └── display/[drawId]/      # Passive public stage screen receiver
├── components/
│   ├── dashboard/             # AestheticsPanel & DrawHistorySidebar
│   ├── manage/                # AdminSidebar (stats & operator provisioning)
│   ├── shared/                # SignOutButton & LocaleSelector
│   └── ui/                    # Base UI primitives
├── constants/
│   └── locales.ts             # Multi-language UI & display dictionaries
├── lib/
│   └── supabase/              # Browser & server Supabase client helpers
└── types/
    └── draw.ts                # Shared RaffleTicket & DisplayAesthetics contracts
```

---

## Local Development Setup

### 1. Prerequisites
* Node.js `18.18+` or `20+`
* A configured [Supabase](https://supabase.com) project with Authentication enabled and `profiles` / `draw_usage_stats` tables created.

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

Tolo Draw is configured for deployment on **Vercel**:
1. Push the repository to GitHub/GitLab/Bitbucket.
2. Import the project into Vercel and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under **Project Settings → Environment Variables**.
3. Attach your custom domain in Vercel and add both the production domain and Vercel preview URLs to **Supabase → Authentication → URL Configuration**.
