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

Le projet utilise le **Bank Account Fraud (BAF) Dataset**, un jeu de données créé par [Feedzai](https://feedzai.com/) (entreprise spécialisée en IA financière) :

| Information | Détail |
|-------------|--------|
| 📊 Nombre de transactions | ~1 000 000 (un million) |
| 🔍 Caractéristiques analysées | 30+ (montant, heure, pays, appareil, historique client, etc.) |
| 🚨 Taux de fraude | ~4.8% (réaliste — en vrai c'est souvent entre 1% et 5%) |
| 👥 Nombre d'experts simulés | 50 (avec des niveaux de compétence de 60% à 95%) |
| 📅 Période couverte | 8 mois de transactions |

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

### Tableau comparatif

| Métrique | Régression Logistique | Random Forest | XGBoost |
|----------|----------------------|---------------|---------|
| **Exactitude** (% de bonnes réponses globales) | ~92% | ~96% | ~97% |
| **Précision** (quand il dit "fraude", il a raison à...) | ~45% | ~65% | ~70% |
| **Rappel** (sur toutes les vraies fraudes, il en détecte...) | ~72% | ~80% | ~83% |
| **AUC-ROC** (qualité globale du classement) | ~96% | ~98% | ~99% |

> ⚠️ **Pourquoi la précision semble basse ?** Parce que les fraudes sont rares (~5%). Quand le modèle dit "fraude", il se trompe parfois (faux positif = transaction légitime bloquée à tort). Mais c'est un choix volontaire : **mieux vaut bloquer une transaction légitime par erreur que laisser passer une fraude**.

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
- **Node.js** version 18 ou plus récente → [télécharger ici](https://nodejs.org/)
- **Python** version 3.10 ou plus récente → [télécharger ici](https://python.org/)

### Étape 1 : Lancer le tableau de bord (Frontend)

Ouvrez un terminal et tapez :

```bash
# Aller dans le dossier frontend
cd frontend

# Installer les librairies nécessaires (à faire une seule fois)
npm install

# Lancer l'application
npm run dev
```

Ouvrez votre navigateur sur **http://localhost:5173** — vous verrez le tableau de bord ! 🎉

### Étape 2 (optionnel) : Lancer le serveur API (Backend)

```bash
# Aller dans le dossier backend
cd backend

# Créer un environnement Python isolé
python -m venv venv
source venv/bin/activate    # Mac/Linux
# ou : venv\Scripts\activate  # Windows

# Installer les librairies
pip install -r requirements.txt

# Lancer le serveur
uvicorn app.main:app --reload --port 8000
```

Le serveur API est sur **http://localhost:8000** (documentation : **http://localhost:8000/docs**)

### Alternative : Tout lancer avec Docker

```bash
docker-compose up --build
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
