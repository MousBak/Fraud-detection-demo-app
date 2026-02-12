// ─────────────────────────────────────────────────────────────
// Configuration Vite — FiFAR Détection de Fraude
// ─────────────────────────────────────────────────────────────
// Vite est le bundler utilisé pour compiler et servir le
// frontend React/TypeScript. Cette configuration active le
// plugin React (HMR, JSX) et définit un alias "@" vers
// le dossier source pour simplifier les imports.

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Calcul du répertoire courant (compatible avec ESModules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  // Plugin React : active le Fast Refresh (HMR) et la compilation JSX
  plugins: [react()],

  // Résolution des chemins : "@" pointe vers le dossier "src/"
  // Exemple : import X from "@/components/X" → src/components/X
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
