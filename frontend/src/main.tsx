// ─────────────────────────────────────────────────────────────
// Point d'entrée de l'application React — FiFAR
// ─────────────────────────────────────────────────────────────
// Ce fichier initialise l'application React et l'injecte
// dans l'élément HTML #root défini dans index.html.
// Le mode StrictMode est activé pour aider à détecter
// les problèmes potentiels pendant le développement.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css'; // Feuille de styles globale

// Création et rendu de l'arbre React dans le DOM
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
