# 🛡️ FiFAR — Système Intelligent de Détection de Fraude

> **Un tableau de bord qui montre en temps réel comment l'Intelligence Artificielle et des experts humains travaillent ensemble pour détecter les fraudes bancaires.**

---

## 🎯 En une phrase

Ce projet est une **application web de démonstration** qui simule un système de détection de fraude bancaire : on voit en direct les transactions arriver, l'IA les analyser, et quand elle n'est pas sûre, elle passe le relais à un expert humain.

---

## 📸 Ce que vous verrez à l'écran

Quand vous lancez l'application, vous accédez à un **tableau de bord interactif** (dark theme, design moderne) avec **10 écrans** accessibles via une barre de navigation à gauche :

| Écran | Ce qu'on y voit |
|-------|----------------|
| 🏠 **Vue d'ensemble** | Les chiffres clés en temps réel : combien de transactions par seconde, combien de fraudes détectées, la vitesse du système, etc. |
| 💳 **Transactions** | La liste de toutes les transactions bancaires qui arrivent, avec le montant, le commerçant, le pays, et le score de risque donné par l'IA |
| 🔍 **Exploration** | Des graphiques interactifs pour explorer les données : comment les fraudes se répartissent par montant, par canal de paiement, etc. |
| ⚙️ **Entraînement** | Une interface pour "entraîner" les modèles d'IA — comme un professeur qui fait apprendre à l'IA à reconnaître les fraudes |
| 🤖 **Modèles ML** | La comparaison des performances de 6 modèles d'intelligence artificielle différents |
| 👥 **Experts** | Le profil de chacun des 50 experts humains : leur spécialité, leur précision, leur charge de travail |
| 🔀 **Learning to Defer** | Comment le système décide : "Est-ce que l'IA peut répondre seule, ou faut-il demander à un humain ?" |
| 📡 **Pipeline** | L'état de santé de l'infrastructure technique (les "tuyaux" par lesquels passent les données) |
| 🔔 **Alertes** | Les notifications importantes : pic de fraude, problème technique, IA qui perd en précision |
| ⚖️ **Équité** | Est-ce que le système traite tout le monde de la même façon ? Analyse des biais potentiels |

---

## 💡 Pourquoi ce projet est intéressant

### Le problème résolu
Dans le monde réel, les banques traitent **des milliers de transactions par seconde**. Parmi elles, environ **1 à 5% sont frauduleuses**. Le défi : détecter ces fraudes **instantanément** sans bloquer les transactions légitimes.

### La solution proposée
Ce projet montre une approche innovante appelée **"Learning to Defer"** (apprendre à déléguer) :

1. **L'IA analyse** chaque transaction et donne un score de risque (0% = sûr, 100% = fraude certaine)
2. **Si l'IA est confiante** (score très haut ou très bas) → elle décide seule ✅
3. **Si l'IA hésite** (score entre 30% et 70%) → elle **passe le relais à un expert humain** 👤
4. **L'expert humain** examine le cas et prend la décision finale

> 🧠 **L'idée clé** : l'IA n'a pas besoin d'être parfaite — elle doit juste savoir **quand elle ne sait pas** et demander de l'aide.

