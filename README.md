# REDACT: AI-Powered Privacy Guardian & DPDP Compliance Engine

[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Express.js-000000.svg)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20API-orange.svg)](https://ai.google.dev/)
[![Tailwind v4](https://img.shields.io/badge/Styling-Tailwind%20v4-38bdf8.svg)](https://tailwindcss.com/)

An AI-powered face-match scan and digital privacy protection dashboard built specifically for Indian users. **REDACT** detects unauthorized or malicious uses of personal identity online and instantly drafts legal takedown notices and cybercrime portal reports fully compliant with India's **Digital Personal Data Protection (DPDP) Act 2023** and **IT Act 2000**.

---

## 🚀 Executive Summary (For Recruiters & Hiring Managers)

**REDACT** is a full-stack, enterprise-grade application designed to tackle a pressing real-world issue: online non-consensual personal data distribution and identity threats. Rather than a client-only prototype, it implements a highly reliable, dual-layered architecture:
1. **Frontend Architecture**: A modern Single Page Application (SPA) utilizing **React 19**, **Vite**, **Motion** (framer-motion) for transitions, and **Tailwind CSS v4** to present a visual, dashboard-driven experience.
2. **Backend Services**: A lightweight, secure **Express** server acting as a reverse-proxy and gateway to the **Google Gemini SDK (`@google/genai`)**, keeping high-privilege keys hidden on the server.
3. **Resiliency Engineering**: Implements an advanced, custom-engineered **Retry and Dynamic Fallback Gateway** on the Express server to prevent service degradation during API demand spikes (gracefully shifting from `gemini-3.5-flash` to `gemini-3.1-flash-lite` if the upstream is under heavy load).

---

## 🗺️ Architectural Blueprint & Data Pipeline

Below is a conceptual system map representing how user interactions flow through the secure client-server boundaries, execute computer-vision tasks via Gemini, and compile legal artifacts.

```text
       ┌────────────────────────────────────────────────────────┐
       │                     React 19 Client                    │
       │  - Webcam / Drag-and-Drop Image Capturer               │
       │  - DPDP Compliance & Threat Action Dashboard           │
       └───────────────────────────┬────────────────────────────┘
                                   │
                     JSON payload  │  Secure HTTPS Proxy
                 & base64 images   │  (Keeps API Key hidden)
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                Express Node.js Server                  │
       │  - Route handlers: /api/scan, /api/legal, /api/auth    │
       │  - Policy Verification Engine & Formatting Router      │
       └───────────────────────────┬────────────────────────────┘
                                   │
              Call with            │  Smart Fallback Pipeline
              Auto-Retry           │  (Handles 503/429 Upstreams)
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             Google Gemini API Gateway                  │
       │  - Primary: gemini-3.5-flash                           │
       │  - Fallback: gemini-3.1-flash-lite                     │
       │  - Returns real-time threat maps & legal drafts       │
       └────────────────────────────────────────────────────────┘
```

---

## ✨ Core Features & Technical Execution

### 1. Face-Match Intelligence & Privacy Risk Scanner
*   **Webcam and Drag & Drop Uploads:** Fully supports interactive user media capture with strict canvas dimension preservation.
*   **Gemini Vision Integration:** Extracts facial patterns and processes them server-side to simulate a comprehensive search across typical platform endpoints (Instagram, Telegram, darknet forums, unauthorized image directories).
*   **Instant Threat Matrix:** Categorizes matches by platform, confidence, severity (*Critical*, *High*, *Medium*), and generates an actionable explanation.

### 2. Auto-Drafting Legal Redactions & Takedowns
*   **India DPDP Act 2023 Compliance:** Drafts strict requests referencing user consent revocation rights under India's newly-minted data privacy regulations.
*   **IT Act 2000 Integration:** References **Sections 66E** (violating privacy), **67** (publishing obscene material), and **67A** (transmitting sexually explicit content) where applicable.
*   **Cybercrime Portal Reporting Format:** Generates standard ready-to-copy report narratives matching the input specifications of the Indian National Cyber Crime Reporting Portal (`cybercrime.gov.in`).

### 3. Bulletproof Reliability Engine (Upstream Resilience)
*   **Exponential / Step-Based Retry:** If the Gemini API reports heavy demand (`UNAVAILABLE` or `503`), the backend tries up to 2 times with a 1-second delay.
*   **Cross-Model Fallback:** If the high-tier model remains unavailable, the proxy seamlessly cascades queries down to `gemini-3.1-flash-lite` before reporting degradation. The client never crashes.

### 4. Subscription & Access Tiers
*   **Free tier:** Permits basic risk scanning and simple reports.
*   **Guardian Tier:** Unlocks immediate full-length automated legal takedown templates and high-severity platform removals.
*   **Institutional Tier:** High-frequency batched scan endpoints for public figures or brand defense.

---

## 🛠️ Technology Stack & Libraries

*   **Frontend Library:** React 19 (Functional Components, custom Hooks, `useState`, and `useEffect` optimization).
*   **Styling Engine:** Tailwind CSS v4 (Highly cohesive, off-black space slate theme paired with warning amber accents).
*   **Animations:** `motion` (by motion/react) facilitating responsive page changes, scan indicators, and alert entrances.
*   **Core Backend:** Node.js, Express, `tsx` (for direct TypeScript runtime execution during development).
*   **Production Bundler:** `esbuild` compiling the entire backend to single-file CJS (`dist/server.cjs`) to skip ES Modules runtime path checks and boost cold-start efficiency on cloud environments.

---

## 📁 Repository Structure

```text
├── server.ts                 # Full-stack Express Entry Point & Gemini Proxy
├── package.json              # Script configurations and active dependencies
├── tsconfig.json             # TypeScript Compiler Rules
├── metadata.json             # AI Studio Application Configuration
├── src/
│   ├── main.tsx              # React client bootstrapping
│   ├── App.tsx               # Primary Client routing, UI tabs, and Core state
│   ├── types.ts              # Strongly-typed Interfaces (ThreatMatch, ScanResult, AppStatus)
│   ├── index.css             # Tailwind v4 import & Global custom theme tokens
│   └── components/
│       ├── Header.tsx        # Responsive navigation and account management bar
│       └── Scanner.tsx       # Drag-and-drop & Webcam scan UI container
```

---

## ⚡ Setup & Local Development

To run **REDACT** locally:

### 1. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/varun16-dev/Redact.git
cd Redact
npm install
```

### 2. Configure Environment Variables
Create a `.env` file (referencing `.env.example`) in your root directory:
```env
# Server secret (Crucial: Keep hidden!)
GEMINI_API_KEY=your_actual_google_gemini_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
*The dev server automatically boots on **http://localhost:3000**.*

### 4. Build for Production
This compiles the React assets into static files and bundles the Express backend using `esbuild` for ultra-fast startup:
```bash
npm run build
npm start
```

---

## 🛡️ Privacy & Compliance Statement
REDACT does not store scanned photos or personal identification details permanently on our servers. Processing is done in-memory, and payload exchanges are strictly client-to-server TLS encrypted.

---

*This project is built to demonstrate premium software craftsmanship, visual design coherence, and high resilience engineering when implementing AI services in modern web applications.*
