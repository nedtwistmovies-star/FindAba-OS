# FindAba by SANDALSroyalle 🐘
**The Official Industrial Operating System of Enyimba City**

FindAba by **SANDALSroyalle** is the industrial-grade city platform built for Enyimba City (Aba, Nigeria), connecting master artisans to the global digital economy. It unifies AI-powered discovery, creative production, secure trade, and smart logistics into one modern operating system for “the world’s workshop.”

---

## 🚀 Core Industrial Protocols

### 1. The Oracle (FindAba AI)
- **Intelligence Engine**: Powered by Google Gemini 3 Pro (Reasoning) & Gemini 3 Flash (Logic).
- **Capabilities**: Real-time market intelligence, leather price indexing via Google Search grounding, and multi-lingual trade wisdom (Igbo, Pidgin, English).
- **Access**: Floating Pulse Unit (Round Oracle vessel).

### 2. Carry-Go Logistics
- **Function**: A secure hub-to-hub waybill generation and tracking protocol.
- **Backbone**: Moves high-value cargo across Enyimba’s primary industrial hubs (Ariaria, Powerline, Ogbete) with verified rider authentication.

### 3. Creative Lab (Visual Synthesis)
- **Engine**: Utilizing Veo 3.1 & Gemini 3 Pro Image.
- **Protocols**: AI-powered prototyping for industrial designs and cinematic "Process Films" that document workshop mastery for global procurement.

### 4. Fidelity Mesh (Settlement)
- **Partner**: Paystack Settlement Gateway.
- **Security**: Escrow-protected industrial orders, automated 60/40 revenue splits, and the **SrTS Global Thrift** savings protocol.

### 5. Heritage Archive (Oral History)
- **Engine**: Gemini 2.5 Flash TTS.
- **Function**: Preserving the industrial philosophy of Enyimba through high-fidelity narrations of city history in multiple native and global dialects.

---

## 🛠️ Industrial Tech Stack

- **Frontend**: React 18 (TypeScript) + Vite 5 + Tailwind CSS 3.4.
- **Intelligence**: Google Gemini API (@google/genai) with 16k Thinking Budget.
- **Registry**: Supabase Real-time Database + Edge Functions + Cloud Storage.
- **Infrastructure**: Vercel Edge Network (PWA Protocol enabled).
- **Spatial**: Leaflet.js + OpenStreetMap (Enyimba Spatial Mesh).

---

## 📁 System Architecture (Repository Map)

```text
FindAba/
├── components/          # Reusable UI Units (Oracle, Paystack Overlays, Layout)
├── services/            # Signal Handlers (AI Logic, Database Auth, Settlement)
├── views/               # System Interfaces (Home, Discover, Admin, Merchant Portal)
├── types.ts             # Registry Schema Definitions (v19.0)
├── constants.ts         # Brand Identity & Default Industrial Data
└── sw.js                # Offline Service Worker (PWA Protocol)
```

---

## ⚙️ Engineering & Deployment Protocol

### 1. Registry Handshake (Supabase)
Run the following SQL migration (found in `views/migrations/full_registry_commit.sql`) in your Supabase SQL editor to initialize the table mesh.

### 2. Signal Environment Variables
In your Vercel Dashboard or `.env` file, inject the following signals:
```env
API_KEY=your_google_ai_key
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
PAYSTACK_SECRET_KEY=your_settlement_key
```

### 3. Global Launch (Direct to Vercel)
This project is pre-configured for the Vercel Edge Network. Simply connect your GitHub repository to Vercel and it will initialize automatically.

---

## 📄 Intellectual Property & License

The software components of FindAba are licensed under the **MIT License**. The "FindAba" trademark and **SANDALSroyalle** brand architecture remain the exclusive intellectual property of **SANDALSroyalle**.

*Built for the Masters. Powered by SANDALSroyalle.*