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
  taBortOperativKundanteckning,
  uppdateraOperativBokning,
  uppdateraOperativKund,
  uppdateraOperativKundanteckning,
  uppdateraOperativtArende,
} from '@/lib/admin/operativa-server'
import { harAdminAtkomst } from '@/lib/auth/profiler-server'
import { hamtaAutentiseradAnvandarId } from '@/lib/supabase/route-anvandare'

export async function GET(request: NextRequest) {
  const atkomst = await verifieraAdmin(request)

  if (atkomst.status !== 200) {
    return NextResponse.json(tomtOperativtSvar(), { status: atkomst.status })
  }

  try {
    return NextResponse.json(await hamtaOperativAdminData())
  } catch {
    return NextResponse.json(tomtOperativtSvar(), { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const atkomst = await verifieraAdmin(request)

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
  const atkomst = await verifieraAdmin(request)

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
      default:
        return NextResponse.json({ ok: false }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json({ ok: false }, { status: statusFranFel(error) })
  }
}

async function verifieraAdmin(request: NextRequest): Promise<{ status: 200 | 401 | 403 | 500 }> {
  const anvandareId = await hamtaAutentiseradAnvandarId(request)

  if (!anvandareId) {
    return { status: 401 }
  }

  try {
    if (!(await harAdminAtkomst(anvandareId))) {
      return { status: 403 }
    }
  } catch {
    return { status: 500 }
  }

  return { status: 200 }
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
  }
}

function statusFranFel(error: unknown) {
  return error instanceof OperativtAdminFel ? error.status : 500
}
