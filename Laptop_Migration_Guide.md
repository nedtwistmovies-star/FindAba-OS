
# FindAba Laptop Migration Guide 🐘

Congratulations on taking **FindAba** to the next level. This guide outlines the standard engineering process to move this project from the AI environment to your local laptop.

## 🛠 Prerequisites

Before starting, install the following:
1.  **Node.js (LTS Version):** [https://nodejs.org/](https://nodejs.org/)
2.  **VS Code:** [https://code.visualstudio.com/](https://code.visualstudio.com/)
3.  **Supabase Account:** [https://supabase.com/](https://supabase.com/)

---

## 🏗 Project Setup (Step-by-Step)

### 1. Initialize Folder
Create a folder named `FindAba` and open it in VS Code.

### 2. Copy the Files
Recreate the folder structure and copy the code from each file in this chat:
```text
FindAba/
├── components/   # Logo.tsx, Layout.tsx, etc.
├── services/     # supabaseService.ts, geminiService.ts, etc.
├── views/        # Home.tsx, Explore.tsx, Admin.tsx, etc.
├── hooks/        # constants.ts
├── App.tsx
├── types.ts
├── index.tsx
├── index.html
├── package.json
└── tailwind.config.js
```

### 3. Install Libraries
Open your terminal in VS Code and run:
```bash
npm install
```

### 4. Setup Environment Variables
Create a file named `.env` in your root folder:
```env
VITE_GEMINI_API_KEY=your_google_ai_key
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_PAYSTACK_PUBLIC_KEY=your_pk_live_key
```

### 5. Initialize Supabase Backend
1.  Go to your Supabase Dashboard.
2.  Open the **SQL Editor**.
3.  Copy and run the contents of `views/migrations/full_registry_commit.sql` (found in this project).
4.  Go to **Storage**, create a public bucket named `Find_ABA`.

---

## 🚀 Running the App

To start the development server:
```bash
npm run dev
```
Visit `http://localhost:5173` in your browser.

---

## 📈 Implications & Next Steps

1.  **Direct Database Access:** You can now see real users, artisans, and payments in your Supabase dashboard.
2.  **Asset Ownership:** Replace stock images with real high-resolution photos and videos of Aba artisans.
3.  **Paystack Payouts:** Real transactions will now flow to your merchant dashboard.
4.  **Deployment:** Use **Vercel** (`npm install -g vercel && vercel`) to put your app online for free with a single command.

*Engineered for Excellence. Prepared by SANDALSroyalle.*
