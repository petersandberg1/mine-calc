# Deployment Guide

## Vercel (Rekommenderat - Enklast)

Vercel är det enklaste sättet att deploya Next.js-appar.

### Steg 1: Förberedelser

1. **Pusha koden till GitHub** (om du inte redan gjort det):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <ditt-github-repo-url>
   git push -u origin main
   ```

2. **Se till att AHS_logo.png finns i public-mappen**

### Steg 2: Deploya till Vercel

**Alternativ A: Via Vercel Dashboard (Enklast)**
1. Gå till [vercel.com](https://vercel.com)
2. Logga in med GitHub
3. Klicka på "Add New Project"
4. Importera ditt GitHub-repo
5. Vercel kommer automatiskt detektera Next.js
6. Klicka på "Deploy"

**Alternativ B: Via Vercel CLI**
```bash
npm i -g vercel
vercel
```

### Viktigt: Filbaserad lagring fungerar inte på serverless

Save/Load-funktionen kommer **INTE** fungera på Vercel eftersom filsystemet är read-only. För test kan du:
- Använda appen utan save-funktionen
- Eller se alternativ nedan för att fixa detta

---

## Alternativ: Railway eller Render (Stödjer filsystem)

Om du behöver filbaserad lagring:

### Railway
1. Gå till [railway.app](https://railway.app)
2. Logga in med GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Välj ditt repo
5. Railway detekterar Next.js automatiskt

### Render
1. Gå till [render.com](https://render.com)
2. "New" → "Web Service"
3. Anslut GitHub-repo
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`

---

## För Production: Fixa Save-funktionen

För att save-funktionen ska fungera i production, behöver du antingen:

1. **Använda en databas** (t.ex. MongoDB, PostgreSQL, Supabase)
2. **Använda Vercel KV** (Redis) eller **Vercel Blob Storage**
3. **Använda localStorage** (endast client-side, begränsat)

Vill du att jag implementerar en av dessa lösningar?
