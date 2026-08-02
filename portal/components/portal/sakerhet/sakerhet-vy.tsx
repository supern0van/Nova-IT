'use client'

import { PlusIcon, ShieldAlertIcon, ShieldCheckIcon, SmartphoneIcon, Trash2Icon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { Sida, Sidhuvud, Yta } from '@/components/portal/ui-delar'
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
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { arAdministrator } from '@/lib/auth/roll'
import {
  avbrytEnrollment,
  avregistreraFaktor,
  listaTotpFaktorer,
  paborjaEnrollment,
  utmanaOchVerifieraKod,
  visningsnamnForFaktor,
  type EnrollmentStart,
  type TotpFaktor,
} from '@/lib/auth/mfa-klient'
import { skapaSupabaseWebblasarklient } from '@/lib/supabase/client'

/** Förslag på namn för en ny enhet som läggs till under Säkerhet – alltid en
 * BACKUP-/tilläggsenhet i praktiken, eftersom `/portal/*` (och därmed den
 * här sidan) aldrig nås innan en första, obligatorisk primärenhet redan är
 * verifierad (se `lib/supabase/proxy.ts`). */
const FORSLAG_NAMN_NY_ENHET = 'Backup-enhet'

/**
 * Säkerhetssidan i portalen: självbetjänad hantering av tvåstegsverifiering
 * (TOTP) samt, för systemroll-administratörer, ett MFA-återställningsflöde
 * för andra utelåsta användare.
 *
 * Ligger under `/portal/*` och skyddas därmed redan av proxyn
 * (`lib/supabase/proxy.ts`) – sidan renderas aldrig utan en `aal2`-verifierad
 * session, så alla anrop här sker med fullt MFA-verifierade användare.
 */
export function SakerhetVy() {
  const { roll } = useAuth()
  const router = useRouter()
  const [supabase] = useState(() => skapaSupabaseWebblasarklient())
  const [faktorer, setFaktorer] = useState<TotpFaktor[] | null>(null)
  const [laddar, setLaddar] = useState(true)
  const [visaLaggTill, setVisaLaggTill] = useState(false)

  async function laddaOm() {
    setLaddar(true)
    const resultat = await listaTotpFaktorer(supabase)
    setFaktorer(Array.isArray(resultat) ? resultat : [])
    setLaddar(false)
  }

  useEffect(() => {
    laddaOm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const verifierade = faktorer?.filter((f) => f.status === 'verified') ?? []

  return (
    <Sida>
      <Sidhuvud
        rubrik="Säkerhet"
        beskrivning="Nova IT kräver tvåstegsverifiering (TOTP) för alla portalkonton. Hantera dina autentiseringsenheter här."
      />

      <Yta className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheckIcon className="size-4.5 text-primary" />
            <h2 className="text-sm font-semibold">Autentiseringsenheter</h2>
          </div>
          {!visaLaggTill && (
            <Button size="sm" variant="outline" onClick={() => setVisaLaggTill(true)}>
              <PlusIcon data-icon="inline-start" />
              Lägg till enhet
            </Button>
          )}
        </div>

        {laddar ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {verifierade.length === 0 && (
              <p className="rounded-lg bg-surface-emphasis px-3.5 py-3 text-[13px] text-text-secondary">
                Inga verifierade enheter hittades. Logga ut och in igen för att slutföra
                den obligatoriska konfigurationen.
              </p>
            )}
            {verifierade.map((faktor, index) => (
              <FaktorRad
                key={faktor.id}
                faktor={faktor}
                index={index}
                supabase={supabase}
                vidBorttagen={laddaOm}
                vidMfaKrav={() => router.replace('/mfa')}
              />
            ))}
          </div>
        )}

        {verifierade.length === 1 && !laddar && (
          <div className="flex items-start gap-2.5 rounded-lg bg-warning/10 px-3.5 py-3">
            <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-[13px] leading-relaxed text-text-secondary">
              Du har bara en enhet registrerad. Vi rekommenderar att du lägger till en
              backup-enhet (t.ex. på en annan telefon), så att du inte riskerar att låsas ute
              om du tappar bort den här. Utan en backup-enhet krävs hjälp av en administratör om
              du förlorar åtkomst till din autentiseringsapp.
            </p>
          </div>
        )}

        {visaLaggTill && (
          <LaggTillEnhet
            supabase={supabase}
            vidKlar={() => {
              setVisaLaggTill(false)
              laddaOm()
            }}
            vidAvbryt={() => setVisaLaggTill(false)}
          />
        )}
      </Yta>

      {arAdministrator(roll) && <AdminAterstallning />}
    </Sida>
  )
}

function FaktorRad({
  faktor,
  index,
  supabase,
  vidBorttagen,
  vidMfaKrav,
}: {
  faktor: TotpFaktor
  index: number
  supabase: ReturnType<typeof skapaSupabaseWebblasarklient>
  vidBorttagen: () => void
  vidMfaKrav: () => void
}) {
  const [tarBort, setTarBort] = useState(false)

  async function taBort() {
    setTarBort(true)
    try {
      const resultat = await avregistreraFaktor(supabase, faktor.id)
      if (!resultat.ok) {
        if (resultat.mfaKravd) {
          vidMfaKrav()
          return
        }
        toast.error(resultat.fel)
        return
      }
      toast.success('Enheten togs bort.')
      vidBorttagen()
    } finally {
      setTarBort(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-emphasis px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        <SmartphoneIcon className="size-4 shrink-0 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-[13px] font-medium">{visningsnamnForFaktor(faktor, index)}</span>
          <span className="text-xs text-muted-foreground">
            Tillagd {new Date(faktor.skapad).toLocaleDateString('sv-SE')}
          </span>
        </div>
      </div>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button size="sm" variant="ghost" disabled={tarBort}>
              {tarBort ? <Spinner /> : <Trash2Icon />}
            </Button>
          }
        />
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort enheten?</AlertDialogTitle>
            <AlertDialogDescription>
              Du kommer inte längre kunna använda den här enheten för att logga in. Om det är
              din enda registrerade enhet behöver du sätta upp tvåstegsverifiering igen vid
              nästa inloggning.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={taBort}>
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/**
 * Kompakt inline-variant av enrollment-flödet, för att lägga till en
 * backup-/tilläggsenhet. Två steg:
 *   1. Namnge enheten (`friendlyName` skickas till Supabase vid enroll –
 *      annars går flera enheter inte att skilja åt i listan ovan eller i
 *      faktorväljaren vid inloggning, se `mfa-vy.tsx`).
 *   2. Skanna QR-koden och ange en kod för att aktivera den.
 *
 * En overifierad faktor får ALDRIG bli kvar skräpandes: `unenroll()` (via
 * `avbrytEnrollment()`) anropas både när användaren aktivt klickar
 * "Avbryt", OCH som ett säkerhetsnät om komponenten avmonteras på något
 * annat sätt (t.ex. att föräldern stänger panelen, eller användaren
 * navigerar bort) innan verifieringen slutförts.
 */
export function LaggTillEnhet({
  supabase,
  vidKlar,
  vidAvbryt,
}: {
  supabase: ReturnType<typeof skapaSupabaseWebblasarklient>
  vidKlar: () => void
  vidAvbryt: () => void
}) {
  const [fas, setFas] = useState<'namn' | 'registrerar' | 'kod'>('namn')
  const [namn, setNamn] = useState(FORSLAG_NAMN_NY_ENHET)
  const [start, setStart] = useState<EnrollmentStart | null>(null)
  const [kod, setKod] = useState('')
  const [sparar, setSparar] = useState(false)
  const [avbryterEnrollment, setAvbryterEnrollment] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  // Refs istället för state för städningsbokföringen: de läses/skrivs bara
  // i händelsehanterare och i unmount-effekten nedan – ALDRIG under
  // rendering – så de omfattas inte av (och stör inte) render-cykeln.
  const startRef = useRef<EnrollmentStart | null>(null)
  const stadatRef = useRef(false)
  const aktiveradRef = useRef(false)
  const monteradRef = useRef(true)
  const städningPågårRef = useRef<Promise<{ ok: true } | { ok: false; fel: string }> | null>(null)

  async function städaEnrollment(): Promise<{ ok: true } | { ok: false; fel: string }> {
    const aktuell = startRef.current
    if (!aktuell || aktiveradRef.current || stadatRef.current) return { ok: true }
    if (städningPågårRef.current) return städningPågårRef.current

    const försök = avbrytEnrollment(supabase, aktuell.factorId).then((resultat) => {
      if (resultat.ok) stadatRef.current = true
      return resultat
    })
    städningPågårRef.current = försök
    try {
      return await försök
    } finally {
      if (städningPågårRef.current === försök) städningPågårRef.current = null
    }
  }

  useEffect(() => {
    startRef.current = start
  }, [start])

  // Säkerhetsnät: om vyn försvinner (avmonteras) på NÅGOT annat sätt än att
  // användaren klickar "Avbryt" – t.ex. att panelen stängs programmatiskt,
  // eller användaren navigerar bort mitt i flödet – innan enrollment
  // slutförts, städa ändå bort den overifierade faktorn. Kan inte visa ett
  // felmeddelande här (komponenten är redan borta), men försöket görs alltid
  // och är av samma skäl markerat i koden nedan för felsökning.
  useEffect(() => {
    return () => {
      monteradRef.current = false
      void städaEnrollment().then((resultat) => {
        if (!resultat.ok) console.error('Kunde inte städa bort overifierad MFA-faktor vid avmontering:', resultat.fel)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startaRegistrering(e: React.FormEvent) {
    e.preventDefault()
    if (!namn.trim()) {
      setFel('Ange ett namn för enheten, t.ex. "Jobbtelefon" eller "Reservdator".')
      return
    }
    setFel(null)
    setFas('registrerar')
    const resultat = await paborjaEnrollment(supabase, namn.trim())
    if (!resultat.ok) {
      if (!monteradRef.current) return
      setFel(resultat.fel)
      setFas('namn')
      return
    }
    // Om komponenten avmonterades medan enroll-anropet väntade finns faktorn
    // ändå skapad i Supabase och måste tas bort med det sena id:t.
    if (!monteradRef.current) {
      await avbrytEnrollment(supabase, resultat.factorId)
      return
    }
    startRef.current = resultat
    setStart(resultat)
    setFas('kod')
  }

  async function aktivera(e: React.FormEvent) {
    e.preventDefault()
    if (!start) return
    setFel(null)
    setSparar(true)
    try {
      const resultat = await utmanaOchVerifieraKod(supabase, start.factorId, kod.trim())
      if (!resultat.ok) {
        setFel(resultat.fel)
        return
      }
      aktiveradRef.current = true
      toast.success('Ny enhet aktiverad.')
      vidKlar()
    } finally {
      setSparar(false)
    }
  }

  async function avbryt() {
    setAvbryterEnrollment(true)
    try {
      if (start) {
        const resultat = await städaEnrollment()
        if (!resultat.ok) {
          toast.error(resultat.fel)
          return
        }
      }
      vidAvbryt()
    } finally {
      setAvbryterEnrollment(false)
    }
  }

  if (fas === 'namn') {
    return (
      <form
        onSubmit={startaRegistrering}
        className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4"
      >
        <Field data-invalid={fel ? true : undefined}>
          <FieldLabel htmlFor="ny-enhet-namn">Namn på enheten</FieldLabel>
          <Input
            id="ny-enhet-namn"
            placeholder="T.ex. Jobbtelefon eller Reservdator"
            value={namn}
            autoFocus
            onChange={(e) => {
              setNamn(e.target.value)
              setFel(null)
            }}
          />
        </Field>
        {fel && <p className="text-[13px] text-destructive">{fel}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm">
            Fortsätt
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={vidAvbryt}>
            Avbryt
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4">
      {fas === 'registrerar' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          Skapar QR-kod…
        </div>
      )}

      {fas === 'kod' && start && (
        <form onSubmit={aktivera} className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase returnerar en dataURL-SVG */}
          <img
            src={start.qrKodDataUrl}
            alt={`QR-kod för enheten "${namn.trim()}"`}
            className="size-32 shrink-0 rounded-lg bg-white p-2"
          />
          <FieldGroup className="flex-1">
            <Field data-invalid={fel ? true : undefined}>
              <FieldLabel htmlFor="ny-enhet-kod">Kod från autentiseringsappen</FieldLabel>
              <Input
                id="ny-enhet-kod"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={kod}
                onChange={(e) => {
                  setKod(e.target.value)
                  setFel(null)
                }}
              />
            </Field>
            {fel && <p className="text-[13px] text-destructive">{fel}</p>}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={sparar || avbryterEnrollment}>
                {sparar && <Spinner data-icon="inline-start" />}
                Aktivera
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={sparar || avbryterEnrollment}
                onClick={avbryt}
              >
                {avbryterEnrollment ? 'Avbryter…' : 'Avbryt'}
              </Button>
            </div>
          </FieldGroup>
        </form>
      )}
    </div>
  )
}

/**
 * Endast synlig för `SystemRoll === 'administrator'` (se `lib/auth/roll.ts`).
 * Anropar `/api/mfa/aterstall`, som gör HELA auktorisationskontrollen om
 * igen på servern – den här komponenten är bara UI:t, inte säkerhetsgränsen.
 */
function AdminAterstallning() {
  const [epost, setEpost] = useState('')
  const [skickar, setSkickar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  async function skicka(e: React.FormEvent) {
    e.preventDefault()
    setFel(null)
    setSkickar(true)
    try {
      const svar = await fetch('/api/mfa/aterstall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epost: epost.trim() }),
      })
      const data = (await svar.json()) as { ok: boolean; fel?: string; antalBorttagnaFaktorer?: number }
      if (!svar.ok || !data.ok) {
        setFel(data.fel ?? 'Kunde inte återställa tvåstegsverifieringen.')
        return
      }
      toast.success(`Tvåstegsverifiering återställd för ${epost.trim()}.`)
      setEpost('')
    } catch {
      setFel('Kunde inte nå servern. Försök igen.')
    } finally {
      setSkickar(false)
    }
  }

  return (
    <Yta className="flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-center gap-2.5">
        <ShieldAlertIcon className="size-4.5 text-primary" />
        <h2 className="text-sm font-semibold">Återställ tvåstegsverifiering för en användare</h2>
      </div>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        Administratörsverktyg för utelåsta användare (t.ex. som tappat bort sin
        autentiseringsapp och saknar backup-enhet). Tar bort samtliga registrerade enheter för
        kontot – användaren måste sätta upp tvåstegsverifiering på nytt vid nästa inloggning.
      </p>
      <form onSubmit={skicka} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field className="flex-1" data-invalid={fel ? true : undefined}>
          <FieldLabel htmlFor="aterstall-epost">Användarens e-postadress</FieldLabel>
          <Input
            id="aterstall-epost"
            type="email"
            placeholder="namn@nova-it.se"
            value={epost}
            onChange={(e) => {
              setEpost(e.target.value)
              setFel(null)
            }}
          />
        </Field>
        <Button type="submit" variant="destructive" disabled={skickar || !epost.trim()}>
          {skickar && <Spinner data-icon="inline-start" />}
          Återställ
        </Button>
      </form>
      {fel && <p className="text-[13px] text-destructive">{fel}</p>}
    </Yta>
  )
}
