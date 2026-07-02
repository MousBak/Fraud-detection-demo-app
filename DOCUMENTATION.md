# 📖 Documentation Technique Complète — FiFAR Fraud Detection

> Ce document est la **documentation technique détaillée** du projet.
> Pour une introduction accessible à tous, consultez le fichier [README.md](./README.md).

---

## Table des matières

1. [Vue d'ensemble du système](#1-vue-densemble-du-système)
2. [Architecture technique](#2-architecture-technique)
3. [Le Frontend en détail](#3-le-frontend-en-détail)
4. [Le Backend en détail](#4-le-backend-en-détail)
5. [Les données et le dataset](#5-les-données-et-le-dataset)
6. [Les modèles de Machine Learning](#6-les-modèles-de-machine-learning)
7. [Le système Learning to Defer](#7-le-système-learning-to-defer)
8. [L'analyse d'équité (Fairness)](#8-lanalyse-déquité-fairness)
9. [Guide d'installation détaillé](#9-guide-dinstallation-détaillé)
10. [Guide de développement](#10-guide-de-développement)
11. [Déploiement avec Docker](#11-déploiement-avec-docker)
12. [API Reference](#12-api-reference)
13. [Glossaire complet](#13-glossaire-complet)

---

## 1. Vue d'ensemble du système

### 1.1 Qu'est-ce que ce projet ?

FiFAR Fraud Detection est une **application web de démonstration** qui simule un système intelligent de détection de fraude bancaire. Il combine :

- **L'Intelligence Artificielle** (modèles de Machine Learning) pour analyser automatiquement les transactions
- **L'expertise humaine** (50 experts simulés) pour les cas où l'IA n'est pas assez confiante
- **Le Learning to Defer** (L2D) : un mécanisme qui permet à l'IA de "savoir quand elle ne sait pas" et de passer le relais à un humain

### 1.2 Comment fonctionne le système ?

Le flux de traitement d'une transaction se déroule en 5 étapes :

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   ÉTAPE 1    │     │   ÉTAPE 2    │     │   ÉTAPE 3    │     │   ÉTAPE 4    │     │   ÉTAPE 5    │
│              │     │              │     │              │     │              │     │              │
│  Transaction │────▶│  Extraction  │────▶│  Scoring IA  │────▶│  Décision    │────▶│  Résultat    │
│  reçue       │     │  des features│     │  (3 modèles) │     │  L2D         │     │  final       │
│              │     │              │     │              │     │              │     │              │
│  Ex: 2500€   │     │  Montant,    │     │  Score: 0.72 │     │  IA seule ?  │     │  ✅ Approuvé  │
│  Amazon      │     │  pays, heure │     │  Risque:     │     │  ou expert ? │     │  🚫 Bloqué   │
│  France      │     │  canal, etc. │     │  élevé       │     │              │     │  👤 En revue  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Étape 1** — Une transaction bancaire arrive (ex : "2 500€ chez Amazon depuis la France")

**Étape 2** — Le système extrait les "features" (caractéristiques) : montant, commerçant, pays, heure, canal (en ligne, en magasin, au distributeur), historique du client, etc.

**Étape 3** — Trois modèles d'IA analysent ces features et donnent un score de risque entre 0 (sûr) et 1 (fraude certaine)

**Étape 4** — Le mécanisme L2D décide :
- Score < 0.3 → L'IA est confiante que c'est légitime → **auto-approuvé**
- Score > 0.7 → L'IA est confiante que c'est une fraude → **auto-bloqué**
- Score entre 0.3 et 0.7 → L'IA hésite → **déféré à un expert humain**

**Étape 5** — Le résultat final est rendu (approuvé, bloqué ou mis en revue par un expert)

### 1.3 Ce que le dashboard affiche

Le tableau de bord temps réel montre toutes ces informations visuellement :

| Section | Ce qu'on voit | Pourquoi c'est utile |
|---------|---------------|---------------------|
| **KPIs** | Nombre de transactions/sec, fraudes détectées, latence | Surveiller la santé du système en temps réel |
| **Table des transactions** | Liste triable de toutes les transactions | Voir le détail de chaque transaction |
| **Graphiques de distribution** | Histogrammes, nuages de points | Comprendre les patterns dans les données |
| **Performance des modèles** | Courbes de précision, matrices de confusion | Évaluer la qualité de chaque modèle d'IA |
| **Profils d'experts** | Précision, charge, disponibilité | Gérer l'équipe d'analystes |
| **Métriques d'équité** | FPR/FNR par groupe | Détecter et corriger les biais |

---

## 2. Architecture technique

### 2.1 Les deux parties de l'application

```
┌─────────────────────────────────────────────────────┐
│                     NAVIGATEUR                       │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │           FRONTEND (React)                   │    │
│  │                                             │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │    │
│  │  │ Sidebar  │ │Dashboard │ │Graphiques│    │    │
│  │  │(navigation)│(KPIs)    │ │(Recharts)│    │    │
│  │  └──────────┘ └──────────┘ └──────────┘    │    │
│  │                                             │    │
│  │  Port : 5173                                │    │
│  └──────────────────┬──────────────────────────┘    │
│                     │ Requêtes HTTP (API)            │
│                     ▼                                │
│  ┌──────────────────────────────────────────────┐   │
│  │           BACKEND (FastAPI)                   │   │
│  │                                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐     │   │
│  │  │Modèles ML│ │ Experts  │ │   L2D    │     │   │
│  │  │(sklearn) │ │(simulés) │ │(décision)│     │   │
│  │  └──────────┘ └──────────┘ └──────────┘     │   │
│  │                                              │   │
│  │  Port : 8000                                 │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 2.2 Arbre des fichiers complet

```
fraud-detection-demo-app/
│
├── README.md                           # Documentation générale (accessible à tous)
├── DOCUMENTATION.md                    # Ce fichier (documentation technique détaillée)
├── .env                                # Variables d'environnement (ports, adresses)
├── Dockerfile                          # Recette pour créer l'image Docker
├── docker-compose.yml                  # Orchestration des services Docker
│
├── frontend/                           # ══ INTERFACE UTILISATEUR ══
│   ├── index.html                      # Page HTML de base (le "squelette")
│   ├── package.json                    # Liste des librairies JavaScript
│   ├── tsconfig.json                   # Configuration du langage TypeScript
│   ├── vite.config.ts                  # Configuration du serveur de développement
│   │
│   └── src/                            # Code source du frontend
│       ├── main.tsx                    # Point d'entrée — démarre l'application
│       ├── App.tsx                     # Composant racine — gère la navigation
│       ├── index.css                   # Styles visuels (thème sombre, couleurs, etc.)
│       ├── vite-env.d.ts              # Typage pour l'environnement Vite
│       │
│       ├── components/                 # Les 10 écrans de l'application
│       │   ├── BarreLaterale.tsx       #   → Barre de navigation (menu à gauche)
│       │   ├── VueEnsemble.tsx         #   → Écran 1 : Vue d'ensemble (KPIs)
│       │   ├── TableTransactions.tsx   #   → Écran 2 : Table des transactions
│       │   ├── DataExplorer.tsx        #   → Écran 3 : Exploration des données
│       │   ├── ModelTraining.tsx       #   → Écran 4 : Entraînement des modèles
│       │   ├── PanneauModeles.tsx      #   → Écran 5 : Performance des modèles ML
│       │   ├── PanneauExperts.tsx      #   → Écran 6 : Profils des experts
│       │   ├── PanneauL2D.tsx          #   → Écran 7 : Simulation Learning to Defer
│       │   ├── PanneauPipeline.tsx     #   → Écran 8 : Infrastructure et pipeline
│       │   ├── PanneauAlertes.tsx      #   → Écran 9 : Alertes et notifications
│       │   └── PanneauEquite.tsx       #   → Écran 10 : Analyse d'équité
│       │
│       ├── hooks/                      # Logique réutilisable
│       │   └── useDashboard.ts         #   → Gestion de l'état global + simulation temps réel
│       │
│       ├── types/                      # Définitions des types de données
│       │   └── index.ts               #   → Tous les types TypeScript du projet
│       │
│       └── data/                       # Données simulées
│           └── mockData.ts            #   → Générateur de transactions et métriques réalistes
│
└── backend/                            # ══ SERVEUR API ══
    ├── requirements.txt               # Liste des librairies Python nécessaires
    ├── README.md                      # Documentation spécifique au backend
    │
    ├── app/                           # Code source du backend
    │   ├── __init__.py                # Marqueur de module Python
    │   ├── main.py                    # Point d'entrée — crée le serveur FastAPI
    │   ├── config.py                  # Configuration (ports, chemins, seuils)
    │   │
    │   ├── models/                    # Intelligence Artificielle
    │   │   ├── ml_models.py           #   → Les 3 modèles (LR, RF, XGBoost)
    │   │   ├── expert_ensemble.py     #   → Simulation des 50 experts
    │   │   ├── l2d_system.py          #   → Logique du Learning to Defer
    │   │   └── trainer.py             #   → Orchestration de l'entraînement
    │   │
    │   ├── routes/                    # Points d'entrée de l'API
    │   │   ├── data.py                #   → Statistiques sur les données
    │   │   ├── predictions.py         #   → Prédictions de fraude
    │   │   ├── models.py              #   → Entraînement des modèles
    │   │   ├── experts.py             #   → Gestion des experts
    │   │   ├── l2d.py                 #   → Simulation L2D
    │   │   └── analytics.py           #   → Analyses et métriques
    │   │
    │   ├── services/                  # Logique métier
    │   │   ├── data_loader.py         #   → Chargement du dataset FiFAR
    │   │   ├── preprocessor.py        #   → Nettoyage des données
    │   │   ├── feature_engineering.py #   → Création de nouvelles features
    │   │   ├── metrics_calculator.py  #   → Calcul des métriques de performance
    │   │   └── fairness_analyzer.py   #   → Analyse d'équité et biais
    │   │
    │   ├── database/                  # Stockage des données
    │   │   ├── db.py                  #   → Connexion à la base de données
    │   │   └── models.py             #   → Structure des tables
    │   │
    │   └── utils/                     # Outils divers
    │       └── helpers.py             #   → Fonctions utilitaires
    │
    ├── data/                          # Données
    │   ├── raw/                       #   → Données brutes (le dataset original)
    │   ├── processed/                 #   → Données nettoyées et prétraitées
    │   └── models/                    #   → Modèles d'IA sauvegardés
    │
    ├── tests/                         # Tests automatisés
    │   └── test_api.py                #   → Tests des endpoints API
    │
    └── notebooks/                     # Notebooks Jupyter (analyses exploratoires)
```

---

## 3. Le Frontend en détail

### 3.1 Comment le frontend est organisé

Le frontend suit le modèle **"composants"** de React : chaque partie de l'interface est un composant indépendant et réutilisable.

```
App.tsx ← Le chef d'orchestre
  │
  ├── BarreLaterale.tsx ← Menu de navigation (toujours visible à gauche)
  │
  └── [Contenu principal] ← Change selon l'onglet sélectionné :
      ├── VueEnsemble.tsx         (si onglet = "overview")
      ├── TableTransactions.tsx   (si onglet = "transactions")
      ├── DataExplorer.tsx        (si onglet = "data-explorer")
      ├── ModelTraining.tsx       (si onglet = "training")
      ├── PanneauModeles.tsx      (si onglet = "models")
      ├── PanneauExperts.tsx      (si onglet = "experts")
      ├── PanneauL2D.tsx          (si onglet = "l2d")
      ├── PanneauPipeline.tsx     (si onglet = "pipeline")
      ├── PanneauAlertes.tsx      (si onglet = "alerts")
      └── PanneauEquite.tsx       (si onglet = "fairness")
```

### 3.2 Le hook useDashboard — Le cerveau du frontend

Le fichier `useDashboard.ts` est le **cœur logique** du frontend. Il :

1. **Initialise** les données (transactions, experts, modèles, alertes, etc.)
2. **Simule** le temps réel : toutes les 2 secondes, il génère de nouvelles transactions
3. **Calcule** les statistiques (taux de fraude, latence, utilisation des experts)
4. **Gère** l'état de l'interface (quel onglet est actif, quel mode est sélectionné)

### 3.3 Les données simulées — mockData.ts

Le fichier `mockData.ts` génère des données **réalistes** basées sur les caractéristiques du dataset FiFAR :

- **Transactions** : montant (1€ à 15 000€), commerçant, pays, canal, score ML, statut
- **50 experts** : nom, spécialité, précision (65%–95%), charge de travail, biais
- **6 modèles ML** : XGBoost, LightGBM, Random Forest, Neural Network, Isolation Forest, Ensemble
- **Topics Kafka** : simulation de l'infrastructure de streaming
- **Alertes** : fraudes détectées, dérive de modèle, problèmes de capacité
- **Métriques d'équité** : par tranche d'âge, type d'emploi, source de revenu

### 3.4 Les librairies frontend

| Librairie | Version | Rôle |
|-----------|---------|------|
| `react` | 18.2 | Construire l'interface utilisateur |
| `react-dom` | 18.2 | Rendre React dans le navigateur |
| `recharts` | 2.12 | Dessiner les graphiques (courbes, barres, camemberts, radars) |
| `lucide-react` | 0.344 | Afficher les icônes (flèches, engrenages, cloches, etc.) |
| `typescript` | 5.3 | Ajouter le typage statique au JavaScript |
| `vite` | 5.4 | Serveur de développement ultra-rapide |

---

## 4. Le Backend en détail

### 4.1 Les endpoints API

Le backend expose **6 groupes d'endpoints** (points d'entrée) :

| Groupe | Préfixe | Rôle |
|--------|---------|------|
| **Données** | `/api/v1/data/` | Charger le dataset, obtenir des statistiques |
| **Prédictions** | `/api/v1/predictions/` | Faire des prédictions de fraude sur une transaction |
| **Modèles** | `/api/v1/models/` | Entraîner les modèles, obtenir leurs performances |
| **Experts** | `/api/v1/experts/` | Lister les experts, voir leur profil |
| **L2D** | `/api/v1/l2d/` | Simuler des décisions Learning to Defer |
| **Analytics** | `/api/v1/analytics/` | Obtenir des analyses avancées (équité, métriques) |

### 4.2 Les librairies backend

| Librairie | Version | Rôle |
|-----------|---------|------|
| `fastapi` | 0.109 | Framework web pour créer l'API |
| `uvicorn` | 0.27 | Serveur ASGI pour faire tourner FastAPI |
| `scikit-learn` | 1.4 | Modèles ML (Régression Logistique, Random Forest) |
| `xgboost` | 2.0 | Modèle de gradient boosting |
| `pandas` | 2.2 | Manipulation de données tabulaires |
| `numpy` | 1.26 | Calcul numérique |
| `sqlalchemy` | 2.0 | ORM pour la base de données |
| `pydantic` | 2.6 | Validation des données d'entrée/sortie |

---

## 5. Les données et le dataset

### 5.1 Le dataset BAF (Bank Account Fraud) / FiFAR

L'application utilise désormais le **jeu de données réel FiFAR (Financial Fraud Alert Review)** de Feedzai. Ce jeu de données comprend 30 622 cas d'alertes de fraude à l'ouverture de comptes bancaires avec :

**Features financières & personnelles :**
- `income` : revenu annuel du client (valeurs catégorielles normalisées)
- `credit_risk_score` : score de risque de crédit
- `customer_age` : tranche d'âge du demandeur (ex: 20s, 30s)
- `employment_status` : statut professionnel (ex: CA, CB...)

**Features comportementales et de transaction :**
- `keep_alive_session` : comportement de la session (booléen)
- `velocity_24h` / `velocity_6h` : nombre de transactions dans les dernières 24h / 6h
- `device_fraud_count` : historique de fraude associé à l'appareil

**Features temporelles :**
- `month` : mois de la transaction (de 0 à 7, utilisé pour la scission temporelle)

**Prédictions réelles des experts :**
- `standard#0` à `standard#49` : la décision réelle de chacun des 50 experts simulés avec des profils d'expertise réalistes (0 = légitime, 1 = fraude)

### 5.2 Propriétés du dataset réel

1. **Déséquilibre réel** : le dataset d'alertes contient un taux de fraude d'environ **12.1%**.
2. **Scission temporelle (Temporal Split)** : scindé rigoureusement en mois d'apprentissage (`month <= 5`, ~20 765 cas) et de test (`month > 5`, ~9 857 cas) pour éviter la fuite de données temporelle.
3. **Experts réels** : chaque expert possède des profils d'erreur, des zones de spécialité (par montant, par canal) et une charge de travail réaliste issus de l'étude FiFAR de Feedzai.

---

## 6. Les modèles de Machine Learning

### 6.1 Comment fonctionne l'entraînement réel

L'entraînement d'un modèle suit ces étapes :

```
Données FiFAR réelles
       │
       ▼
Division temporelle :
- Apprentissage : mois <= 5 (~20 765 lignes)
- Test/Évaluation : mois > 5 (~9 857 lignes)
       │
       ▼
Prétraitement :
- Encodage des colonnes catégorielles
- StandardScaler sur les variables continues (pour Régression Logistique)
- Calcul de scale_pos_weight pour XGBoost (gestion du déséquilibre de classe ~1:8)
       │
       ▼
Entraînement des modèles sur les mois d'apprentissage
       │
       ▼
Évaluation sur le test set (mois > 5)
       │
       ▼
Envoi des métriques réelles (accuracy, precision, recall, AUC-ROC, AUC-PR) au Dashboard
```

### 6.2 Comprendre les métriques

Imaginons que sur 1 000 transactions, il y a 50 fraudes et 950 légitimes :

| | Le modèle dit "fraude" | Le modèle dit "légitime" |
|---|---|---|
| **C'est vraiment une fraude** | ✅ Vrai Positif (VP) : 40 | ❌ Faux Négatif (FN) : 10 |
| **C'est légitime** | ❌ Faux Positif (FP) : 20 | ✅ Vrai Négatif (VN) : 930 |

À partir de ce tableau :

- **Exactitude** = (VP + VN) / Total = (40 + 930) / 1000 = **97%**
- **Précision** = VP / (VP + FP) = 40 / (40 + 20) = **66.7%** → "Quand je dis fraude, j'ai raison 2 fois sur 3"
- **Rappel** = VP / (VP + FN) = 40 / (40 + 10) = **80%** → "Je détecte 80% des vraies fraudes"
- **F1-Score** = Moyenne harmonique de Précision et Rappel = **72.7%**

> 💡 **En détection de fraude, le rappel est plus important que la précision** : il vaut mieux bloquer quelques transactions légitimes par erreur que laisser passer des fraudes.

---

## 7. Le système Learning to Defer

### 7.1 Principe

Le L2D est le **cœur innovant** du projet. Au lieu de forcer l'IA à tout décider, on lui permet de déléguer la décision :

```
Score de confiance de l'IA :

0%              Seuil Bas (ex: 30%)      Seuil Haut (ex: 70%)      100%
|───────────────────────|─────────────────────────|───────────────────|
     ✅ Auto-Approuvé            👤 Zone de Déférence        🚫 Auto-Bloqué
    (légitime sans expert)       → Expert humain           (fraude sans expert)
```

### 7.2 Évaluation par Coût et Décision

En plus de la performance pure (Rappel), le système est évalué selon un **Coût Total Réel de Fraude** :
- **Coût d'un faux positif (FP)** = 100 $ (coût opérationnel ou friction client)
- **Coût d'un faux négatif (FN)** = 5 000 $ (perte financière directe due à la fraude)

Dans la stratégie de déférence par coût (`cost_sensitive`), le coût attendu de la décision du modèle ML est modélisé :
- Si le modèle ML prédit une fraude : `Coût attendu = (1 - Score ML) * 100` (risque de faux positif)
- Si le modèle ML prédit légitime : `Coût attendu = Score ML * 5 000` (risque de faux négatif)

Si ce coût attendu dépasse le coût moyen d'intervention humaine ou si l'incertitude est trop grande, la décision est déléguée à l'expert humain.

### 7.3 Les stratégies de déférence implémentées
- **Confidence** (Confiance de l'IA) : Délègue lorsque le score se trouve dans la zone d'incertitude entre le seuil bas et haut.
- **Consensus** (Désaccord) : Délègue lorsque le niveau de désaccord entre les experts ou avec l'IA dépasse un seuil.
- **Cost Sensitive** : Optimise le coût total en comparant le coût d'erreur attendu du modèle ML avec le coût d'examen humain.
- **Random** (Aléatoire) : Sert de baseline en déléguant de manière purement aléatoire selon la capacité disponible.

---

## 8. L'analyse d'équité (Fairness)

### 8.1 Pourquoi c'est crucial

Un système d'IA peut involontairement discriminer certains groupes de population. Par exemple :
- Bloquer plus de transactions pour les jeunes
- Déléguer ou rejeter de manière disproportionnée les demandes selon le statut d'emploi

### 8.2 Les métriques surveillées sur le jeu de test

| Métrique | Formule simplifiée | Objectif |
|----------|-------------------|----------|
| **Parité démographique** | Taux d'auto-approbation du groupe A ≈ Taux du groupe B | Le système prend des décisions automatiques de manière équitable |
| **Odds équalisés** | FPR du groupe A ≈ FPR du groupe B et TPR du groupe A ≈ TPR du groupe B | La précision et le taux d'erreur sont homogènes entre les groupes |
| **Taux de déférence** | Taux de délégation du groupe A ≈ Taux du groupe B | Les experts sont sollicités de manière juste sans sur-sélectionner un groupe |

### 8.3 Les groupes analysés réels
- **Tranches d'âge** (`customer_age` binné par décennie : `20s`, `30s`, `40s`, etc.)
- **Statut d'emploi** (`employment_status` contenant les catégories réelles codées du dataset)

---

## 9. Guide d'installation et déploiement détaillé

### 9.1 Déploiement automatisé avec Docker (Recommandé)

Le projet intègre un conteneur backend configuré pour installer toutes les dépendances machine learning, y compris `pyarrow` pour le support des fichiers Parquet, et télécharger automatiquement le dataset FiFAR réel si celui-ci est manquant.

```bash
# Lancer les services (backend FastAPI + frontend React)
docker-compose up --build
```
Le frontend est accessible sur **http://localhost:5173** et le backend sur **http://localhost:8000**.

### 9.2 Installation manuelle locale

#### Prérequis
* **Node.js** (v18+)
* **Python** (v3.10+)
* **Dataset FiFAR** : Télécharger l'archive depuis [Figshare](https://figshare.com/articles/dataset/Financial_Fraud_Alert_Review_Dataset/28351172) (ID `28351172`). Décompresser le fichier ZIP pour copier les fichiers :
  - `backend/data/raw/alert_data/processed_data/alerts.parquet`
  - `backend/data/raw/synthetic_experts/expert_predictions.parquet`

#### Installation et lancement du Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### Installation et lancement du Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 10. Guide de développement

### 10.1 Structure du code frontend

Chaque composant React suit cette structure :

```typescript
// 1. Commentaire d'en-tête (description du fichier)
// 2. Imports
// 3. Interfaces (types des données)
// 4. Constantes
// 5. Composant principal (export default function NomDuComposant)
//    a. États locaux (useState)
//    b. Calculs dérivés (useMemo)
//    c. Fonctions d'action
//    d. Rendu JSX (ce qui s'affiche)
```

### 10.2 Conventions de nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Composants | PascalCase | `VueEnsemble`, `DataExplorer` |
| Fichiers composants | PascalCase.tsx | `PanneauModeles.tsx` |
| Hooks | camelCase avec "use" | `useDashboard` |
| Variables | camelCase en français | `estEnDirect`, `montantMoyen` |
| Types | PascalCase | `Transaction`, `FraudExpert` |
| CSS classes | kebab-case | `chart-card`, `kpi-value` |

### 10.3 Ajouter un nouveau composant

1. Créer le fichier dans `frontend/src/components/NouveauComposant.tsx`
2. Si nécessaire, ajouter un nouveau type d'onglet dans `types/index.ts` (TabType)
3. Ajouter le import et le case dans `App.tsx`
4. Ajouter l'entrée de navigation dans `BarreLaterale.tsx`

---

## 11. Déploiement avec Docker

### 11.1 Build et lancement

```bash
# Construire l'image et lancer les conteneurs
docker-compose up --build

# En arrière-plan
docker-compose up -d --build

# Arrêter
docker-compose down
```

### 11.2 Ce que fait le Dockerfile

```
Étape 1 : Compile le frontend React en fichiers statiques
Étape 2 : Prépare le backend Python
Étape 3 : Copie le frontend compilé dans le backend
→ Résultat : une seule image qui sert le backend ET le frontend
```

---

## 12. API Reference

### 12.1 Santé du service

```
GET /health
→ { "status": "healthy", "service": "FiFAR Fraud Detection System", "version": "1.0.0" }
```

### 12.2 Statistiques des données

```
GET /api/v1/data/stats
→ { "total_transactions": 1000000, "fraud_rate": 0.048, "features": 32, ... }
```

### 12.3 Entraînement des modèles

```
POST /api/v1/models/train
Body: { "model_types": ["logistic_regression", "random_forest", "xgboost"], "test_size": 0.2 }
→ { "results": [{ "model": "xgboost", "accuracy": 0.97, "auc": 0.99, ... }] }
```

### 12.4 Prédiction

```
POST /api/v1/predictions/predict
Body: { "amount": 2500, "merchant": "Amazon", "country": "France", "channel": "online", ... }
→ { "fraud_probability": 0.23, "risk_level": "low", "decision": "auto_approve" }
```

### 12.5 Simulation L2D

```
POST /api/v1/l2d/simulate
Body: { "transaction_id": "TXN-001", "strategy": "confidence" }
→ { "decision": "defer_to_expert", "expert_id": "EXP-003", "reason": "Score dans la zone d'incertitude" }
```

---

## 13. Glossaire complet

### Termes généraux

| Terme | Explication |
|-------|-------------|
| **Application web** | Un programme qui s'exécute dans un navigateur internet (Chrome, Firefox, etc.) |
| **Frontend** | La partie visible : ce que l'utilisateur voit et avec quoi il interagit |
| **Backend** | La partie cachée : le serveur qui fait les calculs et stocke les données |
| **API** | "Application Programming Interface" — un moyen pour deux programmes de communiquer entre eux |
| **Base de données** | Un système de stockage organisé pour les données (comme un classeur géant) |
| **Endpoint** | Un "guichet" spécifique de l'API (ex: `/api/v1/data/stats` = le guichet "statistiques") |

### Termes d'Intelligence Artificielle

| Terme | Explication |
|-------|-------------|
| **Intelligence Artificielle (IA)** | Un programme informatique qui peut "apprendre" et prendre des décisions |
| **Machine Learning (ML)** | Une branche de l'IA où l'ordinateur apprend à partir d'exemples passés |
| **Modèle** | Le résultat de l'apprentissage : un "cerveau artificiel" capable de faire des prédictions |
| **Entraînement** | Le processus par lequel le modèle apprend à partir des données |
| **Feature** | Une caractéristique des données (ex: montant, pays, heure de la transaction) |
| **Dataset** | Un ensemble de données utilisé pour entraîner et tester le modèle |
| **Classification** | Ranger les éléments dans des catégories (ici : "fraude" ou "légitime") |
| **Score de prédiction** | Un nombre entre 0 et 1 qui indique la probabilité de fraude |

### Termes de détection de fraude

| Terme | Explication |
|-------|-------------|
| **Fraude** | Une transaction non autorisée : quelqu'un utilise une carte bancaire qui n'est pas la sienne |
| **Transaction** | Un paiement ou virement bancaire |
| **Faux positif** | Le système croit que c'est une fraude, mais c'est en fait légitime → le client est bloqué à tort |
| **Faux négatif** | Le système croit que c'est légitime, mais c'est une fraude → le client perd de l'argent |
| **Précision (Precision)** | Quand le système dit "fraude", à quel pourcentage il a raison |
| **Rappel (Recall)** | Sur toutes les vraies fraudes, quel pourcentage le système détecte |
| **Learning to Defer (L2D)** | L'IA qui apprend à passer le relais à un humain quand elle n'est pas sûre |
| **Déférence** | Le fait de confier une décision à un expert humain plutôt qu'à l'IA |
| **Seuil de confiance** | Le score minimum pour que l'IA prenne la décision seule |

### Termes d'équité (Fairness)

| Terme | Explication |
|-------|-------------|
| **Biais** | Quand le système traite injustement certains groupes de personnes |
| **Attribut protégé** | Une caractéristique qui ne devrait pas influencer la décision (âge, genre, origine, etc.) |
| **Parité démographique** | Tout le monde devrait avoir le même taux d'approbation, quel que soit son groupe |
| **Odds équalisés** | Le taux d'erreur devrait être le même pour tous les groupes |
| **Disparité** | La différence de traitement entre deux groupes (0 = pas de différence) |

### Termes d'infrastructure

| Terme | Explication |
|-------|-------------|
| **Kafka** | Un outil qui transporte les données en temps réel (comme un tapis roulant dans une usine) |
| **Pipeline** | La série d'étapes que suivent les données (réception → analyse → décision) |
| **Latence** | Le temps que met le système pour répondre (mesuré en millisecondes) |
| **P99** | La latence dans le pire des cas (99% des requêtes sont plus rapides que cette valeur) |
| **Docker** | Un outil qui met l'application dans un "conteneur" pour qu'elle fonctionne partout |
| **Conteneur** | Une boîte virtuelle qui contient l'application et tout ce dont elle a besoin |
| **Drift (dérive)** | Quand les données changent au fil du temps et que le modèle devient moins précis |

---

> 📋 **Ce document a été mis à jour le 12 février 2026.**
> Pour toute question, consultez d'abord le [README.md](./README.md).
