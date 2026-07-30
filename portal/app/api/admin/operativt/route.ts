import { NextResponse, type NextRequest } from 'next/server'

import {
  hamtaOperativAdminData,
  type NyOperativBokning,
  type NyOperativKund,
  type NyttOperativtArende,
  type OperativaArendeandringar,
  type OperativaBokningsandringar,
  type OperativaKundandringar,
  OperativtAdminFel,
  avbokaOperativBokning,
  laggTillOperativKundanteckning,
  laggTillOperativtMeddelande,
  skapaOperativBokning,
  skapaOperativKund,
  skapaOperativtArende,
  taBortOperativArenden,
  taBortOperativKund,
  taBortOperativKundanteckning,
  uppdateraOperativBokning,
  uppdateraOperativKund,
  uppdateraOperativKundanteckning,
  uppdateraOperativtArende,
} from '@/lib/admin/operativa-server'
import { skickaKlarForUpphamtningSms } from '@/lib/admin/sms-server'
import { arAdministrator } from '@/lib/auth/roll'
import { hamtaRollFranDatabasen } from '@/lib/auth/roll-server'
import { harBehorighet, type Behorighet } from '@/lib/auth/supabase-auth'
import { hamtaAutentiseradAnvandare } from '@/lib/supabase/route-anvandare'
import type { Roll } from '@/lib/types'

