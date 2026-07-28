import { skapaSupabaseServiceklient } from '@/lib/supabase/service'

/**
 * SERVER-ONLY. Administratörsstött MFA-återställningsflöde.
 *
 * Supabase Auths TOTP-API har inga återställningskoder (`recovery codes`) –
 * det uttalade officiella rådet är istället att användare kan registrera
 * flera TOTP-faktorer (en primär och en backup, se
 * `components/portal/sakerhet/sakerhet-vy.tsx`) för att slippa bero på
 * återställningskoder alls:
 * https://supabase.com/docs/reference/javascript/auth-mfa-api
 * ("Recovery codes are not supported but users can enroll multiple
 * factors... Having a 2nd factor for recovery frees the user of the burden
 * of having to store their recovery codes somewhere.")
 *
 * Om en användare ändå blir helt utelåst (t.ex. tappat bort sin enda
 * autentiseringsenhet) finns ingen självbetjänad väg tillbaka in – precis
 * som avsett för TOTP. Den enda vägen är att en systemroll-administratör
 * tar bort användarens MFA-faktorer via Supabases admin-API (kräver
 * service-rollnyckeln, alltså ENDAST på servern), varpå användaren vid
 * nästa inloggning skickas igenom enrollment-flödet på nytt (se
 * `lib/supabase/proxy.ts`).
 *
 * VIKTIGT: detta lagrar eller läser ALDRIG några TOTP-hemligheter – det tar
 * bara bort (unenroll) befintliga faktorer i Supabase Auths egna,
 * skyddade schema. Inget MFA-relaterat hemlighetsvärde passerar någonsin
 * `public.profiles` eller applikationskoden i övrigt.
 *
 * `supabase.auth.admin.mfa` är märkt `@experimental` i Supabase-JS-SDK:t
 * (fortfarande en officiell, dokumenterad del av admin-API:et) – se
 * slutrapporten för anteckning om detta.
 */

export type MfaAterstallningsResultat =
  | { ok: true; antalBorttagnaFaktorer: number }
  | {
      ok: false
      fel: 'anvandare_saknas' | 'inga_faktorer' | 'serverfel' | 'partiell_atersallning'
      /** Endast satt för `partiell_atersallning` – hur många faktorer som fortfarande finns kvar. */
      antalKvarvarande?: number
    }

/**
 * Tar bort samtliga MFA-faktorer (TOTP) för användaren med den angivna
 * e-postadressen, så att kontot återgår till att bara ha lösenordet som
 * faktor (`aal1`). Användaren måste sätta upp MFA på nytt vid nästa
 * inloggning – helt enligt det vanliga obligatoriska enrollment-flödet.
 *
 * VIKTIGT (delvis misslyckad återställning): den här funktionen rapporterar
 * ALDRIG `ok: true` om det finns kvarvarande faktorer på kontot. Varje
 * `deleteFactor()`-anrop kan i sig misslyckas (nätverksfel, en redan borttagen
 * faktor, etc.), så efter borttagningsförsöken görs ALLTID ett nytt
 * `listFactors()`-anrop för att verifiera det faktiska sluttillståndet direkt
 * mot Supabase Auth – i stället för att bara lita på varje enskilt
 * delete-svar. Om något fortfarande finns kvar returneras
 * `partiell_atersallning` (aldrig `ok: true`), så att anroparen (se
 * `app/api/mfa/aterstall/route.ts`) aldrig kan rapportera till en
 * administratör att ett konto är återställt när det i verkligheten
 * fortfarande har en aktiv faktor.
 */
export async function aterstallMfaForEpost(epost: string): Promise<MfaAterstallningsResultat> {
  const supabase = skapaSupabaseServiceklient()
  const normaliserad = epost.trim().toLowerCase()

  const { data: profil, error: profilFel } = await (async () => {
    try {
      return await supabase.from('profiles').select('id').ilike('epost', normaliserad).maybeSingle()
    } catch {
      return { data: null, error: new Error('profiles lookup failed') }
    }
  })()

  if (profilFel || !profil) {
    return { ok: false, fel: 'anvandare_saknas' }
  }

  const { data: faktorData, error: listaFel } = await (async () => {
    try {
      return await supabase.auth.admin.mfa.listFactors({
        userId: profil.id,
      })
    } catch {
      return { data: null, error: new Error('factor list failed') }
    }
  })()
  if (listaFel) {
    return { ok: false, fel: 'serverfel' }
  }
  if (!faktorData || faktorData.factors.length === 0) {
    return { ok: false, fel: 'inga_faktorer' }
  }

  // Kontrollera VARJE delete-resultat för sig – fortsätt försöka med
  // resterande faktorer även om en enskild borttagning misslyckas, så att en
  // administratör inte behöver köra flödet om från början för de faktorer
  // som faktiskt gick att ta bort.
  let antalBorttagna = 0
  for (const faktor of faktorData.factors) {
    const { error: taBortFel } = await (async () => {
      try {
        return await supabase.auth.admin.mfa.deleteFactor({
          id: faktor.id,
          userId: profil.id,
        })
      } catch {
        return { error: new Error('factor delete failed') }
      }
    })()
    if (!taBortFel) antalBorttagna++
  }

  // Lita INTE bara på delete-svaren ovan – verifiera det faktiska
  // sluttillståndet med ett nytt listFactors()-anrop mot Supabase Auth.
  const { data: kvarvarandeData, error: kvarvarandeFel } = await (async () => {
    try {
      return await supabase.auth.admin.mfa.listFactors({
        userId: profil.id,
      })
    } catch {
      return { data: null, error: new Error('remaining factor list failed') }
    }
  })()
  if (kvarvarandeFel) {
    // Kan inte bekräfta sluttillståndet – rapportera ALDRIG framgång i det
    // läget, även om alla delete-anrop ovan såg ut att lyckas.
    return { ok: false, fel: 'serverfel' }
  }

  const antalKvarvarande = kvarvarandeData?.factors.length ?? 0
  if (antalKvarvarande > 0) {
    return { ok: false, fel: 'partiell_atersallning', antalKvarvarande }
  }

  return { ok: true, antalBorttagnaFaktorer: antalBorttagna }
}
