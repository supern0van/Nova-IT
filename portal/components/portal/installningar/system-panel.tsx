'use client'

import {
  CheckCircle2Icon,
  KeyRoundIcon,
  MailPlusIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  ShieldIcon,
  TriangleAlertIcon,
  UserRoundIcon,
  XCircleIcon,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { Faltrad, Sektionsrubrik, Yta } from '@/components/portal/ui-delar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import {
  hamtaLosenordsAterstallningFranApiSvar,
  hamtaMfaAterstallningFranApiSvar,
  hamtaProfilFranApiSvar,
  hamtaProfilerFranApiSvar,
  hamtaSystemStatusFranApiSvar,
  type ProfilRad,
  type SystemStatusNiva,
  type SystemStatusSvar,
} from '@/lib/admin/admin-api-svar'
import { systemRoller, type SystemRoll } from '@/lib/auth/roll'
import { formateraDatumTid, systemRollLabel } from '@/lib/labels'
import { cn } from '@/lib/utils'

type ProfilStatus =
  | { status: 'laddar'; profiler: ProfilRad[] }
  | { status: 'klar'; profiler: ProfilRad[] }
  | { status: 'nekad'; profiler: ProfilRad[] }
  | { status: 'fel'; profiler: ProfilRad[] }

type DriftStatus =
  | { status: 'laddar'; drift: SystemStatusSvar | null }
  | { status: 'klar'; drift: SystemStatusSvar }
  | { status: 'nekad'; drift: null }
  | { status: 'fel'; drift: null }

const driftStatusLabel: Record<SystemStatusNiva, string> = {
  ok: 'OK',
  varning: 'Varning',
  fel: 'Fel',
}

const driftStatusStil: Record<SystemStatusNiva, string> = {
  ok: 'bg-success/10 text-success',
  varning: 'bg-warning/10 text-warning',
  fel: 'bg-destructive/10 text-destructive',
}

const kontoStatusStil = {
  ok: 'bg-success/10 text-success',
  varning: 'bg-warning/10 text-warning',
  okand: 'bg-muted text-muted-foreground',
} as const

function DriftIkon({ status }: { status: SystemStatusNiva }) {
  if (status === 'ok') return <CheckCircle2Icon className="size-3.5" />
  if (status === 'varning') return <TriangleAlertIcon className="size-3.5" />
  return <XCircleIcon className="size-3.5" />
}

