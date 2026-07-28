import {
  adminWorkerDomäner,
  adminWorkerNamn,
  obligatoriskaWorkerSecrets,
} from '@/lib/admin/worker-konfiguration'
import { skapaSupabaseServiceklient } from '@/lib/supabase/service'

export type SystemStatusNiva = 'ok' | 'varning' | 'fel'

export interface SystemStatusKontroll {
  id: string
  namn: string
  status: SystemStatusNiva
  beskrivning: string
}

export interface SystemStatus {
  kontroller: SystemStatusKontroll[]
  profiler: {
    antal: number | null
    status: SystemStatusNiva
  }
}

function miljoKontroll(
  namn: string,
  variabel: string,
  beskrivning: string,
  validera?: (varde: string) => boolean,
): SystemStatusKontroll {
  const varde = process.env[variabel]?.trim()
  const finns = Boolean(varde)
  const giltig = typeof varde === 'string' && varde.length > 0 && (!validera || validera(varde))

  return {
    id: variabel,
    namn,
    status: giltig ? 'ok' : 'fel',
    beskrivning: !finns
      ? `${variabel} saknas i Worker-miljön.`
      : giltig
        ? beskrivning
        : `${variabel} har ett oväntat format i Worker-miljön.`,
  }
}

function arHttpsUrl(varde: string) {
  try {
    return new URL(varde).protocol === 'https:'
  } catch {
    return false
  }
}

const konfigurationsKontroller: SystemStatusKontroll[] = [
  {
    id: 'settings-notifications-storage',
    namn: 'Aviseringsinställningar',
    status: 'varning',
    beskrivning: 'Visas i läsläge tills serverlagring och e-postflöde är beslutade.',
  },
  {
    id: 'settings-recipients-storage',
    namn: 'E-postmottagare',
    status: 'varning',
    beskrivning: 'Mottagarlistan är inte driftkopplad ännu och kan därför inte ändras i portalen.',
  },
  {
    id: 'settings-categories-storage',
    namn: 'Ärendekategorier',
    status: 'varning',
    beskrivning: 'Kategorier är låsta tills en riktig servermodell finns för nya ärenden.',
  },
  {
    id: 'settings-canned-replies-storage',
    namn: 'Standardsvar',
    status: 'varning',
    beskrivning: 'Standardsvar visas som underlag tills de kan sparas server-side.',
  },
]

const workerKontroller: SystemStatusKontroll[] = [
  {
    id: 'worker-name',
    namn: 'Cloudflare Worker',
    status: 'ok',
    beskrivning: `Källkonfigurationen pekar på Worker:n ${adminWorkerNamn}.`,
  },
  {
    id: 'worker-domains',
    namn: 'Worker-domäner',
    status: 'ok',
    beskrivning: `Konfigurerade routes: ${adminWorkerDomäner.join(', ')}.`,
  },
]

export async function hamtaSystemStatus(): Promise<SystemStatus> {
  const kontroller: SystemStatusKontroll[] = [
    ...workerKontroller,
    miljoKontroll(
      'Supabase URL',
      obligatoriskaWorkerSecrets[0],
      'Worker:n har adressen till Supabase-projektet.',
      arHttpsUrl,
    ),
    miljoKontroll(
      'Supabase publishable key',
      obligatoriskaWorkerSecrets[1],
      'Klientnyckeln finns för inloggning och sessioner.',
    ),
    miljoKontroll(
      'Supabase service role',
      obligatoriskaWorkerSecrets[2],
      'Servernyckeln finns för skyddade adminoperationer.',
    ),
  ]

  if (kontroller.some((kontroll) => kontroll.status === 'fel')) {
    return {
      kontroller: [...kontroller, ...konfigurationsKontroller],
      profiler: {
        antal: null,
        status: 'fel',
      },
    }
  }

  try {
    const supabase = skapaSupabaseServiceklient()
    const { count, error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    if (error) {
      return {
        kontroller: [
          ...kontroller,
          {
            id: 'profiles-read',
            namn: 'Profiles-tabellen',
            status: 'fel',
            beskrivning: 'Worker:n kunde inte läsa profiles-tabellen via service role.',
          },
          ...konfigurationsKontroller,
        ],
        profiler: {
          antal: null,
          status: 'fel',
        },
      }
    }

    let authAdminKanLasas = false
    try {
      const { error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
      authAdminKanLasas = !authError
    } catch {
      authAdminKanLasas = false
    }

    const authAdminKontroll: SystemStatusKontroll = authAdminKanLasas
      ? {
          id: 'auth-admin-read',
          namn: 'Supabase Auth Admin',
          status: 'ok',
          beskrivning: 'Worker:n kan läsa Auth-användare och bjuda in portalkonton server-side.',
        }
      : {
          id: 'auth-admin-read',
          namn: 'Supabase Auth Admin',
          status: 'fel',
          beskrivning: 'Worker:n kunde inte läsa Supabase Auth Admin-API:t med service role.',
        }

    return {
      kontroller: [
        ...kontroller,
        {
          id: 'profiles-read',
          namn: 'Profiles-tabellen',
          status: 'ok',
          beskrivning: 'Worker:n kan läsa portalkonton från Supabase.',
        },
        authAdminKontroll,
        ...konfigurationsKontroller,
      ],
      profiler: {
        antal: count ?? 0,
        status: 'ok',
      },
    }
  } catch {
    return {
      kontroller: [
        ...kontroller,
        {
          id: 'profiles-read',
          namn: 'Profiles-tabellen',
          status: 'fel',
          beskrivning: 'Worker:n kunde inte skapa Supabase service-klienten.',
        },
        ...konfigurationsKontroller,
      ],
      profiler: {
        antal: null,
        status: 'fel',
      },
    }
  }
}
