# 🐍 FiFAR Fraud Detection — Backend (API)

> **Le cerveau du système** — Ce serveur Python reçoit les requêtes, entraîne les modèles d'IA, et renvoie les résultats.

---

## 📋 Rôle du backend

Le backend est responsable de :
1. **Charger** le dataset FiFAR (~1M transactions bancaires)
2. **Entraîner** les modèles ML (Régression Logistique, Random Forest, XGBoost)
3. **Prédire** le risque de fraude pour une transaction donnée
4. **Simuler** le système Learning to Defer (IA qui délègue aux experts)
5. **Analyser** l'équité (est-ce que le système est juste pour tous ?)
6. **Fournir** une API REST que le frontend consomme

---

## 🏗️ Architecture

```
backend/
├── app/
│   ├── main.py                    # Point d'entrée FastAPI — déclare l'application
│   ├── config.py                  # Configuration centralisée (Pydantic)
│   │
│   ├── models/                    # 🤖 Intelligence Artificielle
│   │   ├── ml_models.py           # Les 3 modèles : LR, RF, XGBoost
│   │   ├── expert_ensemble.py     # Simulation des 50 experts synthétiques
│   │   ├── l2d_system.py          # Logique de Learning to Defer
│   │   └── trainer.py             # Orchestration de l'entraînement
│   │
│   ├── routes/                    # 🛤️ Endpoints REST (les "guichets" de l'API)
│   │   ├── data.py                # /api/v1/data/*     → Statistiques du dataset
│   │   ├── predictions.py         # /api/v1/predictions/* → Prédictions de fraude
│   │   ├── models.py              # /api/v1/models/*   → Entraînement des modèles
│   │   ├── experts.py             # /api/v1/experts/*  → Gestion des experts
│   │   ├── l2d.py                 # /api/v1/l2d/*      → Simulation L2D
│   │   └── analytics.py           # /api/v1/analytics/* → Analytics et fairness
│   │
│   ├── services/                  # ⚙️ Logique métier
│   │   ├── data_loader.py         # Chargement du dataset BAF
│   │   ├── preprocessor.py        # Nettoyage et normalisation des données
│   │   ├── feature_engineering.py # Création de nouvelles caractéristiques
│   │   ├── metrics_calculator.py  # Calcul de accuracy, precision, recall, etc.
│   │   └── fairness_analyzer.py   # Analyse des biais et de l'équité
│   │
│   ├── database/                  # 💾 Persistance des données
│   │   ├── db.py                  # Connexion SQLAlchemy
│   │   └── models.py             # Modèles ORM (structure des tables)
│   │
│   └── utils/                     # 🔧 Utilitaires
│       └── helpers.py             # Fonctions d'aide diverses
│
├── data/                          # Données
│   ├── raw/                       # Dataset original (Base.csv)
│   ├── processed/                 # Données prétraitées
│   └── models/                    # Modèles sauvegardés (.joblib)
│
├── tests/                         # 🧪 Tests automatisés
│   └── test_api.py
├── notebooks/                     # 📓 Notebooks Jupyter
└── requirements.txt              # Liste des dépendances Python
```

---

## 🚀 Installation et lancement

```bash
# 1. Aller dans le dossier backend
cd backend

# 2. Créer un environnement virtuel Python
python3 -m venv venv
source venv/bin/activate    # Mac/Linux
# ou : venv\Scripts\activate  # Windows

# 3. Installer les dépendances
pip install -r requirements.txt

# 4. Lancer le serveur
uvicorn app.main:app --reload --port 8000
```

---

## 📖 Documentation de l'API

- **Swagger UI** (interactif) : http://localhost:8000/docs
- **ReDoc** (lisible) : http://localhost:8000/redoc

---

## 🔌 Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/health` | Vérification de santé du service |
| `GET` | `/api/v1/data/stats` | Statistiques globales du dataset |
| `POST` | `/api/v1/models/train` | Entraîner les modèles ML |
| `POST` | `/api/v1/predictions/predict` | Prédiction de fraude |
| `POST` | `/api/v1/l2d/simulate` | Simulation Learning to Defer |
| `GET` | `/api/v1/experts/list` | Liste des 50 experts |
| `GET` | `/api/v1/analytics/fairness` | Analyse d'équité |

---

## ⚙️ Configuration

La configuration se fait via le fichier `.env` à la racine du projet ou via `app/config.py` :

| Variable | Défaut | Description |
|----------|--------|-------------|
| `DEBUG` | `true` | Active le rechargement automatique |
| `API_HOST` | `0.0.0.0` | Adresse d'écoute |
| `API_PORT` | `8000` | Port du serveur |
| `DATABASE_URL` | `sqlite:///./fifar_fraud.db` | Chemin de la base de données |
| `CONFIDENCE_THRESHOLD` | `0.7` | Seuil de confiance L2D |
| `N_EXPERTS` | `50` | Nombre d'experts simulés |
| `TEST_SIZE` | `0.2` | Proportion du jeu de test (20%) |

---

## 🧪 Tests

```bash
# Lancer tous les tests
pytest

# Avec détails
pytest -v

# Un test spécifique
pytest tests/test_api.py -v
```