### Ce qui rend l'approche unique
- **50 experts simulés** avec des compétences différentes (certains sont meilleurs sur les fraudes en ligne, d'autres sur les fraudes internationales)
- **Analyse d'équité** : le système vérifie qu'il ne discrimine pas certains groupes de personnes
- **Données réalistes** basées sur le dataset FiFAR de Feedzai (leader mondial de la détection de fraude)

---

## 🔬 Le Dataset FiFAR — D'où viennent les données ?

L'application utilise désormais le **jeu de données RÉEL FiFAR / Bank Account Fraud (BAF)** de Feedzai :

| Information | Détail |
|-------------|--------|
| 📊 Nombre de transactions | 30 622 (jeu d'alertes) |
| 🔍 Caractéristiques analysées | 33 (montant, âge, revenu, statut d'emploi, etc.) |
| 🚨 Taux de fraude réel | ~12.1% (taux de fraude réel du dataset d'alertes) |
| 👥 Experts réels analysés | 50 (avec leurs prédictions réelles sur chaque cas) |
| 📅 Période couverte | 8 mois (dépendance temporelle) |

> **Analogie** : Imaginez un historique de 1 million de transactions bancaires. Pour chacune, on sait si c'était une fraude ou non. On a aussi demandé à 50 "détectives" (les experts) de donner leur avis sur chaque transaction. Certains détectives sont meilleurs que d'autres, et chacun a ses propres biais.

---

## 🤖 Les Modèles d'Intelligence Artificielle

Le système utilise **3 modèles de Machine Learning** (apprentissage automatique) qui fonctionnent comme des "détecteurs de fraude" :

### 1. Régression Logistique — Le rapide
> **Analogie** : C'est comme une checklist simple. "Le montant est élevé ? Oui. Le pays est à risque ? Oui. → Probablement une fraude."
- ✅ Très rapide
- ✅ Facile à comprendre
- ❌ Moins précis sur les cas complexes
- 📊 Précision : ~92%

### 2. Random Forest (Forêt Aléatoire) — L'équilibré
> **Analogie** : C'est comme demander l'avis de 200 détectives indépendants et prendre la décision de la majorité.
- ✅ Bon équilibre entre vitesse et précision
- ✅ Robuste aux données bruitées
- 📊 Précision : ~96%

### 3. XGBoost — Le champion
> **Analogie** : C'est comme une équipe de détectives qui apprennent de leurs erreurs. Chaque nouveau détective se concentre sur les cas que les précédents ont mal jugés.
- ✅ Le plus précis
- ✅ Gère très bien les déséquilibres (peu de fraudes vs beaucoup de transactions normales)
- ❌ Un peu plus lent
- 📊 Précision : ~97%

### Tableau comparatif (Benchmark réel sur le test set)

Ces performances réelles sont mesurées sur l'échantillon de test (`month > 5`, ~9 857 cas) après un entraînement temporel sur `month <= 5` :

| Métrique | Régression Logistique | Forêt Aléatoire | XGBoost (Actif) |
|----------|----------------------|---------------|-----------------|
| **Exactitude (Accuracy)** | ~89.1% | ~95.8% | ~96.5% |
| **Précision** | ~48.2% | ~68.3% | ~70.3% |
| **Rappel** (Recall) | ~65.4% | ~79.2% | ~83.1% |
| **AUC-ROC** | ~94.8% | ~98.0% | ~99.1% |
| **AUC-PR** (Précision-Rappel) | ~52.1% | ~69.4% | ~76.2% |

> ⚠️ **Pourquoi la précision semble basse ?** Parce que les fraudes sont rares (~12%). Quand le modèle dit "fraude", il se trompe parfois (faux positif = transaction légitime bloquée à tort). Mais c'est un choix volontaire : **mieux vaut bloquer une transaction légitime par erreur que laisser passer une fraude**.

---

## 🔀 Learning to Defer — L'IA qui sait quand demander de l'aide

C'est le cœur du projet. Le principe :

```
Transaction arrive
       ↓
   L'IA analyse
       ↓
  Score de risque ?
       ↓
  ┌─────────────────┐
  │   Score < 30%   │ → ✅ Auto-approuvé (probablement OK)
  │                 │
  │ 30% < Score < 70% │ → 👤 Déféré à un expert (l'IA hésite)
  │                 │
  │   Score > 70%   │ → 🚫 Auto-bloqué (probablement une fraude)
  └─────────────────┘
```

### Les 3 stratégies de déférence

1. **Par confiance** : "Mon score est entre 30% et 70%, je ne suis pas sûr → je demande un humain"
2. **Par désaccord** : "Les experts ne sont pas d'accord entre eux sur cette transaction → on investigue"
3. **Par coût** : "Si je me trompe sur cette transaction de 10 000€, ça coûte cher → je préfère qu'un humain vérifie"

---

## ⚖️ Équité — Le système est-il juste ?

Un point crucial : l'IA ne doit **pas discriminer**. Le tableau de bord surveille en permanence :

| Question posée | Métrique |
|----------------|----------|
| Est-ce que le système bloque autant de transactions pour tous les groupes d'âge ? | Parité démographique |
| Est-ce que le taux d'erreur est le même pour tous les groupes ? | Odds équalisés |
| Y a-t-il un groupe qui est plus souvent envoyé vers un expert ? | Taux de déférence |

> **Exemple concret** : Si le système bloque 3 fois plus de transactions pour les 18-25 ans que pour les 35-50 ans, c'est un **biais** qui doit être corrigé. Le panneau d'équité détecte et affiche ces disparités.

---

## 🏗️ Comment le projet est organisé

Le projet est divisé en **2 grandes parties** :

### 🖥️ Le Frontend (ce que l'utilisateur voit)
C'est le **tableau de bord visuel** — l'interface web avec les graphiques, les tableaux et les boutons.

- **Technologie** : React + TypeScript (un langage de programmation web populaire)
- **Dossier** : `frontend/`
- **10 composants** = 10 écrans différents dans l'application

### 🐍 Le Backend (ce qui travaille en coulisses)
C'est le **cerveau** — il charge les données, entraîne les modèles d'IA, et répond aux demandes du frontend.

- **Technologie** : Python + FastAPI (un framework pour créer des API web)
- **Dossier** : `backend/`
- **6 endpoints** = 6 services accessibles (entraîner un modèle, obtenir une prédiction, etc.)

### 📂 Structure des dossiers

```
fraud-detection-demo-app/
│
├── 📄 README.md                ← Ce fichier que vous lisez
├── 📄 DOCUMENTATION.md         ← Documentation détaillée (vous y êtes peut-être)
├── 📄 .env                     ← Configuration (ports, adresses)
├── 🐳 Dockerfile               ← Pour créer un conteneur Docker
├── 🐳 docker-compose.yml       ← Pour lancer tout d'un coup
│
├── 🖥️ frontend/                ← L'interface visuelle
│   ├── src/
│   │   ├── App.tsx             ← Le chef d'orchestre de l'interface
│   │   ├── components/         ← Les 10 écrans du tableau de bord
│   │   ├── hooks/              ← La logique de gestion des données
│   │   ├── types/              ← Les définitions des données
│   │   └── data/               ← Le générateur de données simulées
│   ├── index.html              ← La page web de base
│   └── package.json            ← La liste des librairies utilisées
│
└── 🐍 backend/                 ← Le cerveau de l'application
    ├── app/
    │   ├── main.py             ← Le point de départ du serveur
    │   ├── config.py           ← La configuration
    │   ├── models/             ← Les modèles d'IA
    │   ├── routes/             ← Les points d'entrée de l'API
    │   ├── services/           ← La logique métier
    │   └── database/           ← Le stockage des données
    ├── tests/                  ← Les tests automatisés
    └── requirements.txt        ← La liste des librairies Python
```

---

## 🚀 Comment lancer l'application

### Ce qu'il faut avoir installé
- **Docker** et **Docker Compose** (recommandé pour une installation automatique)
- Ou localement : **Node.js** (v18+) et **Python** (3.10+)

### Option 1 : Tout lancer automatiquement avec Docker (Recommandé)

Le projet intègre un script qui télécharge et configure automatiquement le dataset et les dépendances nécessaires.

1. Lancez les conteneurs :
   ```bash
   docker-compose up --build
   ```
2. Ouvrez votre navigateur sur **http://localhost:5173**.
3. Si les données réelles sont manquantes, l'IHM affichera un message. (Le backend télécharge automatiquement l'archive `FiFAR.zip` de 209 Mo depuis Figshare et l'extrait dans `backend/data/raw/` pour vous).
4. Rendez-vous sur l'onglet **Entraînement** de l'IHM et lancez l'entraînement des modèles pour activer les prédictions et les analyses réelles !

### Option 2 : Installation manuelle locale

1. **Télécharger le dataset** :
   Téléchargez l'archive depuis [Figshare](https://figshare.com/articles/dataset/Financial_Fraud_Alert_Review_Dataset/28351172) (ID `28351172`). Extrayez les fichiers pour obtenir :
   - `backend/data/raw/alert_data/processed_data/alerts.parquet`
   - `backend/data/raw/synthetic_experts/expert_predictions.parquet`

2. **Lancer le Backend (Python)** :
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
   *Note : la librairie `pyarrow` est requise et sera installée via requirements.txt.*

3. **Lancer le Frontend (React)** :
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🛠️ Technologies utilisées

| Technologie | Rôle | Analogie simple |
|-------------|------|-----------------|
| **React** | Construire l'interface web | Comme des briques LEGO pour assembler les pages |
| **TypeScript** | Langage de programmation web | Comme le JavaScript, mais avec un "correcteur orthographique" |
| **Vite** | Serveur de développement | Le "moteur" qui fait tourner le site pendant le développement |
| **Recharts** | Dessiner les graphiques | Le "peintre" qui transforme les chiffres en courbes et barres |
| **Python** | Langage du backend | Le langage le plus utilisé en intelligence artificielle |
| **FastAPI** | Framework du serveur | Le "serveur" qui reçoit et répond aux demandes |
| **scikit-learn** | Librairie de Machine Learning | La "boîte à outils" pour créer les modèles d'IA |
| **XGBoost** | Modèle d'IA avancé | L'outil spécialisé pour le modèle le plus performant |
| **Docker** | Conteneurisation | Une "boîte" qui contient tout le nécessaire pour faire tourner l'application n'importe où |

---

## 📊 Glossaire — Les termes techniques expliqués

| Terme | Explication simple |
|-------|-------------------|
| **Machine Learning (ML)** | Quand un ordinateur "apprend" à partir d'exemples passés, au lieu de suivre des règles écrites à la main |
| **Modèle** | Le "cerveau" entraîné de l'IA — il a vu des milliers d'exemples et sait reconnaître les fraudes |
| **Dataset** | Un grand tableau de données (ici : 1 million de lignes de transactions) |
| **Feature** | Une caractéristique mesurable (ex: montant, pays, heure) — comme les indices d'un détective |
| **Précision (Precision)** | Quand l'IA dit "c'est une fraude", à quelle fréquence elle a raison ? |
| **Rappel (Recall)** | Sur toutes les vraies fraudes, combien l'IA en a-t-elle détecté ? |
| **Faux positif** | Une transaction légitime bloquée par erreur (le client est gêné mais pas lésé) |
| **Faux négatif** | Une vraie fraude qui n'est pas détectée (le client perd de l'argent — c'est le pire cas) |
| **AUC-ROC** | Un score entre 0 et 1 qui mesure la qualité globale du modèle (1 = parfait) |
| **Learning to Defer (L2D)** | La capacité de l'IA à reconnaître qu'elle n'est pas sûre et à passer le relais à un humain |
| **Fairness (Équité)** | Vérifier que le système traite tous les groupes de population de la même façon |
| **Pipeline** | L'ensemble des étapes par lesquelles passent les données (de la réception à la décision) |
| **Kafka** | Un outil qui transporte les données en temps réel entre les différents composants |
| **API** | Un "guichet" qui permet au frontend de communiquer avec le backend |
| **Dashboard** | Tableau de bord — un écran qui résume les informations importantes |
| **Frontend** | La partie visible de l'application (ce que l'utilisateur voit dans son navigateur) |
| **Backend** | La partie invisible (le serveur qui fait les calculs et stocke les données) |
| **Docker** | Un outil qui empaquette l'application pour qu'elle fonctionne partout de la même façon |

---

## 📈 Compétences démontrées par ce projet

Ce projet démontre des compétences en :

- **Data Science** : manipulation de données, feature engineering, évaluation de modèles
- **Machine Learning** : entraînement et comparaison de 3 algorithmes de classification
- **MLOps** : déploiement de modèles, monitoring de drift, pipeline de données
- **Développement Full-Stack** : React/TypeScript (frontend) + Python/FastAPI (backend)
- **Design UI/UX** : dashboard temps réel avec dark theme et visualisations interactives
- **Éthique de l'IA** : analyse d'équité, détection de biais, métriques de fairness
- **Recherche appliquée** : implémentation du paradigme Learning to Defer

---

## 📚 Références

- **FiFAR** : [github.com/feedzai/fifar](https://github.com/feedzai/fifar) — Le framework de recherche sur lequel est basé ce projet
- **Feedzai** : [feedzai.com](https://feedzai.com/) — L'entreprise leader en IA pour la détection de fraude financière
- **Learning to Defer** : Un paradigme de recherche où l'IA apprend à collaborer avec des humains plutôt que de les remplacer

---

## 📝 Licence

Ce projet est à but **éducatif et de recherche**.
Le dataset FiFAR est sous licence [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
