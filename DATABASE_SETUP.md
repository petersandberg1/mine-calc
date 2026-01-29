# Databas – anslutning och lokal test

Appen använder **@vercel/kv** som kräver dessa miljövariabler:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

---

## 1. Ansluta databasen till ditt Vercel-projekt

### Om du har en Redis-databas (t.ex. "Redis" / "Redis notebook")

1. Gå till [vercel.com/dashboard](https://vercel.com/dashboard) och välj ditt **projekt**.
2. Klicka på **Storage** i projektmenyn.
3. Öppna din **Redis**-databas (t.ex. "Redis notebook").
4. Leta efter:
   - **"Connect Project"** / **"Länka till projekt"**, eller
   - **".env.local"** / **"Environment Variables"**.
5. Välj ditt **pre‑sales‑mining‑calculator‑projekt** och klicka **Connect** / **Länka**.

Då lägger Vercel till `KV_REST_API_URL` och `KV_REST_API_TOKEN` (och eventuellt fler) i projektets miljövariabler.

### Om det bara finns "Create Database"

Om du bara ser "Create Database" och inga befintliga Redis-databaser:

1. Klicka **Create Database**.
2. Välj **KV** eller **Redis** (namnet kan skilja sig).
3. Välj region (t.ex. Stockholm) och skapa.
4. Öppna den nya databasen och använd **Connect Project** / **.env.local** enligt stegen ovan.

### Kontrollera att variablerna finns

1. I Vercel: **Settings** → **Environment Variables**.
2. Kontrollera att det finns:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

Om inte: gå tillbaka till Storage → din Redis-databas och anslut projektet igen.

---

## 2. Testa lokalt

Du behöver samma miljövariabler i en fil som Next.js läser. **Lägg inte in denna fil i Git.**

### Alternativ A: `vercel env pull` (rekommenderat)

1. Installera Vercel CLI (om du inte redan har det):

   ```bash
   npm i -g vercel
   ```

2. Logga in och länka projektet (om du inte gjort det):

   ```bash
   vercel login
   vercel link
   ```

   Välj rätt projekt och mapp.

3. Hämta miljövariablerna till en lokal fil:

   ```bash
   vercel env pull .env.local
   ```

   Det skapas en `.env.local` med `KV_REST_API_URL`, `KV_REST_API_TOKEN` m.fl.

4. Starta utvecklingsservern:

   ```bash
   npm run dev
   ```

5. Öppna [http://localhost:3000](http://localhost:3000) och testa Spara/Ladda.

### Alternativ B: Skapa `.env.local` manuellt

Om du inte vill använda `vercel env pull`:

1. I Vercel: **Storage** → din Redis-databas → **.env.local** (eller **Environment Variables**).
2. Kopiera **värdet** (inte bara namnet) för:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
3. Skapa en fil `.env.local` i projektets **root** (samma nivå som `package.json`). Du kan utgå från `env.example`:

   ```bash
   cp env.example .env.local
   ```

   Redigera `.env.local` och sätt in de riktiga värdena du kopierade från Vercel:

   ```env
   KV_REST_API_URL=https://xxxxx.upstash.io
   KV_REST_API_TOKEN=AXxxxx...
   ```

4. Starta:

   ```bash
   npm run dev
   ```

### Säkerhet

- `.env.local` ska **inte** committas till Git (finns redan i `.gitignore`).
- Dela inte innehållet i `.env.local` eller skicka det i chat/e‑post.

---

## 3. Kontrollera att allt fungerar

### Health check (Vercel eller lokalt)

Öppna i webbläsaren:

- **Lokalt:** [http://localhost:3000/api/scenarios/health](http://localhost:3000/api/scenarios/health)
- **Vercel:** `https://<ditt-projekt>.vercel.app/api/scenarios/health`

Förväntat när det är korrekt:

```json
{
  "configured": true,
  "connected": true,
  "message": "KV is properly configured and connected"
}
```

Om `configured: false` eller `connected: false`:

- På Vercel: dubbelkolla **Settings → Environment Variables** och att Redis-databasen är ansluten till projektet.
- Lokalt: dubbelkolla att `.env.local` finns i root och innehåller `KV_REST_API_URL` och `KV_REST_API_TOKEN`, samt att du startat om `npm run dev` efter att ha skapat/ändrat filen.

---

## 4. Om "Redis notebook" inte ger REST-API-nycklar

`@vercel/kv` fungerar bara med **REST API** för Redis, dvs. `KV_REST_API_URL` och `KV_REST_API_TOKEN`.

Om din "Redis notebook" bara ger t.ex. en `KV_URL` (vanlig Redis-URL) och **inga** `KV_REST_API_*`-variabler, kan det vara en annan typ av Redis som inte stöds direkt av `@vercel/kv`.

Då behöver du antingen:

1. **Skapa en ny KV/Redis-databas** i Vercel Storage som ger REST API (KV), och ansluta den till projektet, eller  
2. Byta till en annan databaslösning (t.ex. Supabase, PlanetScale) och anpassa koden.

---

## 5. Kort översikt

| Steg | Vercel (production)        | Lokalt (utveckling)      |
|------|----------------------------|---------------------------|
| 1    | Storage → Redis → Connect Project | –                        |
| 2    | Redeploy (eller automatisk) | –                        |
| 3    | –                          | `vercel env pull .env.local` eller skapa `.env.local` |
| 4    | –                          | `npm run dev`             |
| 5    | Testa Spara/Ladda          | Testa Spara/Ladda         |
| 6    | `/api/scenarios/health`    | `http://localhost:3000/api/scenarios/health` |