export async function GET(request: NextRequest) {
  const atkomst = await verifieraOperativAtkomst(request, { tillatDemogast: true })

  if (atkomst.status !== 200) {
    return NextResponse.json(tomtOperativtSvar(), { status: atkomst.status })
  }

  try {
    return NextResponse.json(await hamtaOperativAdminData({ endastPublikaKontaktintag: atkomst.demogast }))
  } catch {
    return NextResponse.json(tomtOperativtSvar(), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const atkomst = await verifieraOperativAtkomst(request)

  if (atkomst.status !== 200) {
    return NextResponse.json({ ok: false }, { status: atkomst.status })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (!arObjekt(payload) || typeof payload.typ !== 'string' || !arObjekt(payload.data)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // `skapa_kund` och `lagg_till_kundanteckning` kräver `redigera_kund` –
  // samma behörighet som klientens kunddialoger/-anteckningar redan
  // gatear bakom (se KundDialog/KundAnteckningar). `skapa_arende`,
  // `skapa_bokning` och `lagg_till_meddelande` kräver ingen extra kontroll
  // här: `skapa_arende`, `hantera_bokningar` och `svara_kund` finns redan
  // hos båda operativa nivåerna i `behorigheter`.
  if (
    (payload.typ === 'skapa_kund' || payload.typ === 'lagg_till_kundanteckning') &&
    !atkomst.harBehorighet('redigera_kund')
  ) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  try {
    switch (payload.typ) {
      case 'skapa_kund':
        return NextResponse.json({
          ok: true,
          kund: await skapaOperativKund(payload.data as unknown as NyOperativKund),
        }, { status: 201 })
      case 'skapa_arende':
        return NextResponse.json({
          ok: true,
          arende: await skapaOperativtArende(payload.data as unknown as NyttOperativtArende),
        }, { status: 201 })
      case 'skapa_bokning':
        return NextResponse.json({
          ok: true,
          bokning: await skapaOperativBokning(payload.data as unknown as NyOperativBokning),
        }, { status: 201 })
      case 'lagg_till_meddelande':
        return NextResponse.json({
          ok: true,
          meddelande: await laggTillOperativtMeddelande(
            payload.data as unknown as Parameters<typeof laggTillOperativtMeddelande>[0],
          ),
        }, { status: 201 })
      case 'lagg_till_kundanteckning':
        return NextResponse.json({
          ok: true,
          anteckning: await laggTillOperativKundanteckning(
            payload.data as unknown as Parameters<typeof laggTillOperativKundanteckning>[0],
          ),
        }, { status: 201 })
      default:
        return NextResponse.json({ ok: false }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: statusFranFel(error) })
  }
}

export async function PATCH(request: NextRequest) {
  const atkomst = await verifieraOperativAtkomst(request)

  if (atkomst.status !== 200) {
    return NextResponse.json({ ok: false }, { status: atkomst.status })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  if (!arObjekt(payload) || typeof payload.typ !== 'string' || !arObjekt(payload.data)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // `uppdatera_kund`, `uppdatera_kundanteckning` och `ta_bort_kundanteckning`
  // kräver `redigera_kund` – speglar KundDialog/KundAnteckningar.
  if (
    (payload.typ === 'uppdatera_kund' ||
      payload.typ === 'uppdatera_kundanteckning' ||
      payload.typ === 'ta_bort_kundanteckning') &&
    !atkomst.harBehorighet('redigera_kund')
  ) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  // Att byta ansvarig tekniker kräver `tilldela_arende` – i klienten är
  // ansvarig-väljaren bara synlig/aktiv för den som har den behörigheten
  // (se ArendeAtgarder). Status- och prioritetsändringar kräver ingen
  // extra kontroll: `andra_status`/`andra_prioritet` finns hos båda
  // operativa nivåerna.
  if (
    payload.typ === 'uppdatera_arende' &&
    arObjekt(payload.data.andringar) &&
    'ansvarigId' in payload.data.andringar &&
    !atkomst.harBehorighet('tilldela_arende')
  ) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  // Ett SMS till kunden är kommunikation med kunden - samma behörighet
  // (`svara_kund`) som redan finns hos båda operativa nivåerna.
  if (payload.typ === 'skicka_sms' && !atkomst.harBehorighet('svara_kund')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  // Permanent borttagning är administratörsbehörigheter, medvetet
  // strängare än redigera_kund/tilldela_arende - en tekniker ska aldrig
  // kunna radera data permanent.
  if (payload.typ === 'ta_bort_kund' && !atkomst.harBehorighet('ta_bort_kund')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }
  if (payload.typ === 'ta_bort_arenden' && !atkomst.harBehorighet('ta_bort_arende')) {
    return NextResponse.json({ ok: false }, { status: 403 })
  }

  try {
    switch (payload.typ) {
      case 'uppdatera_kund':
        if (typeof payload.data.id !== 'string') return NextResponse.json({ ok: false }, { status: 400 })
        return NextResponse.json({
          ok: true,
          kund: await uppdateraOperativKund(
            payload.data.id,
            payload.data.andringar as unknown as OperativaKundandringar,
          ),
        })
      case 'uppdatera_bokning':
        if (typeof payload.data.id !== 'string') return NextResponse.json({ ok: false }, { status: 400 })
        return NextResponse.json({
          ok: true,
          bokning: await uppdateraOperativBokning(
            payload.data.id,
            payload.data.andringar as unknown as OperativaBokningsandringar,
            typeof payload.data.aktor === 'string' ? payload.data.aktor : 'Okänd',
          ),
        })
      case 'avboka_bokning':
        if (typeof payload.data.id !== 'string') return NextResponse.json({ ok: false }, { status: 400 })
        return NextResponse.json({
          ok: true,
          bokning: await avbokaOperativBokning(
            payload.data.id,
            typeof payload.data.aktor === 'string' ? payload.data.aktor : 'Okänd',
          ),
        })
      case 'uppdatera_arende':
        if (
          typeof payload.data.id !== 'string' ||
          !arObjekt(payload.data.aktivitet) ||
          typeof payload.data.aktivitet.typ !== 'string' ||
          typeof payload.data.aktivitet.beskrivning !== 'string'
        ) {
          return NextResponse.json({ ok: false }, { status: 400 })
        }
        return NextResponse.json({
          ok: true,
          arende: await uppdateraOperativtArende(
            payload.data.id,
            payload.data.andringar as unknown as OperativaArendeandringar,
            {
              typ: payload.data.aktivitet.typ as 'status' | 'prioritet' | 'tilldelning',
              beskrivning: payload.data.aktivitet.beskrivning,
              aktor:
                typeof payload.data.aktivitet.aktor === 'string'
                  ? payload.data.aktivitet.aktor
                  : 'Okänd',
            },
          ),
        })
      case 'uppdatera_kundanteckning':
        if (typeof payload.data.id !== 'string' || typeof payload.data.text !== 'string') {
          return NextResponse.json({ ok: false }, { status: 400 })
        }
        return NextResponse.json({
          ok: true,
          anteckning: await uppdateraOperativKundanteckning(payload.data.id, payload.data.text),
        })
      case 'ta_bort_kundanteckning':
        if (typeof payload.data.id !== 'string') return NextResponse.json({ ok: false }, { status: 400 })
        return NextResponse.json({
          ok: true,
          id: await taBortOperativKundanteckning(payload.data.id),
        })
      case 'skicka_sms':
        if (typeof payload.data.arendeId !== 'string') {
          return NextResponse.json({ ok: false }, { status: 400 })
        }
        return NextResponse.json({
          ok: true,
          sms: await skickaKlarForUpphamtningSms(
            payload.data.arendeId,
            typeof payload.data.aktor === 'string' ? payload.data.aktor : 'Okänd',
          ),
        })
      case 'ta_bort_kund':
        if (typeof payload.data.id !== 'string') return NextResponse.json({ ok: false }, { status: 400 })
        return NextResponse.json({
          ok: true,
          id: await taBortOperativKund(payload.data.id),
        })
      case 'ta_bort_arenden':
        if (
          !Array.isArray(payload.data.ids) ||
          !payload.data.ids.every((id): id is string => typeof id === 'string')
        ) {
          return NextResponse.json({ ok: false }, { status: 400 })
        }
        return NextResponse.json({
          ok: true,
          ids: await taBortOperativArenden(payload.data.ids),
        })
      default:
        return NextResponse.json({ ok: false }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: statusFranFel(error) })
  }
}

type OperativAtkomst =
  | { status: 200; demogast: boolean; harBehorighet: (behorighet: Behorighet) => boolean }
  | { status: 401 | 500 }

/**
 * Kräver enbart en giltig, AAL2-verifierad portalsession – till skillnad
 * från adminprofil-routrarna (`/api/admin/profiler` m.fl.) som kräver
 * `SystemRoll: administrator`. Operativt data (kunder/ärenden/bokningar)
 * ska vara tillgängligt för alla inloggade portalkonton, precis som den
 * klientsidiga `Behorighet`-modellen (`administrator`/`tekniker`) redan
 * förutsätter.
 *
 * Det finns ännu ingen egen personal-/teknikerroll-tabell (se separat
 * analys av `lib/auth/demo-auth.ts`), så `SystemRoll` återanvänds som den
 * enda idag tillgängliga signalen för vilken operativ nivå ett konto har:
 * `administrator` → full operativ behörighet, `medarbetare` → `tekniker`.
 * Detta ska bytas ut den dagen en riktig personalmodell finns.
 */
async function verifieraOperativAtkomst(
  request: NextRequest,
  alternativ: { tillatDemogast?: boolean } = {},
): Promise<OperativAtkomst> {
  const anvandare = await hamtaAutentiseradAnvandare(request, alternativ)
  if (!anvandare) return { status: 401 }

  let systemRoll: Awaited<ReturnType<typeof hamtaRollFranDatabasen>>
  try {
    systemRoll = await hamtaRollFranDatabasen(anvandare.id)
  } catch {
    return { status: 500 }
  }
  if (!systemRoll) return { status: 500 }

  const operativRoll: Roll = arAdministrator(systemRoll) ? 'administrator' : 'tekniker'
  return {
    status: 200,
    demogast: anvandare.demogast,
    harBehorighet: (behorighet) => harBehorighet(operativRoll, behorighet),
  }
}

function arObjekt(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data !== null
}

function tomtOperativtSvar() {
  return {
    kunder: [],
    arenden: [],
    bokningar: [],
    meddelanden: [],
    aktiviteter: [],
    kundanteckningar: [],
    personal: [],
  }
}

function statusFranFel(error: unknown) {
  return error instanceof OperativtAdminFel ? error.status : 500
}
