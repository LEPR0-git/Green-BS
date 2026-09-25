# 🌱 GreenApp — API de signalement environnemental

API backend pour une application citoyenne de signalement de déchets urbains. Les utilisateurs envoient des photos géolocalisées, une IA valide automatiquement les signalements, et des **Green Tokens** sont attribués en récompense.

---

## 🎯 Fonctionnalités

- 🔐 **Authentification** : inscription, connexion, JWT
- 📸 **Signalements** : photo + GPS + type (bac plein, dépôt sauvage, déchets au sol)
- 🤖 **Validation IA** : analyse automatique par Google Gemini
- 🪙 **Green Tokens** : récompense pour les signalements validés
- 🗺️ **Géospatial** : signalements proches, heatmap, stats par zone
- 📊 **Statistiques** : timeline, zones chaudes, analyses temporelles

---

## 🛠️ Stack technique

| Composant | Technologie |
|-----------|-------------|
| Runtime | Node.js 18+ |
| Framework | Express |
| Base de données | MongoDB Atlas + Mongoose |
| Authentification | JWT + bcrypt |
| Upload fichiers | Multer |
| Stockage images | Cloudinary |
| Intelligence Artificielle | Google Gemini 3.6 Flash |
| Géospatial | Index `2dsphere` MongoDB |

---

## 📋 Prérequis

- **Node.js** 18 ou supérieur
- **npm** 9 ou supérieur
- Un compte **MongoDB Atlas** (gratuit)
- Un compte **Cloudinary** (gratuit)
- Une clé **Google Gemini** (gratuite)

---

## 🚀 Installation

### 1. Cloner le projet

```bash
git clone <ton-repo-url>
cd greenapp-backend
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Puis édite `.env` et remplis les valeurs (voir `.env.example` pour les instructions).

### 4. Lancer le serveur

**En développement** (avec rechargement automatique) :
```bash
npm run dev
```

**En production** :
```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`.

---

## 📚 Documentation de l'API

### 🔐 Authentification

| Méthode | URL | Description | Protégée |
|---------|-----|-------------|----------|
| POST | `/api/auth/register` | Inscription | ❌ |
| POST | `/api/auth/login` | Connexion | ❌ |
| GET | `/api/auth/me` | Profil de l'utilisateur connecté | ✅ |

### 📸 Signalements

| Méthode | URL | Description | Protégée |
|---------|-----|-------------|----------|
| POST | `/api/reports` | Créer un signalement (avec photo) | ✅ |
| GET | `/api/reports` | Lister les signalements validés | ❌ |
| GET | `/api/reports/:id` | Voir un signalement | ❌ |
| GET | `/api/reports/nearby` | Signalements proches | ❌ |
| GET | `/api/reports/me` | Mes signalements | ✅ |

### 🪙 Green Tokens

| Méthode | URL | Description | Protégée |
|---------|-----|-------------|----------|
| GET | `/api/tokens/balance` | Solde actuel | ✅ |
| GET | `/api/tokens/history` | Historique des gains | ✅ |

### 📊 Statistiques

| Méthode | URL | Description | Protégée |
|---------|-----|-------------|----------|
| GET | `/api/stats/heatmap` | Zones chaudes (cellules) | ❌ |
| POST | `/api/stats/by-zone` | Signalements dans un polygone | ❌ |
| GET | `/api/stats/timeline` | Évolution temporelle par mois | ❌ |

---

## 📁 Architecture du projet

```
src/
├── app.js                 # Configuration Express
├── config/
│   ├── cloudinary.js      # Config Cloudinary
│   └── db.js              # Connexion MongoDB
├── controllers/           # Logique métier
│   ├── authController.js
│   ├── reportController.js
│   ├── statsController.js
│   └── tokenController.js
├── middlewares/
│   ├── auth.js            # Vérification JWT
│   ├── errorHandler.js    # Gestion d'erreurs
│   └── upload.js          # Multer
├── models/
│   ├── Report.js
│   ├── TokenLedger.js
│   └── User.js
├── routes/                # Définition des routes
│   ├── authRoutes.js
│   ├── reportRoutes.js
│   ├── statsRoutes.js
│   └── tokenRoutes.js
├── services/              # Services externes
│   ├── cloudinaryService.js
│   └── geminiService.js
└── utils/
    └── token.js           # Génération JWT
```

---

## 🔒 Sécurité

- Mots de passe hashés avec **bcrypt** (10 rounds)
- Authentification par **JWT** (7 jours)
- Validation des données par **Mongoose**
- Fichiers limités à **5 MB** et types images uniquement
- Secrets dans `.env` (jamais commités)

---

## 📄 Licence

ISC# Green-BS