function sorteraProfiler(profiler: ProfilRad[]) {
  return [...profiler].sort((a, b) => a.epost.localeCompare(b.epost, 'sv'))
}

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
  const [driftStatus, setDriftStatus] = useState<DriftStatus>({
    status: 'laddar',
    drift: null,
  })
  const [spararRoll, setSpararRoll] = useState<string | null>(null)
  const [visarInbjudan, setVisarInbjudan] = useState(false)
  const [nyttNamn, setNyttNamn] = useState('')
  const [nyEpost, setNyEpost] = useState('')
  const [nyRoll, setNyRoll] = useState<SystemRoll>('medarbetare')
  const [bjuderIn, setBjuderIn] = useState(false)
  const [spararNamn, setSpararNamn] = useState<string | null>(null)
  const [namnUtkast, setNamnUtkast] = useState<Record<string, string>>({})
  const [aterstallerMfa, setAterstallerMfa] = useState<string | null>(null)
  const [skickarLosenord, setSkickarLosenord] = useState<string | null>(null)
  const [uppdaterar, setUppdaterar] = useState(false)
  const [senastUppdaterad, setSenastUppdaterad] = useState<string | null>(null)

  const hamtaAdminStatus = useCallback(async (signal?: AbortSignal) => {
    if (!kanSePersonal) {
      setProfilStatus({ status: 'nekad', profiler: [] })
      setDriftStatus({ status: 'nekad', drift: null })
      return
    }

    setProfilStatus({ status: 'laddar', profiler: [] })
    setDriftStatus({ status: 'laddar', drift: null })

    try {
      const [profilerSvar, driftSvar] = await Promise.all([
        fetch('/api/admin/profiler', { signal }),
        fetch('/api/admin/systemstatus', { signal }),
      ])

      const nästaProfilStatus: ProfilStatus = await (async () => {
        if (profilerSvar.status === 401 || profilerSvar.status === 403) {
          return { status: 'nekad', profiler: [] }
        }
        if (!profilerSvar.ok) return { status: 'fel' as const, profiler: [] }
        const profiler = hamtaProfilerFranApiSvar(await profilerSvar.json())
        if (!profiler) return { status: 'fel' as const, profiler: [] }
        return { status: 'klar' as const, profiler }
      })()

      const nästaDriftStatus: DriftStatus = await (async () => {
        if (driftSvar.status === 401 || driftSvar.status === 403) {
          return { status: 'nekad', drift: null }
        }
        if (!driftSvar.ok) return { status: 'fel' as const, drift: null }
        const drift = hamtaSystemStatusFranApiSvar(await driftSvar.json())
        if (!drift) return { status: 'fel' as const, drift: null }
        return { status: 'klar' as const, drift }
      })()

      setProfilStatus(nästaProfilStatus)
      setDriftStatus(nästaDriftStatus)
      setSenastUppdaterad(new Date().toISOString())
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setProfilStatus({ status: 'fel', profiler: [] })
      setDriftStatus({ status: 'fel', drift: null })
    }
  }, [kanSePersonal])

  useEffect(() => {
    const controller = new AbortController()
    void hamtaAdminStatus(controller.signal)

    return () => {
      controller.abort()
    }
  }, [hamtaAdminStatus])

  async function uppdateraAdminStatus() {
    if (uppdaterar) return
    setUppdaterar(true)
    try {
      await hamtaAdminStatus()
      toast.success('Adminstatus uppdaterad', {
        description: 'Profiler och driftkontroller hämtades om från Worker:n.',
      })
    } finally {
      setUppdaterar(false)
    }
  }

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

      const uppdateradProfil = hamtaProfilFranApiSvar(await svar.json())
      if (!uppdateradProfil) {
        toast.error('Kunde inte ändra systemroll', {
          description: 'API:t svarade utan uppdaterad profil.',
        })
        return
      }

      setProfilStatus((nu) => ({
        ...nu,
        profiler: nu.profiler.map((rad) =>
          rad.id === uppdateradProfil.id ? { ...rad, ...uppdateradProfil } : rad,
        ),
      }))

      toast.success('Systemroll uppdaterad', {
        description: `${uppdateradProfil.epost} är nu ${systemRollLabel[uppdateradProfil.roll].toLowerCase()}.`,
      })
    } catch {
      toast.error('Kunde inte ändra systemroll', {
        description: 'Nätverket eller Worker-svaret avbröts.',
      })
    } finally {
      setSpararRoll(null)
    }
  }

  async function uppdateraPortalkontoNamn(profil: ProfilRad) {
    if (spararNamn) return

    const namn = (namnUtkast[profil.id] ?? profil.namn).trim()
    if (namn.length < 2 || namn.length > 120) {
      toast.error('Namnet kan inte sparas', {
        description: 'Ange ett namn mellan 2 och 120 tecken.',
      })
      return
    }

    if (namn === profil.namn.trim()) return

    setSpararNamn(profil.id)

    try {
      const svar = await fetch(`/api/admin/profiler/${profil.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namn }),
      })

      if (!svar.ok) {
        toast.error('Kunde inte uppdatera namn', {
          description: 'Kontrollera att sessionen fortfarande är AAL2-verifierad och försök igen.',
        })
        return
      }

      const uppdateradProfil = hamtaProfilFranApiSvar(await svar.json())
      if (!uppdateradProfil) {
        toast.error('Kunde inte uppdatera namn', {
          description: 'API:t svarade utan uppdaterad profil.',
        })
        return
      }

      setProfilStatus((nu) => ({
        ...nu,
        profiler: nu.profiler.map((rad) =>
          rad.id === uppdateradProfil.id ? { ...rad, ...uppdateradProfil } : rad,
        ),
      }))
      setNamnUtkast((nu) => {
        const kopia = { ...nu }
        delete kopia[profil.id]
        return kopia
      })

      toast.success('Namn uppdaterat', {
        description: `${uppdateradProfil.epost} visas nu som ${uppdateradProfil.namn}.`,
      })
    } catch {
      toast.error('Kunde inte uppdatera namn', {
        description: 'Nätverket eller Worker-svaret avbröts.',
      })
    } finally {
      setSpararNamn(null)
    }
  }

  async function bjudInPortalkonto() {
    if (bjuderIn) return

    const namn = nyttNamn.trim()
    const epost = nyEpost.trim().toLowerCase()
    if (namn.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(epost)) {
      toast.error('Kontot kan inte bjudas in ännu', {
        description: 'Ange minst två tecken i namn och en giltig e-postadress.',
      })
      return
    }

    setBjuderIn(true)

    try {
      const svar = await fetch('/api/admin/profiler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ namn, epost, roll: nyRoll }),
      })

      if (!svar.ok) {
        const beskrivning =
          svar.status === 409
            ? 'Det finns redan ett portalkonto med den e-postadressen.'
            : svar.status === 400
              ? 'Kontrollera namn, e-postadress och systemroll.'
              : 'Kontrollera att sessionen fortfarande är AAL2-verifierad och försök igen.'
        toast.error('Kunde inte bjuda in portalkonto', { description: beskrivning })
        return
      }

      const profil = hamtaProfilFranApiSvar(await svar.json())
      if (!profil) {
        toast.error('Kunde inte bjuda in portalkonto', {
          description: 'API:t svarade utan skapad profil.',
        })
        return
      }

      setProfilStatus((nu) => ({
        ...nu,
        status: 'klar',
        profiler: sorteraProfiler([
          profil,
          ...nu.profiler.filter((rad) => rad.id !== profil.id),
        ]),
      }))
      setNyttNamn('')
      setNyEpost('')
      setNyRoll('medarbetare')
      setVisarInbjudan(false)

      toast.success('Portalkonto inbjudet', {
        description: `${profil.epost} har fått en Supabase-inbjudan.`,
      })
    } catch {
      toast.error('Kunde inte bjuda in portalkonto', {
        description: 'Nätverket eller Worker-svaret avbröts.',
      })
    } finally {
      setBjuderIn(false)
    }
  }

  async function aterstallMfa(profil: ProfilRad) {
    if (aterstallerMfa) return

    setAterstallerMfa(profil.id)

    try {
      const svar = await fetch('/api/mfa/aterstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epost: profil.epost }),
      })
      const data = hamtaMfaAterstallningFranApiSvar(await svar.json())

      if (!data) {
        toast.error('Kunde inte återställa MFA', {
          description: 'API:t svarade med ett oväntat format.',
        })
        return
      }

      if (!svar.ok || !data.ok) {
        toast.error('Kunde inte återställa MFA', {
          description: data.fel ?? 'Kontrollera att sessionen fortfarande är AAL2-verifierad.',
        })
        return
      }

      setProfilStatus((nu) => ({
        ...nu,
        profiler: nu.profiler.map((rad) =>
          rad.id === profil.id
            ? {
                ...rad,
                kontoHalsa: rad.kontoHalsa
                  ? {
                      ...rad.kontoHalsa,
                      mfaAntalFaktorer: 0,
                      mfaVerifieradeFaktorer: 0,
                    }
                  : rad.kontoHalsa,
              }
            : rad,
        ),
      }))

      toast.success('MFA återställd', {
        description: `${data.antalBorttagnaFaktorer ?? 0} enhet(er) togs bort för ${profil.epost}.`,
      })
    } catch {
      toast.error('Kunde inte återställa MFA', {
        description: 'Nätverket eller Worker-svaret avbröts.',
      })
    } finally {
      setAterstallerMfa(null)
    }
  }

  async function skickaLosenordsaterstallning(profil: ProfilRad) {
    if (skickarLosenord) return

    setSkickarLosenord(profil.id)

    try {
      const svar = await fetch(`/api/admin/profiler/${profil.id}/losenord`, {
        method: 'POST',
      })
      const data = hamtaLosenordsAterstallningFranApiSvar(await svar.json())

      if (!data) {
        toast.error('Kunde inte skicka lösenordslänk', {
          description: 'API:t svarade med ett oväntat format.',
        })
        return
      }

      if (!svar.ok || !data.ok) {
        toast.error('Kunde inte skicka lösenordslänk', {
          description: data.fel ?? 'Kontrollera att sessionen fortfarande är AAL2-verifierad.',
        })
        return
      }

      toast.success('Lösenordslänk skickad', {
        description: `Supabase skickade en återställningslänk till ${data.epost ?? profil.epost}.`,
      })
    } catch {
      toast.error('Kunde inte skicka lösenordslänk', {
        description: 'Nätverket eller Worker-svaret avbröts.',
      })
    } finally {
      setSkickarLosenord(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {kanSePersonal ? (
        <>
          <Yta className="flex flex-col gap-4 p-3.5">
            <Sektionsrubrik
              atgard={
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void uppdateraAdminStatus()}
                  disabled={
                    uppdaterar ||
                    profilStatus.status === 'laddar' ||
                    driftStatus.status === 'laddar'
                  }
                >
                  {uppdaterar ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <RefreshCwIcon data-icon="inline-start" />
                  )}
                  Uppdatera
                </Button>
              }
            >
              Driftstatus
            </Sektionsrubrik>

            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Kontrollerna körs server-side i Worker:n och visar om de obligatoriska
              Supabase-inställningarna och profiles-tabellen är tillgängliga.
              {senastUppdaterad ? (
                <>
                  {' '}
                  Senast uppdaterad {formateraDatumTid(senastUppdaterad)}.
                </>
              ) : null}
            </p>

            {driftStatus.status === 'laddar' && (
              <div className="flex items-center gap-2 rounded-lg bg-surface-emphasis p-3 text-[13px] text-muted-foreground">
                <Spinner data-icon="inline-start" />
                Kontrollerar Worker och Supabase…
              </div>
            )}

            {driftStatus.status === 'fel' && (
              <div className="rounded-lg bg-destructive/10 p-3 text-[13px] text-destructive">
                Systemstatus kunde inte hämtas just nu.
              </div>
            )}

            {driftStatus.status === 'nekad' && (
              <div className="rounded-lg bg-warning/10 p-3 text-[13px] text-warning">
                Systemstatus visas endast när sessionen är AAL2-verifierad och har
                administratörsbehörighet.
              </div>
            )}

            {driftStatus.status === 'klar' && (
              <ul className="grid gap-1.5 md:grid-cols-2">
                {driftStatus.drift.kontroller.map((kontroll) => (
                  <li key={kontroll.id} className="rounded-lg bg-surface-emphasis p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="text-[13px] font-medium">{kontroll.namn}</p>
                        <p className="text-pretty text-[12px] leading-relaxed text-muted-foreground">
                          {kontroll.beskrivning}
                        </p>
                      </div>
                      <Badge
                        variant="ghost"
                        className={cn('shrink-0', driftStatusStil[kontroll.status])}
                      >
                        <DriftIkon status={kontroll.status} />
                        {driftStatusLabel[kontroll.status]}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Yta>

          <Yta className="flex flex-col gap-4 p-3.5">
            <Sektionsrubrik
              antal={profilStatus.profiler.length}
              atgard={
                <Button
                  type="button"
                  size="sm"
                  variant={visarInbjudan ? 'secondary' : 'outline'}
                  onClick={() => setVisarInbjudan((visas) => !visas)}
                >
                  <MailPlusIcon data-icon="inline-start" />
                  Bjud in konto
                </Button>
              }
            >
              Portalkonton
            </Sektionsrubrik>

            <p className="text-[12px] leading-relaxed text-muted-foreground">
              Konton och systemroller läses från Supabase-tabellen profiles. Systemroller kan
              ändras här och skyddas server-side med AAL2-session samt administratörsroll.
            </p>

            {visarInbjudan && (
              <div className="grid gap-3 rounded-lg border border-border bg-card p-3 md:grid-cols-[1fr_1fr_auto]">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nytt-portalkonto-namn" className="text-[12px]">
                    Namn
                  </Label>
                  <Input
                    id="nytt-portalkonto-namn"
                    value={nyttNamn}
                    onChange={(event) => setNyttNamn(event.target.value)}
                    placeholder="Ex. Anna Andersson"
                    disabled={bjuderIn}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nytt-portalkonto-epost" className="text-[12px]">
                    E-post
                  </Label>
                  <Input
                    id="nytt-portalkonto-epost"
                    type="email"
                    value={nyEpost}
                    onChange={(event) => setNyEpost(event.target.value)}
                    placeholder="namn@nova-it.se"
                    disabled={bjuderIn}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nytt-portalkonto-roll" className="text-[12px]">
                    Systemroll
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={nyRoll}
                      onValueChange={(roll) => setNyRoll(roll as SystemRoll)}
                      disabled={bjuderIn}
                    >
                      <SelectTrigger
                        id="nytt-portalkonto-roll"
                        className="min-w-36 bg-background text-[13px]"
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
                    <Button type="button" onClick={() => void bjudInPortalkonto()} disabled={bjuderIn}>
                      {bjuderIn ? <Spinner data-icon="inline-start" /> : null}
                      Skicka
                    </Button>
                  </div>
                </div>
              </div>
            )}

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

            {profilStatus.status === 'nekad' && (
              <div className="rounded-lg bg-warning/10 p-3 text-[13px] text-warning">
                Portalkonton visas endast när sessionen är AAL2-verifierad och har
                administratörsbehörighet.
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
                  const kontoStatus =
                    profil.kontoHalsa?.epostBekraftad === true
                      ? 'ok'
                      : profil.kontoHalsa?.epostBekraftad === false
                        ? 'varning'
                        : 'okand'
                  const kontoStatusText =
                    kontoStatus === 'ok'
                      ? 'E-post bekräftad'
                      : kontoStatus === 'varning'
                        ? 'E-post ej bekräftad'
                        : 'Auth-status okänd'
                  const mfaAntal = profil.kontoHalsa?.mfaAntalFaktorer
                  const mfaVerifierade = profil.kontoHalsa?.mfaVerifieradeFaktorer
                  const mfaStatus =
                    typeof mfaVerifierade === 'number'
                      ? mfaVerifierade > 0
                        ? 'ok'
                        : 'varning'
                      : 'okand'
                  const mfaText =
                    mfaStatus === 'ok'
                      ? `${mfaVerifierade} verifierad MFA`
                      : mfaStatus === 'varning'
                        ? 'MFA saknas'
                        : 'MFA okänd'
                  const kanAterstallaMfa =
                    profil.id !== anvandare?.id &&
                    typeof mfaVerifierade === 'number' &&
                    mfaVerifierade > 0
                  const initialer = namn
                    .split(/\s+/)
                    .map((del) => del[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()
                  const namnVarde = namnUtkast[profil.id] ?? profil.namn
                  const namnKanSparas =
                    namnVarde.trim().length >= 2 &&
                    namnVarde.trim().length <= 120 &&
                    namnVarde.trim() !== profil.namn.trim()

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
                          <p className="truncate text-[12px] text-muted-foreground">
                            {profil.epost}
                          </p>
                        </div>
                      </div>

                      <dl className="flex flex-wrap items-start gap-x-8 gap-y-2">
                        <Faltrad etikett="Namn">
                          <div className="flex items-center gap-2">
                            <Input
                              value={namnVarde}
                              onChange={(event) =>
                                setNamnUtkast((nu) => ({
                                  ...nu,
                                  [profil.id]: event.target.value,
                                }))
                              }
                              className="w-44 bg-card text-[13px]"
                              aria-label={`Ändra namn för ${profil.epost}`}
                              disabled={spararNamn !== null}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void uppdateraPortalkontoNamn(profil)}
                              disabled={spararNamn !== null || !namnKanSparas}
                            >
                              {spararNamn === profil.id ? <Spinner data-icon="inline-start" /> : null}
                              Spara
                            </Button>
                          </div>
                        </Faltrad>
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
                        <Faltrad etikett="Kontostatus">
                          <Badge
                            variant="ghost"
                            className={cn('w-fit', kontoStatusStil[kontoStatus])}
                          >
                            {kontoStatus === 'ok' ? (
                              <CheckCircle2Icon className="size-3.5" />
                            ) : kontoStatus === 'varning' ? (
                              <TriangleAlertIcon className="size-3.5" />
                            ) : (
                              <XCircleIcon className="size-3.5" />
                            )}
                            {kontoStatusText}
                          </Badge>
                        </Faltrad>
                        <Faltrad etikett="Lösenord">
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={skickarLosenord !== null}
                                >
                                  {skickarLosenord === profil.id ? (
                                    <Spinner data-icon="inline-start" />
                                  ) : (
                                    <KeyRoundIcon data-icon="inline-start" />
                                  )}
                                  Skicka länk
                                </Button>
                              }
                            />
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Skicka lösenordsåterställning?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Supabase skickar en återställningslänk till {profil.epost}.
                                  Användaren landar på portalens lösenordsform och behöver sedan logga
                                  in med MFA enligt det vanliga skyddet.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => void skickaLosenordsaterstallning(profil)}
                                >
                                  Skicka länk
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </Faltrad>
                        <Faltrad etikett="MFA">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="ghost" className={cn('w-fit', kontoStatusStil[mfaStatus])}>
                              {mfaStatus === 'ok' ? (
                                <CheckCircle2Icon className="size-3.5" />
                              ) : mfaStatus === 'varning' ? (
                                <TriangleAlertIcon className="size-3.5" />
                              ) : (
                                <XCircleIcon className="size-3.5" />
                              )}
                              {mfaText}
                            </Badge>
                            <AlertDialog>
                              <AlertDialogTrigger
                                render={
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    disabled={!kanAterstallaMfa || aterstallerMfa !== null}
                                  >
                                    {aterstallerMfa === profil.id ? (
                                      <Spinner data-icon="inline-start" />
                                    ) : null}
                                    Återställ
                                  </Button>
                                }
                              />
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Återställ MFA för {profil.epost}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Alla registrerade autentiseringsenheter tas bort för kontot.
                                    Användaren behöver sätta upp tvåstegsverifiering igen vid nästa
                                    inloggning. Din egen MFA kan inte återställas här.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                  <AlertDialogAction
                                    variant="destructive"
                                    onClick={() => void aterstallMfa(profil)}
                                  >
                                    Återställ MFA
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                          {typeof mfaAntal === 'number' && mfaAntal !== mfaVerifierade && (
                            <span className="mt-1 block text-[11px] text-muted-foreground">
                              {mfaAntal} faktor(er) totalt
                            </span>
                          )}
                        </Faltrad>
                        <Faltrad etikett="Senast inloggad">
                          {profil.kontoHalsa?.senastInloggad
                            ? formateraDatumTid(profil.kontoHalsa.senastInloggad)
                            : 'Ingen uppgift'}
                        </Faltrad>
                        <Faltrad etikett="Uppdaterad">
                          {formateraDatumTid(profil.uppdaterad)}
                        </Faltrad>
                        <Faltrad etikett="Skapad">{formateraDatumTid(profil.skapad)}</Faltrad>
                      </dl>
                    </li>
                  )
                })}
              </ul>
            )}
          </Yta>
        </>
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
