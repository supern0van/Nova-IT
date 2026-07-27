'use client'

import { ShieldCheckIcon, ShieldIcon, UserRoundIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { Faltrad, Sektionsrubrik, Yta } from '@/components/portal/ui-delar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { systemRoller, type SystemRoll } from '@/lib/auth/roll'
import { formateraDatumTid, systemRollLabel } from '@/lib/labels'

interface ProfilRad {
  id: string
  epost: string
  namn: string
  roll: SystemRoll
  skapad: string
  uppdaterad: string
}

type ProfilStatus =
  | { status: 'laddar'; profiler: ProfilRad[] }
  | { status: 'klar'; profiler: ProfilRad[] }
  | { status: 'nekad'; profiler: ProfilRad[] }
  | { status: 'fel'; profiler: ProfilRad[] }

/**
 * Systemöversikt för verkliga portalkonton.
 *
 * Listan hämtas från `public.profiles` via en server-side API-route som
 * kräver giltig AAL2-session och systemrollen `administrator`.
 */
export function SystemPanel() {
  const { anvandare, kan } = useAuth()
  const kanSePersonal = kan('hantera_anvandare')
  const [profilStatus, setProfilStatus] = useState<ProfilStatus>({
    status: 'laddar',
    profiler: [],
  })
  const [spararRoll, setSpararRoll] = useState<string | null>(null)

  useEffect(() => {
    if (!kanSePersonal) {
      setProfilStatus({ status: 'nekad', profiler: [] })
      return
    }

    let avbruten = false
    setProfilStatus({ status: 'laddar', profiler: [] })

    fetch('/api/admin/profiler')
      .then(async (svar) => {
        if (svar.status === 403) return { status: 'nekad' as const, profiler: [] }
        if (!svar.ok) return { status: 'fel' as const, profiler: [] }
        const data = (await svar.json()) as { profiler?: ProfilRad[] }
        return { status: 'klar' as const, profiler: data.profiler ?? [] }
      })
      .then((data) => {
        if (!avbruten) setProfilStatus(data)
      })
      .catch(() => {
        if (!avbruten) setProfilStatus({ status: 'fel', profiler: [] })
      })

    return () => {
      avbruten = true
    }
  }, [kanSePersonal])

  async function andraSystemroll(profil: ProfilRad, nyRoll: SystemRoll) {
    if (profil.roll === nyRoll || spararRoll) return

    setSpararRoll(profil.id)

    try {
      const svar = await fetch(`/api/admin/profiler/${profil.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roll: nyRoll }),
      })

      if (!svar.ok) {
        const fallback =
          svar.status === 400
            ? 'Din egen roll kan inte ändras här, och rollen måste vara giltig.'
            : 'Kontrollera att sessionen fortfarande är AAL2-verifierad och försök igen.'

        toast.error('Kunde inte ändra systemroll', { description: fallback })
        return
      }

      const data = (await svar.json()) as { profil?: ProfilRad }
      if (!data.profil) {
        toast.error('Kunde inte ändra systemroll', {
          description: 'API:t svarade utan uppdaterad profil.',
        })
        return
      }

      setProfilStatus((nu) => ({
        ...nu,
        profiler: nu.profiler.map((rad) => (rad.id === data.profil?.id ? data.profil : rad)),
      }))

      toast.success('Systemroll uppdaterad', {
        description: `${data.profil.epost} är nu ${systemRollLabel[data.profil.roll].toLowerCase()}.`,
      })
    } catch {
      toast.error('Kunde inte ändra systemroll', {
        description: 'Nätverket eller Worker-svaret avbröts.',
      })
    } finally {
      setSpararRoll(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {kanSePersonal ? (
        <Yta className="flex flex-col gap-4 p-3.5">
          <Sektionsrubrik antal={profilStatus.profiler.length}>Portalkonton</Sektionsrubrik>

          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Konton och systemroller läses från Supabase-tabellen profiles. Systemroller kan ändras
            här och skyddas server-side med AAL2-session samt administratörsroll.
          </p>

          {profilStatus.status === 'laddar' && (
            <div className="flex items-center gap-2 rounded-lg bg-surface-emphasis p-3 text-[13px] text-muted-foreground">
              <Spinner data-icon="inline-start" />
              Läser portalkonton från Supabase…
            </div>
          )}

          {profilStatus.status === 'fel' && (
            <div className="rounded-lg bg-destructive/10 p-3 text-[13px] text-destructive">
              Portalkontona kunde inte läsas just nu. Kontrollera Supabase-konfigurationen och
              försök igen.
            </div>
          )}

          {profilStatus.status === 'klar' && profilStatus.profiler.length === 0 && (
            <div className="rounded-lg bg-surface-emphasis p-3 text-[13px] text-muted-foreground">
              Inga portalkonton hittades i profiles-tabellen.
            </div>
          )}

          {profilStatus.status === 'klar' && profilStatus.profiler.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {profilStatus.profiler.map((profil) => {
                const RollIkon = profil.roll === 'administrator' ? ShieldIcon : UserRoundIcon
                const namn = profil.namn.trim() || profil.epost
                const initialer = namn
                  .split(/\s+/)
                  .map((del) => del[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()

                return (
                  <li
                    key={profil.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface-emphasis p-3"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-[11px] font-semibold text-text-secondary"
                      >
                        {initialer || '?'}
                      </span>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="truncate text-[13px] font-medium">{namn}</p>
                        <p className="truncate text-[12px] text-muted-foreground">{profil.epost}</p>
                      </div>
                    </div>

                    <dl className="flex flex-wrap items-start gap-x-8 gap-y-2">
                      <Faltrad etikett="Systemroll">
                        <div className="flex items-center gap-2">
                          <RollIkon className="size-3.5 shrink-0" />
                          <Select
                            value={profil.roll}
                            onValueChange={(nyRoll) =>
                              void andraSystemroll(profil, nyRoll as SystemRoll)
                            }
                            disabled={spararRoll !== null || profil.id === anvandare?.id}
                          >
                            <SelectTrigger
                              size="sm"
                              className="min-w-36 bg-card text-[13px]"
                              aria-label={`Ändra systemroll för ${profil.epost}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {systemRoller.map((roll) => (
                                <SelectItem key={roll} value={roll}>
                                  {systemRollLabel[roll]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {spararRoll === profil.id && <Spinner data-icon="inline-end" />}
                        </div>
                        {profil.id === anvandare?.id && (
                          <span className="mt-1 block text-[11px] text-muted-foreground">
                            Din egen roll ändras inte här.
                          </span>
                        )}
                      </Faltrad>
                      <Faltrad etikett="Uppdaterad">{formateraDatumTid(profil.uppdaterad)}</Faltrad>
                      <Faltrad etikett="Skapad">{formateraDatumTid(profil.skapad)}</Faltrad>
                    </dl>
                  </li>
                )
              })}
            </ul>
          )}
        </Yta>
      ) : (
        <Yta className="flex items-start gap-3 p-3.5">
          <ShieldCheckIcon className="mt-0.5 size-4 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            <Sektionsrubrik>System</Sektionsrubrik>
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Systeminställningar visas endast för administratörer.
            </p>
          </div>
        </Yta>
      )}
    </div>
  )
}
