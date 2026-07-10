# CLASS CENTER - Site Web

## Installation

1. Installer Node.js 18+ et Bun
2. Ouvrir un terminal dans le dossier class-center
3. Installer les dépendances :
   ```
   bun install
   ```
4. Configurer la base de données :
   ```
   bun run db:push
   ```
5. Créer un fichier .env avec :
   ```
   JWT_SECRET=votre-clé-secrète-ici
   ```
6. Lancer le serveur de développement :
   ```
   bun run dev
   ```
7. Ouvrir http://localhost:3000 dans votre navigateur

## Compte Admin par défaut
- Email : supportclasscenter@gmail.com
- Mot de passe : cedriC1990

## Stack Technique
- Next.js 16 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Prisma ORM + SQLite
- Authentification JWT + bcrypt
