
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Standardize across VITE_ prefixes and system-provided keys
    'process.env.SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''),
    'process.env.PAYSTACK_PUBLIC_KEY': JSON.stringify(process.env.VITE_PAYSTACK_PUBLIC_KEY || ''),
    'process.env.MAKE_WEBHOOK_URL': JSON.stringify(process.env.VITE_MAKE_WEBHOOK_URL || ''),
    'process.env.GITHUB_REPO': JSON.stringify(process.env.VITE_GITHUB_REPO || process.env.GITHUB_REPO || '')
  },
  server: {
    port: 3000
  }
});
