import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase-klient för webbläsaren.
 *
 * Detta är den enda platsen i portalen som skapar en Supabase-klient.
 * URL och publishable-nyckel läses från miljövariabler – inga värden är
 * hårdkodade här. Publishable-nyckeln är avsedd att vara publik (samma roll
 * som Supabases tidigare "anon key") och exponeras därför medvetet till
 * klienten via NEXT_PUBLIC_-prefixet.
 *
 * Skapar en ny klientinstans per anrop, i linje med Supabase/Next.js
 * App Router-mönstret (@supabase/ssr). Anropa denna där en klient behövs,
 * istället för att dela en modul-global instans.
 */
export function skapaSupabaseWebblasarklient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    throw new Error(
      'Saknar NEXT_PUBLIC_SUPABASE_URL eller NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
        'Kontrollera att portal/.env.local finns och är korrekt ifylld.',
    )
  }

  return createBrowserClient(url, publishableKey)
}
