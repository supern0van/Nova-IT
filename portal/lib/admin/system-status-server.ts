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

function miljoKontroll(namn: string, variabel: string, beskrivning: string): SystemStatusKontroll {
  const finns = Boolean(process.env[variabel])

  return {
    id: variabel,
    namn,
    status: finns ? 'ok' : 'fel',
    beskrivning: finns ? beskrivning : `${variabel} saknas i Worker-miljön.`,
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

export async function hamtaSystemStatus(): Promise<SystemStatus> {
  const kontroller: SystemStatusKontroll[] = [
    miljoKontroll(
      'Supabase URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'Worker:n har adressen till Supabase-projektet.',
    ),
    miljoKontroll(
      'Supabase publishable key',
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      'Klientnyckeln finns för inloggning och sessioner.',
    ),
    miljoKontroll(
      'Supabase service role',
      'SUPABASE_SERVICE_ROLE_KEY',
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

    const { error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
    const authAdminKontroll: SystemStatusKontroll = authError
      ? {
          id: 'auth-admin-read',
          namn: 'Supabase Auth Admin',
          status: 'fel',
          beskrivning: 'Worker:n kunde inte läsa Supabase Auth Admin-API:t med service role.',
        }
      : {
          id: 'auth-admin-read',
          namn: 'Supabase Auth Admin',
          status: 'ok',
          beskrivning: 'Worker:n kan läsa Auth-användare och bjuda in portalkonton server-side.',
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
