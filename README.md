# CapBudget 

**CapBudget** est une application web de gestion de budget personnelle. Elle permet de suivre ses revenus et dépenses, de définir des budgets par catégorie, de planifier des objectifs d'épargne et de gérer ses échéances (loyer, factures, abonnements).

L'application est pensée pour un usage en **FCFA** et propose une interface moderne, responsive (desktop + mobile).

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Architecture](#architecture)
- [Structure du projet](#structure-du-projet)
- [Prérequis](#prérequis)
- [Installation locale](#installation-locale)
- [Variables d'environnement](#variables-denvironnement)
- [Base de données (Neon PostgreSQL)](#base-de-données-neon-postgresql)
- [Lancement avec Docker](#lancement-avec-docker)
- [Pages de l'application](#pages-de-lapplication)
- [API REST](#api-rest)
- [Authentification & sécurité](#authentification--sécurité)
- [Données d'exemple](#données-dexemple)
- [Scripts disponibles](#scripts-disponibles)
- [Auteur](#auteur)

---

## Fonctionnalités

### Authentification
- Inscription avec nom d'utilisateur, e-mail et mot de passe
- Connexion / déconnexion
- Mot de passe oublié par **code OTP à 6 chiffres** envoyé par e-mail (expiration 15 min)
- Réinitialisation du mot de passe
- Session sécurisée via **JWT** stocké en cookie HTTP-only

### Dashboard
- Vue d'ensemble des finances (revenus, dépenses, solde)
- Graphiques (courbes et camemberts) avec **Recharts**
- Bandeau pour supprimer les données d'exemple
- Navigation vers toutes les sections

### Transactions
- Ajout, modification et suppression de transactions
- Types : **revenu** (`income`) ou **dépense** (`expense`)
- Catégories personnalisables (Nourriture, Transport, Salaire, etc.)
- Page dédiée **Revenus** et **Dépenses**
- Page **Transactions** avec vue complète et filtres

### Budgets
- Création de budgets par catégorie avec plafond (`budget_limit`)
- Suivi des montants dépensés (`spent`)
- Barre de progression visuelle

### Objectifs d'épargne
- Définition d'objectifs avec montant cible (`target`) et montant épargné (`saved`)
- Date limite optionnelle
- Ajout de fonds à un objectif existant

### Échéances
- Gestion des factures récurrentes (loyer, internet, électricité…)
- Date d'échéance, fréquence, statut payé / non payé
- Rappels activables

### UX / UI
- Design moderne avec **Tailwind CSS 4** et **DaisyUI**
- Toasts de notification globaux
- Logo **CapBudget** personnalisé
- Champ mot de passe avec bouton afficher / masquer
- Optimisation mobile (pas de zoom intempestif sur les champs de formulaire iOS)

---

## Stack technique

| Couche        | Technologies                                      |
|---------------|---------------------------------------------------|
| **Frontend**  | React 19, Vite 8, React Router, Axios, Recharts  |
| **Styles**    | Tailwind CSS 4, DaisyUI, Lucide React (icônes)  |
| **Backend**   | Node.js, Express 5, JWT, bcryptjs, cookie-parser  |
| **Base de données** | PostgreSQL (Neon cloud) + driver `pg`     |
| **E-mail**    | Nodemailer (Gmail / mot de passe d'application)   |
| **Conteneurisation** | Docker, Docker Compose                    |

---

## Architecture

```
┌─────────────────┐      HTTP (Axios)       ┌─────────────────┐
│  React (Vite)   │ ◄──────────────────────► │  Express API    │
│  localhost:5173 │      cookies JWT         │  localhost:5000 │
└─────────────────┘                          └────────┬────────┘
                                                      │
                                                      │ DATABASE_URL (SSL)
                                                      ▼
                                             ┌─────────────────┐
                                             │  Neon PostgreSQL │
                                             │  (cloud)         │
                                             └─────────────────┘
```

- Le frontend communique avec le backend via `http://localhost:5000/api/...`
- L'authentification repose sur un cookie `token` (JWT) envoyé avec `withCredentials: true`
- La base de données est hébergée sur **Neon** (PostgreSQL serverless)

---

## Structure du projet

```
CapBudget/
├── backend/
│   ├── config/
│   │   ├── db.js           # Connexion PostgreSQL (Neon)
│   │   ├── schema.sql      # Schéma SQL des tables
│   │   ├── initDb.js       # Création initiale du schéma
│   │   ├── migrate.js      # Migrations automatiques
│   │   ├── seed.js         # Données d'exemple par utilisateur
│   │   └── mail.js         # Configuration Nodemailer
│   ├── controllers/        # Logique métier (auth, transactions, budgets…)
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/             # Routes Express
│   ├── server.js           # Point d'entrée API
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Routes React
│   │   ├── Dashboard.jsx
│   │   ├── Revenus.jsx / Depenses.jsx / Transaction.jsx
│   │   ├── Budget.jsx / Objectifs.jsx / Echeance.jsx
│   │   ├── Signin.jsx / Signup.jsx
│   │   ├── ForgotPassword.jsx / ResetPassword.jsx
│   │   ├── ToastContext.jsx / CapBudgetLogo.jsx / PasswordInput.jsx
│   │   └── index.css
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Prérequis

- **Node.js** 20+
- **npm**
- Compte **[Neon](https://neon.tech)** (PostgreSQL gratuit)
- Compte **Gmail** avec mot de passe d'application (pour l'OTP mot de passe oublié)
- **Docker Desktop** (optionnel, pour lancer via conteneurs)

---

## Installation locale

### 1. Cloner le dépôt

```bash
git clone https://github.com/crabmites-dev/capBudget.git
cd capBudget
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # puis remplir les valeurs (voir ci-dessous)
npm run db:init        # créer les tables sur Neon (première fois)
npm run db:migrate     # appliquer les migrations (si base existante)
npm run dev            # démarre sur http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev            # démarre sur http://localhost:5173
```

Ouvrir **http://localhost:5173** dans le navigateur.

---

## Variables d'environnement

Créer le fichier `backend/.env` (ne **jamais** le committer sur Git) :

```env
# ── Neon PostgreSQL ──────────────────────────────────────────────
# Créer un projet sur https://neon.tech
# Copier la connection string (Connection details → Connection string)
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require

# ── JWT ──────────────────────────────────────────────────────────
JWT_SECRET=votre_cle_secrete_tres_longue_et_aleatoire

# ── Serveur ──────────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ── E-mail (mot de passe oublié — OTP) ───────────────────────────
EMAIL_USER=votre.email@gmail.com
EMAIL_PASS=mot_de_passe_application_gmail
```

> **Gmail :** activer la validation en 2 étapes, puis générer un [mot de passe d'application](https://myaccount.google.com/apppasswords).

---

## Base de données (Neon PostgreSQL)

### Tables principales

| Table                  | Description                                      |
|------------------------|--------------------------------------------------|
| `users`                | Comptes utilisateurs                             |
| `transactions`         | Revenus et dépenses                              |
| `budgets`              | Budgets par catégorie                            |
| `objectifs`            | Objectifs d'épargne                              |
| `echeances`            | Factures et échéances récurrentes                |
| `password_reset_codes` | Codes OTP hashés pour reset mot de passe         |

### Commandes

```bash
cd backend
npm run db:init      # Crée toutes les tables (première installation)
npm run db:migrate   # Met à jour une base existante (colonnes manquantes, renommages…)
```

---

## Lancement avec Docker

```bash
# À la racine du projet
docker compose up --build
```

| Service   | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:5173      |
| Backend   | http://localhost:5000      |

Les secrets sont chargés depuis `backend/.env` via `env_file` dans `docker-compose.yml`.  
La base reste sur **Neon** (pas de PostgreSQL local dans Docker).

---

## Pages de l'application

| Route              | Page                    | Accès        |
|--------------------|-------------------------|--------------|
| `/login`           | Connexion               | Public       |
| `/register`        | Inscription             | Public       |
| `/forgotPassword`  | Demande de code OTP     | Public       |
| `/resetPassword`   | Réinitialisation MDP    | Public       |
| `/dashboard`       | Tableau de bord         | Connecté     |
| `/revenu`          | Revenus                 | Connecté     |
| `/depense`         | Dépenses                | Connecté     |
| `/transaction`     | Toutes les transactions | Connecté     |
| `/budget`          | Budgets                 | Connecté     |
| `/objectifs`       | Objectifs d'épargne     | Connecté     |
| `/echeances`       | Échéances / factures    | Connecté     |

---

## API REST

Base URL : `http://localhost:5000/api`

### Auth — `/api/auth`

| Méthode | Route              | Auth | Description                          |
|---------|--------------------|------|--------------------------------------|
| POST    | `/register`        | Non  | Inscription + seed données exemple   |
| POST    | `/login`           | Non  | Connexion (cookie JWT)               |
| POST    | `/logout`          | Non  | Déconnexion                          |
| POST    | `/forgotPassword`  | Non  | Envoi code OTP par e-mail            |
| POST    | `/resetPassword`   | Non  | Reset avec `{ email, code, newPassword }` |
| GET     | `/getMe`           | Oui  | Infos utilisateur connecté           |
| GET     | `/sample-data`     | Oui  | Vérifie si données d'exemple existent |
| DELETE  | `/sample-data`     | Oui  | Supprime les données d'exemple       |

### Transactions — `/api/transactions`

| Méthode | Route        | Description                    |
|---------|--------------|--------------------------------|
| GET     | `/`          | Liste des transactions         |
| POST    | `/`          | Ajouter une transaction        |
| PUT     | `/:id`       | Modifier une transaction       |
| DELETE  | `/:id`       | Supprimer une transaction      |
| GET     | `/summary`   | Résumé revenus / dépenses      |
| GET     | `/categorie` | Dépenses groupées par catégorie |

### Budgets — `/api/budgets`

| Méthode | Route  | Description        |
|---------|--------|--------------------|
| GET     | `/`    | Liste des budgets  |
| POST    | `/`    | Créer un budget    |
| PUT     | `/:id` | Modifier           |
| DELETE  | `/:id` | Supprimer          |

### Objectifs — `/api/objectifs`

| Méthode | Route           | Description              |
|---------|-----------------|--------------------------|
| GET     | `/`             | Liste des objectifs      |
| POST    | `/`             | Créer un objectif        |
| PUT     | `/:id`          | Modifier                 |
| PATCH   | `/:id/funds`    | Ajouter des fonds        |
| DELETE  | `/:id`          | Supprimer                |

### Échéances — `/api/echeances`

| Méthode | Route                | Description           |
|---------|----------------------|-----------------------|
| GET     | `/`                  | Liste des échéances   |
| POST    | `/`                  | Créer une échéance    |
| PUT     | `/:id`               | Modifier              |
| PATCH   | `/:id/toggle-paid`   | Basculer payé / impayé |
| DELETE  | `/:id`               | Supprimer             |

> Toutes les routes (sauf `/api/auth` publiques) nécessitent le cookie `token` JWT.

---

## Authentification & sécurité

- Mots de passe hashés avec **bcrypt** (10 rounds)
- JWT signé avec `JWT_SECRET`, durée **30 jours**
- Cookie `httpOnly`, `sameSite: Lax` (protection XSS basique)
- Codes OTP reset : hashés en base, expiration **15 minutes**
- Fichier `.env` exclu du dépôt Git via `.gitignore`
- CORS limité à `http://localhost:5173` et `http://localhost:5175`

---

## Données d'exemple

À l'**inscription** ou à la **première connexion**, l'application injecte automatiquement des données de démonstration (`is_sample = true`) :

- Transactions (salaire, courses, transport, Netflix…)
- Budgets (Courses, Transport, Loisirs)
- Objectifs (Voyage à Paris, Fonds d'urgence)
- Échéances (Loyer, Internet, Électricité)

L'utilisateur peut les supprimer depuis le **Dashboard** via le bandeau « Supprimer les données d'exemple ».

---

## Scripts disponibles

### Backend (`backend/`)

| Commande           | Description                          |
|--------------------|--------------------------------------|
| `npm run dev`      | Serveur avec nodemon (développement) |
| `npm start`        | Serveur production                   |
| `npm run db:init`  | Initialiser le schéma Neon           |
| `npm run db:migrate` | Migrer une base existante          |

### Frontend (`frontend/`)

| Commande           | Description                          |
|--------------------|--------------------------------------|
| `npm run dev`      | Serveur Vite (port 5173)             |
| `npm run build`    | Build production                     |
| `npm run preview`  | Prévisualiser le build               |

---

## Auteur

**crabmites-dev** — Projet CapBudget (Gestion de dépenses)

---

## Licence

Projet personnel — tous droits réservés.
