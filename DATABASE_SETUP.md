# Database Setup - Vercel KV

Appen använder nu Vercel KV (Redis) för databaslagring istället för filsystem, vilket gör att den fungerar på serverless-plattformar som Vercel.

## Steg 1: Skapa Vercel KV Database

1. Gå till ditt Vercel-projekt
2. Gå till **Storage**-fliken
3. Klicka på **Create Database**
4. Välj **KV** (Redis)
5. Välj region (t.ex. `arn1` - Stockholm)
6. Klicka **Create**

## Steg 2: Länka till ditt projekt

1. Efter att databasen är skapad, klicka på **.env.local**-fliken
2. Kopiera miljövariablerna som visas
3. Dessa kommer automatiskt att läggas till i ditt Vercel-projekt

## Steg 3: Lokal utveckling (valfritt)

Om du vill testa lokalt, skapa en `.env.local`-fil i projektets root:

```env
KV_URL=your_kv_url
KV_REST_API_URL=your_rest_api_url
KV_REST_API_TOKEN=your_rest_api_token
KV_REST_API_READ_ONLY_TOKEN=your_read_only_token
```

**OBS:** Lägg INTE `.env.local` i git! Den är redan i `.gitignore`.

## Kostnad

Vercel KV har en **gratis tier** som ger:
- 256 MB storage
- 10,000 reads/dag
- 10,000 writes/dag

Detta är mer än tillräckligt för test och små projekt.

## Migration från filsystem

Om du hade sparade scenarios i filsystemet tidigare, behöver de migreras manuellt eller så startar du med en tom databas (vilket är normalt för ny deployment).
