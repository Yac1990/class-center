# 🚀 Déploiement Production — CLASS CENTER

Guide complet pour passer en production avec **Supabase** (base de données) + **Vercel** (hébergement) + **GitHub** (dépôt).

Ce guide ne supprime rien de l'existant. Il crée les conditions pour une validation facile, étape par étape.

---

## 📋 Sommaire

1. [Pré-requis](#1-pré-requis)
2. [Créer le projet Supabase](#2-créer-le-projet-supabase)
3. [Créer toutes les tables + sécurité](#3-créer-toutes-les-tables--sécurité)
4. [Pousser le code sur GitHub](#4-pousser-le-code-sur-github)
5. [Connecter Vercel](#5-connecter-vercel)
6. [Configurer les variables d'environnement](#6-configurer-les-variables-denvironnement)
7. [Déployer](#7-déployer)
8. [Validation post-déploiement](#8-validation-post-déploiement)
9. [Sécurité — ce qui est en place](#9-sécurité--ce-qui-est-en-place)
10. [Rollback / Retour SQLite local](#10-rollback--retour-sqlite-local)
11. [Dépannage](#11-dépannage)

---

## 1. Pré-requis

- [ ] Compte **GitHub** (gratuit)
- [ ] Compte **Supabase** (gratuit, https://supabase.com)
- [ ] Compte **Vercel** (gratuit, https://vercel.com — connectez-le à GitHub)
- [ ] **Git** installé localement
- [ ] Projet CLASS CENTER fonctionnel en local (`bun run dev`)

Aucun fichier local n'est supprimé pendant ce déploiement.

---

## 2. Créer le projet Supabase

1. Allez sur https://supabase.com/dashboard → **New project**
2. Remplissez :
   - **Name** : `class-center-prod`
   - **Database Password** : choisissez un mot de passe fort et **notez-le** (vous en aurez besoin)
   - **Region** : `Frankfurt (eu-central-1)` ou la plus proche de la Côte d'Ivoire
   - **Plan** : Free (suffisant pour démarrer)
3. Cliquez **Create new project** et attendez 2-3 minutes (Supabase provisionne la base).
4. ✅ Une fois prêt, vous voyez le Dashboard avec "Project is ready".

---

## 3. Créer toutes les tables + sécurité

Le fichier [`prisma/supabase-migration.sql`](prisma/supabase-migration.sql) contient **tout** :
- 16 tables (User, Recharge, Subscription, CabineManager, Publication, SubscriptionPlan, SIMBalance, WavePayment, CardSection, PhysicalCard, Transaction, FlashProduct, FlashOrder, PromotionalEmail, DocumentRequest, PromoCode)
- 30+ index pour la performance
- Triggers `updatedAt` automatiques
- **Row Level Security (RLS)** activée sur toutes les tables
- Politiques de sécurité (policies) pour les catalogues publics
- **Seed** : utilisateur admin par défaut (`supportclasscenter@gmail.com` / `cedriC1990`)
- **Seed** : 3 sections de cartes par défaut (Orange, MTN, Moov)

### Étapes :

1. Dans Supabase Dashboard → **SQL Editor** (icône `</>` à gauche)
2. Cliquez **New query**
3. Ouvrez le fichier `prisma/supabase-migration.sql` dans votre éditeur local, **copiez tout son contenu**
4. Collez dans l'éditeur SQL Supabase
5. Cliquez **Run** (bouton vert en bas)
6. ✅ Vous devez voir `Success. No rows returned.` en bas

### Vérification rapide

Dans le même SQL Editor, exécutez ces 3 requêtes pour valider :

```sql
-- Doit retourner 16
SELECT COUNT(*) AS tables_count FROM information_schema.tables WHERE table_schema='public';

-- Doit retourner 16
SELECT COUNT(*) AS rls_count FROM pg_tables WHERE schemaname='public' AND rowsecurity = TRUE;

-- Doit retourner l'admin
SELECT email, role FROM "User" WHERE role='ADMIN';
```

✅ Si tout est correct, passez à l'étape suivante.

---

## 4. Pousser le code sur GitHub

### 4.1. Préparer le dépôt

Si vous n'avez pas encore de dépôt Git local :

```bash
cd /home/z/my-project  # ou votre dossier local
git init
git add .
git commit -m "Production-ready: Supabase + Vercel setup"
```

### 4.2. Créer le dépôt GitHub

1. Allez sur https://github.com/new
2. **Repository name** : `class-center`
3. **Private** (recommandé — votre code source reste confidentiel)
4. **NE PAS** cocher "Add a README" (vous en avez déjà un)
5. Cliquez **Create repository**

### 4.3. Pousser le code

GitHub vous donne les commandes. Copiez-collez :

```bash
git remote add origin https://github.com/VOTRE-USERNAME/class-center.git
git branch -M main
git push -u origin main
```

### 4.4. Vérifier les fichiers sensibles NE sont PAS poussés

Vérifiez que `.gitignore` exclut :

```gitignore
.env
.env.local
.env.production
*.db
db/
node_modules/
.next/
```

Le fichier `.env.production.example` (sans mots de passe) DOIT être poussé. Le vrai `.env.production` ne doit JAMAIS être sur GitHub.

✅ Sur GitHub, ouvrez `.env` — il ne doit pas exister. Ouvrez `.env.production.example` — il doit exister.

---

## 5. Connecter Vercel

1. Allez sur https://vercel.com/new
2. Cliquez **Import Git Repository** → choisissez votre dépôt `class-center`
3. Vercel détecte automatiquement Next.js — **conservez ces réglages** :
   - **Framework Preset** : Next.js
   - **Build Command** : `bun run vercel-build` ← IMPORTANT (génère Prisma + build Next)
   - **Install Command** : `bun install`
   - **Output Directory** : `.next` (auto)
4. **NE PAS cliquer Deploy tout de suite** — d'abord les variables d'environnement (étape 6).

---

## 6. Configurer les variables d'environnement

Sur la même page Vercel, descendez à **Environment Variables**. Ajoutez **ces 5 variables** (en mode **Production**) :

### 6.1. Récupérer les valeurs depuis Supabase

Allez dans Supabase Dashboard → **Project Settings** (⚙️ en bas à gauche) → **Database** → section **Connection string**.

Vous voyez deux URLs :

| Variable | URL à copier | Port |
|---|---|---|
| `DATABASE_URL` | **Transaction pooler** URL | `6543` |
| `DIRECT_URL` | **Session pooler** URL | `5432` |

Pour chaque URL, remplacez `[YOUR-PASSWORD]` par le mot de passe que vous avez choisi à l'étape 2.

### 6.2. Variables à ajouter dans Vercel

| Name | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.xxxx:VOTRE_MDP@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` | Pooler pour runtime |
| `DIRECT_URL` | `postgresql://postgres.xxxx:VOTRE_MDP@aws-0-region.pooler.supabase.com:5432/postgres` | Pour migrations |
| `JWT_SECRET` | (générez avec `openssl rand -base64 48`) | Sécurité sessions |
| `EMAIL_USER` | `supportclasscenter@gmail.com` | Pour notifications email |
| `EMAIL_PASS` | (Google App Password — voir 6.3) | Mot de passe d'application Gmail |
| `NODE_ENV` | `production` | Auto-sur-Vercel mais explicite |

### 6.3. Créer le Gmail App Password

1. Allez sur https://myaccount.google.com/security
2. Activez **2-Step Verification** (obligatoire)
3. Puis : **App passwords** → créez-en une nommée "Vercel CLASS CENTER"
4. Copiez le mot de passe à 16 caractères → c'est votre `EMAIL_PASS`

✅ Cochez bien **Production** (et optionnellement **Preview**) pour chaque variable.

---

## 7. Déployer

1. De retour sur Vercel, cliquez **Deploy**
2. Attendez 2-4 minutes. Vercel exécute :
   - `bun install` → installe les dépendances
   - `postinstall` → `prisma generate` (génère le client Prisma pour PostgreSQL)
   - `vercel-build` → `prisma generate && next build` (compile le site)
3. ✅ À la fin : "Congratulations!" avec l'URL `https://class-center.vercel.app` (ou similaire)

### Si le build échoue

Consultez les logs Vercel. Les causes les plus fréquentes :
- Variable `DATABASE_URL` manquante ou mot de passe erroné → vérifiez Supabase
- `JWT_SECRET` manquant → ajoutez-le
- Build memory limit dépassé → passez en plan Hobby (20$/mois)

---

## 8. Validation post-déploiement

Ouvrez votre URL Vercel et **validez chaque point** :

### ✅ Site public

- [ ] Page d'accueil charge sans erreur
- [ ] Bascule mode clair / sombre (icône soleil/lune)
- [ ] Section "Vente Flash" affiche les produits
- [ ] Section "Documents à Traiter" — bouton "Envoyer mon document" ouvre le formulaire
- [ ] Section "Centre d'aide WhatsApp" — bouton flottant vert en bas à gauche ouvre l'overlay
- [ ] Footer affiche `supportclasscenter@gmail.com` et le numéro WhatsApp

### ✅ Connexion admin

- [ ] Cliquez **Connexion** (navbar)
- [ ] Email : `supportclasscenter@gmail.com`
- [ ] Mot de passe : `cedriC1990`
- [ ] → Vous voyez "Bonjour, Administrateur" + bouton "Administration"
- [ ] Cliquez **Administration** → dashboard admin s'ouvre

### ✅ Écriture en base (test complet)

- [ ] Dans l'admin → Vente Flash → créez un produit test → sauvegardez → vérifiez qu'il apparaît sur la page d'accueil
- [ ] Dans l'admin → Documents → vous devez voir les demandes existantes
- [ ] Depuis la page publique → Envoyer un document → soumettez une demande → vérifiez qu'elle apparaît dans l'admin

### ✅ Supabase Dashboard — vérification des données

1. Supabase Dashboard → **Table Editor** (icône table à gauche)
2. Vous devez voir toutes les 16 tables
3. Cliquez sur `User` → vous voyez l'admin `supportclasscenter@gmail.com`
4. Cliquez sur `CardSection` → vous voyez les 3 sections par défaut

### ✅ Vérification RLS (sécurité)

Dans Supabase Dashboard → **Authentication** → **Policies** :
- Vous devez voir **RLS Enabled** sur les 16 tables
- Les tables catalogue (`CardSection`, `PhysicalCard`, `FlashProduct`, `Publication`, `SubscriptionPlan`, `DocumentRequest`) ont une policy `public_read_catalog`
- Les autres tables n'ont **aucune policy** = accès anonyme **refusé** via Supabase API (mais Prisma via service role bypass le RLS)

---

## 9. Sécurité — ce qui est en place

### 9.1. Authentification applicative

- **JWT signé** avec `JWT_SECRET` (HttpOnly cookie `cc_session`, 7 jours, `secure=true` en prod)
- Mots de passe hachés avec **bcrypt (cost 12)** via `src/lib/auth.ts`
- Middleware Next.js (`src/middleware.ts`) protège les routes API :
  - Routes publiques (catalogue GET, auth, etc.) → accessibles sans login
  - Routes client (`/api/transactions`, `/api/loyalty`, etc.) → nécessitent JWT valide
  - Routes admin (`/api/flash-products` PUT/DELETE, etc.) → nécessitent `role=ADMIN`

### 9.2. Sécurité base de données (Supabase)

- **Row Level Security activée** sur toutes les tables
- **Aucune policy par défaut** = anonymous API bloqué
- Le **service role** (utilisé par Prisma côté serveur) bypass le RLS → app fonctionne
- Catalogues publics ont une policy `SELECT USING (TRUE)` pour permettre lecture publique

### 9.3. Sécurité cookies

- `httpOnly: true` → JavaScript navigateur ne peut pas lire le cookie
- `secure: production` → HTTPS uniquement en prod
- `sameSite: 'lax'` → protection CSRF basique
- Pas de session en localStorage → immune au XSS

### 9.4. Sécurité Vercel

- Variables d'environnement chiffrées au repos
- HTTPS automatique (certificat Let's Encrypt renouvelé)
- DDoS protection incluse
- Logs centralisés (Vercel Dashboard → Logs)

### 9.5. Mots de passe / credentials

| Élément | Valeur | Où |
|---|---|---|
| Email admin | `supportclasscenter@gmail.com` | DB + `src/lib/email.ts` + Vercel env |
| Mot de passe admin | `cedriC1990` | DB (hashé bcrypt cost 12) |
| Mot de passe DB Supabase | (votre choix) | Supabase seulement |
| JWT_SECRET | (généré aléatoirement) | Vercel env seulement |
| Gmail App Password | (16 caractères) | Vercel env seulement |

**Aucun secret n'est dans le code source GitHub.** Tous dans les env vars Vercel.

---

## 10. Rollback / Retour SQLite local

Si quelque chose se passe mal, vous pouvez revenir au mode dev local SQLite **sans perdre de données** :

```bash
# 1. Remettre le schéma SQLite
cp prisma/schema.prisma.sqlite prisma/schema.prisma

# 2. Remettre le DATABASE_URL local
echo 'DATABASE_URL=file:/home/z/my-project/db/custom.db' > .env

# 3. Re-générer le client Prisma
bun run db:generate

# 4. Restart dev
bun run dev
```

Votre base SQLite locale `db/custom.db` est intacte.

---

## 11. Dépannage

### Q : "Prisma can't reach database server"

**A** : Vérifiez que `DATABASE_URL` utilise le port **6543** (pooler) avec `?pgbouncer=true&connection_limit=1` à la fin. Sans ça, Prisma ouvre trop de connexions et Supabase les rejette.

### Q : "Error: P1014: The underlying enum does not exist"

**A** : Le schéma SQLite n'utilise pas d'enum Prisma — mais si vous avez édité le schéma, ajoutez `enum` pour PostgreSQL ou convertissez en `String`. Le schéma `schema.prisma.postgres` fourni utilise `String` partout (compatible).

### Q : "Login fails with 401 sur Vercel"

**A** : 2 causes possibles :
1. `JWT_SECRET` non défini dans Vercel → l'auth utilise le fallback "dev-secret" → incohérent entre requêtes. Ajoutez `JWT_SECRET`.
2. L'admin n'a pas été créé → exécutez la seed de `supabase-migration.sql` (section "SEED: DEFAULT ADMIN USER") dans Supabase SQL Editor.

### Q : "Les images uploadées ne s'affichent pas sur Vercel"

**A** : Vercel est **read-only** après le build — les fichiers uploadés dans `public/uploads/` ne persistent pas. Pour la prod, configurez Supabase Storage :
1. Supabase Dashboard → **Storage** → Create bucket `uploads`
2. Modifiez `src/app/api/upload/route.ts` pour uploader vers Supabase Storage au lieu du système de fichiers local
3. (Code à ajouter — voir la doc Supabase JS : `supabase.storage.from('uploads').upload(path, file)`)

### Q : "Build memory exceeded"

**A** : Passez Vercel en plan **Hobby** (20$/mois) → 8GB RAM au lieu de 1.5GB en Free.

### Q : "Le bouton Télécharger le site échoue en prod"

**A** : C'est normal — la route `/api/download` génère un zip du code source à la volée, ce qui nécessite l'accès au système de fichiers. En prod Vercel, ces fichiers sont supprimés après build. Pour désactiver le bouton en prod :

```tsx
// Dans src/app/page.tsx, ligne ~248
{process.env.NODE_ENV !== 'production' && <DownloadSiteButton />}
```

### Q : "Comment voir les logs Vercel ?"

**A** : Vercel Dashboard → votre projet → **Logs** tab. Vous voyez les logs `console.log` du serveur en temps réel.

---

## 📞 Support

- **Problème Supabase** : https://supabase.com/dashboard/support
- **Problème Vercel** : https://vercel.com/help
- **Documentation Prisma + Supabase** : https://www.prisma.io/docs/guides/database/supabase

---

## ✅ Checklist finale de production

Avant d'annoncer la mise en production :

- [ ] Supabase project créé + migration SQL exécutée (16 tables + RLS)
- [ ] Code poussé sur GitHub (dépôt privé)
- [ ] Vercel connecté au dépôt GitHub
- [ ] Variables d'environnement configurées dans Vercel (5 variables)
- [ ] Build Vercel réussi
- [ ] Login admin fonctionne (`supportclasscenter@gmail.com` / `cedriC1990`)
- [ ] Test complet : créer une recharge/document/produit flash → vérifier en base (Supabase Table Editor)
- [ ] HTTPS actif (cadenon dans le navigateur)
- [ ] Mode clair ET sombre fonctionnels
- [ ] Bouton flottant WhatsApp Help Center fonctionne
- [ ] Notifications email fonctionnent (vérifiez les logs Vercel après une commande)

Une fois tout coché : **votre site est en production** 🎉
