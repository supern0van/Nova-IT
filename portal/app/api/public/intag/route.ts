import { NextResponse, type NextRequest } from 'next/server'

import { PubliktIntagFel, skapaPubliktIntag } from '@/lib/admin/publikt-intag-server'

/**
 * Säkert, publikt ärendeintag från nova-it.se (den publika webbplatsen).
 *
 * Anropas ALDRIG direkt från en besökares webbläsare – den publika
 * webbplatsens EGEN serverfunktion (`submitPublicIntake` i dess repo)
 * anropar denna endpoint server-till-server med en delad hemlighet.
 * Ingen AAL2-session, inget adminkonto – en anonym besökare har varken.
 * Autentiseringen är därför en helt separat mekanism från resten av
 * adminportalens skrivvägar (som alla kräver en giltig AAL2-session – se
 * den delade hjälparen i `lib/supabase/route-anvandare.ts`):
 *
 *   1. Kräver headern `x-intag-secret` som matchar `PUBLIC_INTAG_SECRET`
 *      exakt (konstant-tids-jämförelse, se `timmingSaker`). Fel eller
 *      saknad hemlighet ger 401 utan att avslöja vilket steg som brast.
 *   2. `PUBLIC_INTAG_SECRET` är server-only, roterbar via en ny Worker-
 *      secret, och delas ALDRIG med klientkod på någon av sajterna.
 *   3. All skrivning går genom `skapaPubliktIntag()`, som validerar varje
 *      fält på servern (klientvalidering på nova-it.se är bara UX) och
 *      skyddar mot dubbletter via en obligatorisk idempotensnyckel.
 *
 * Svar till den publika webbplatsen är medvetet begränsat – aldrig
 * kund-id, internt ärende-id, prioritet eller råa databasfel.
 */
export async function POST(request: NextRequest) {
  const konfigureradHemlighet = process.env.PUBLIC_INTAG_SECRET
  if (!konfigureradHemlighet) {
    console.error('PUBLIC_INTAG_SECRET saknas – det publika intaget kan inte verifiera anrop.')
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const mottagenHemlighet = request.headers.get('x-intag-secret')
  if (!mottagenHemlighet || !timmingSaker(mottagenHemlighet, konfigureradHemlighet)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (!arObjekt(payload)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    const resultat = await skapaPubliktIntag({
      kalla: payload.kalla as 'kontaktformular' | 'supportassistent',
      namn: String(payload.namn ?? ''),
      epost: String(payload.epost ?? ''),
      telefon: String(payload.telefon ?? ''),
      kundtyp: payload.kundtyp as 'privatperson' | 'verksamhet',
      verksamhetsnamn: payload.verksamhetsnamn ? String(payload.verksamhetsnamn) : undefined,
      tjanstSlug: String(payload.tjanstSlug ?? ''),
      angelagenhet: payload.angelagenhet as 'planerad' | 'normal' | 'akut',
      meddelande: String(payload.meddelande ?? ''),
      idempotensnyckel: String(payload.idempotensnyckel ?? ''),
    })

    return NextResponse.json({
      accepted: true,
      arendenummer: resultat.arendenummer,
      mottagetVid: resultat.mottagetVid,
      // Internt bruk för den publika webbplatsens e-postutskick – aldrig
      // vidarebefordrat till besökarens webbläsare av kontakt-servern.
      internt: { arendeId: resultat.arendeId, kundEpost: resultat.kundEpost, kundNamn: resultat.kundNamn },
    })
  } catch (error) {
    if (error instanceof PubliktIntagFel) {
      return NextResponse.json({ accepted: false, fel: error.message }, { status: error.status })
    }
    console.error('Publikt ärendeintag misslyckades.', error)
    return NextResponse.json({ accepted: false }, { status: 500 })
  }
}

function timmingSaker(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let resultat = 0
  for (let i = 0; i < a.length; i++) {
    resultat |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return resultat === 0
}

function arObjekt(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null
}
