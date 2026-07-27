'use client'

import {
  ArrowLeftIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
  ShieldQuestionIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { NovaMark } from '@/components/nova-mark'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { authAdapter } from '@/lib/auth/supabase-auth'
import {
  avbrytEnrollment,
  hamtaAssuransniva,
  listaTotpFaktorer,
  paborjaEnrollment,
  utmanaOchVerifieraKod,
  visningsnamnForFaktor,
  type EnrollmentStart,
  type TotpFaktor,
} from '@/lib/auth/mfa-klient'
import { sakerOmdirigeringsSokvag } from '@/lib/auth/sakerOmdirigering'
import { skapaSupabaseWebblasarklient } from '@/lib/supabase/client'

const STANDARDVAG_EFTER_MFA = '/portal'
/** Standardnamn för den FÖRSTA (obligatoriska) enheten en användare sätter upp. */
const STANDARD_NAMN_FORSTA_ENHETEN = 'Primär enhet'

type Lage =
  | { typ: 'laddar' }
  | { typ: 'enroll'; start: EnrollmentStart }
  | { typ: 'verifiera'; faktorer: TotpFaktor[] }
  | { typ: 'fel'; meddelande: string }

/**
 * Obligatorisk MFA/TOTP – enrollment- och verifieringsvy.
 *
 * `/mfa` skyddas redan server-sidan av proxyn (`lib/supabase/proxy.ts`):
 * en oautentiserad besökare hamnar aldrig här, och en redan MFA-verifierad
 * (`aal2`) session skickas vidare därifrån innan den här komponenten ens
 * renderas. Den här komponenten behöver därför bara avgöra EN sak – som
 * Supabases egen dokumentation rekommenderar
 * (https://supabase.com/docs/guides/auth/auth-mfa/totp#add-a-challenge-step-to-login):
 * om användaren ska gå igenom enrollment (inget verifierat TOTP-konto än)
 * eller verifiering (ett verifierat TOTP-konto finns, men just den här
 * sessionen har inte verifierat det än).
 */
export function MfaVy() {
  const router = useRouter()
  const sokParametrar = useSearchParams()
  const [lage, setLage] = useState<Lage>({ typ: 'laddar' })
  const [supabase] = useState(() => skapaSupabaseWebblasarklient())

  useEffect(() => {
    let avbruten = false

    ;(async () => {
      const niva = await hamtaAssuransniva(supabase)
      if (avbruten) return

      if (!niva) {
        setLage({ typ: 'fel', meddelande: 'Kunde inte läsa kontots säkerhetsstatus.' })
        return
      }

      // aal2/aal2: redan verifierad den här sessionen (t.ex. hann bli det
      // mellan proxyns kontroll och att sidan laddades klart i webbläsaren).
      if (niva.currentLevel === 'aal2' && niva.nextLevel === 'aal2') {
        gaVidareEfterMfa()
        return
      }

      // aal1/aal2: minst ett verifierat TOTP-konto finns – den här sessionen
      // behöver bara verifiera det. Om användaren har FLERA verifierade
      // enheter (t.ex. en primär + en backup, se `/portal/sakerhet`) ska
      // hen kunna välja vilken som helst av dem – inte bara den första.
      if (niva.nextLevel === 'aal2') {
        const faktorer = await listaTotpFaktorer(supabase)
        if (avbruten) return
        const verifieradeFaktorer = Array.isArray(faktorer)
          ? faktorer.filter((f) => f.status === 'verified')
          : []
        if (verifieradeFaktorer.length === 0) {
          setLage({ typ: 'fel', meddelande: 'Kunde inte hitta din verifierade autentiseringsapp.' })
          return
        }
        setLage({ typ: 'verifiera', faktorer: verifieradeFaktorer })
        return
      }

      // aal1/aal1: inget TOTP-konto verifierat – påbörja enrollment. Detta
      // är alltid den FÖRSTA obligatoriska enheten (annars hade nextLevel
      // varit aal2 ovan), så den får ett förutsägbart standardnamn direkt –
      // en backup-enhet läggs istället till senare under `/portal/sakerhet`,
      // där användaren själv väljer ett namn (se `LaggTillEnhet` där).
      const start = await paborjaEnrollment(supabase, STANDARD_NAMN_FORSTA_ENHETEN)
      if (avbruten) return
      if (!start.ok) {
        setLage({ typ: 'fel', meddelande: start.fel })
        return
      }
      setLage({ typ: 'enroll', start })
    })()

    return () => {
      avbruten = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function gaVidareEfterMfa() {
    const destination = sakerOmdirigeringsSokvag(sokParametrar.get('next')) ?? STANDARDVAG_EFTER_MFA
    router.replace(destination)
  }

  async function loggaUtOchTillbaka() {
    await authAdapter.loggaUt()
    router.replace('/logga-in')
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center bg-surface px-5 py-10 sm:px-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <NovaMark className="size-9" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">Nova IT</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Adminportal
            </span>
          </div>
        </div>

        {lage.typ === 'laddar' && <LaddarVy />}
        {lage.typ === 'enroll' && (
          <EnrollVy
            start={lage.start}
            vidKlar={gaVidareEfterMfa}
            vidAvbryt={loggaUtOchTillbaka}
            supabase={supabase}
          />
        )}
        {lage.typ === 'verifiera' && (
          <VerifieraVy
            faktorer={lage.faktorer}
            vidKlar={gaVidareEfterMfa}
            vidLoggaUt={loggaUtOchTillbaka}
            supabase={supabase}
          />
        )}
        {lage.typ === 'fel' && <FelVy meddelande={lage.meddelande} vidLoggaUt={loggaUtOchTillbaka} />}
      </div>
    </main>
  )
}

function LaddarVy() {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <Spinner className="size-6" />
      <p className="text-sm text-muted-foreground">Läser in säkerhetsstatus…</p>
    </div>
  )
}

function FelVy({ meddelande, vidLoggaUt }: { meddelande: string; vidLoggaUt: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <span className="flex size-11 items-center justify-center rounded-xl bg-destructive/12">
        <TriangleAlertIcon className="size-5 text-destructive" />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Något gick fel</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{meddelande}</p>
      </div>
      <Button variant="outline" onClick={vidLoggaUt} className="w-full">
        <ArrowLeftIcon data-icon="inline-start" />
        Logga ut och försök igen
      </Button>
    </div>
  )
}

/**
 * Enrollment-vyn. Mönstret följer Supabases officiella React-exempel
 * (enroll → challenge → verify):
 * https://supabase.com/docs/guides/auth/auth-mfa/totp#example-react
 */
function EnrollVy({
  start,
  vidKlar,
  vidAvbryt,
  supabase,
}: {
  start: EnrollmentStart
  vidKlar: () => void
  vidAvbryt: () => void
  supabase: ReturnType<typeof skapaSupabaseWebblasarklient>
}) {
  const [kod, setKod] = useState('')
  const [visaHemlighet, setVisaHemlighet] = useState(false)
  const [aktiverar, setAktiverar] = useState(false)
  const [avbryterEnrollment, setAvbryterEnrollment] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  async function aktivera(e: React.FormEvent) {
    e.preventDefault()
    if (kod.trim().length === 0) {
      setFel('Ange den sexsiffriga koden från din autentiseringsapp.')
      return
    }
    setFel(null)
    setAktiverar(true)
    try {
      const resultat = await utmanaOchVerifieraKod(supabase, start.factorId, kod.trim())
      if (!resultat.ok) {
        setFel(resultat.fel)
        setKod('')
        return
      }
      vidKlar()
    } finally {
      setAktiverar(false)
    }
  }

  async function avbryt() {
    setAvbryterEnrollment(true)
    try {
      const stadning = await avbrytEnrollment(supabase, start.factorId)
      if (!stadning.ok) {
        // Informerar användaren, men blockerar INTE utloggningen – MFA är
        // obligatoriskt, så det finns inget läge där man kan stanna kvar
        // inloggad utan att ha slutfört eller avbrutit enrollment.
        toast.error(stadning.fel)
      }
    } finally {
      setAvbryterEnrollment(false)
      vidAvbryt()
    }
  }

  return (
    <div>
      <header className="flex flex-col gap-1.5">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/12">
          <ShieldCheckIcon className="size-5 text-primary" />
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Sätt upp tvåstegsverifiering</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Nova IT kräver tvåstegsverifiering (TOTP) för alla portalkonton. Skanna QR-koden nedan med
          en autentiseringsapp, t.ex. Google Authenticator eller 1Password.
        </p>
      </header>

      <div className="mt-6 flex justify-center rounded-xl bg-white p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- Supabase returnerar en dataURL-SVG, ingen extern bild */}
        <img src={start.qrKodDataUrl} alt="QR-kod för tvåstegsverifiering" className="size-44" />
      </div>

      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => setVisaHemlighet((v) => !v)}
          className="text-[13px] font-medium text-primary underline-offset-4 hover:underline"
        >
          {visaHemlighet ? 'Dölj hemlighet' : 'Kan du inte skanna koden?'}
        </button>
        {visaHemlighet && (
          <p className="mt-2 break-all rounded-lg bg-surface-emphasis px-3 py-2 font-mono text-xs text-text-secondary">
            {start.hemlighetForManuellInmatning}
          </p>
        )}
      </div>

      <form onSubmit={aktivera} className="mt-6" noValidate>
        <FieldGroup>
          <Field data-invalid={fel ? true : undefined}>
            <FieldLabel htmlFor="mfa-kod">Kod från autentiseringsappen</FieldLabel>
            <Input
              id="mfa-kod"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={10}
              value={kod}
              aria-invalid={fel ? true : undefined}
              onChange={(e) => {
                setKod(e.target.value)
                setFel(null)
              }}
            />
          </Field>

          {fel && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-start gap-2.5 rounded-lg bg-destructive/10 px-3.5 py-3"
            >
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-[13px] leading-relaxed text-text-secondary">{fel}</p>
            </div>
          )}

          <Button type="submit" disabled={aktiverar || avbryterEnrollment} className="w-full">
            {aktiverar && <Spinner data-icon="inline-start" />}
            {aktiverar ? 'Aktiverar…' : 'Aktivera tvåstegsverifiering'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={aktiverar || avbryterEnrollment}
            onClick={avbryt}
            className="w-full"
          >
            {avbryterEnrollment ? 'Avbryter…' : 'Avbryt och logga ut'}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}

/**
 * Verifieringsvyn – visas när kontot redan har minst en verifierad TOTP-faktor
 * men den aktuella sessionen (t.ex. efter en ny inloggning) ännu inte
 * uppnått `aal2`. Om användaren har FLERA verifierade enheter (t.ex. en
 * primär telefon + en backup-enhet, se `/portal/sakerhet`) kan hen välja
 * fritt vilken av dem som ska användas – t.ex. om den vanliga enheten är
 * borttappad. En backup-enhet måste alltså gå att använda även om
 * "förstahandsvalet" saknas.
 */
export function VerifieraVy({
  faktorer,
  vidKlar,
  vidLoggaUt,
  supabase,
}: {
  faktorer: TotpFaktor[]
  vidKlar: () => void
  vidLoggaUt: () => void
  supabase: ReturnType<typeof skapaSupabaseWebblasarklient>
}) {
  const [valdFaktorId, setValdFaktorId] = useState(faktorer[0]?.id ?? '')
  const [kod, setKod] = useState('')
  const [verifierar, setVerifierar] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  async function verifiera(e: React.FormEvent) {
    e.preventDefault()
    if (kod.trim().length === 0) {
      setFel('Ange den sexsiffriga koden från din autentiseringsapp.')
      return
    }
    setFel(null)
    setVerifierar(true)
    try {
      // En ny utmaning skapas vid varje försök, enligt Supabases
      // rekommenderade mönster – en utmaning kan bara verifieras en gång.
      // Utmaningen skapas alltid för den faktor användaren just nu har
      // VALT (`valdFaktorId`), inte automatiskt för den första i listan.
      const resultat = await utmanaOchVerifieraKod(supabase, valdFaktorId, kod.trim())
      if (!resultat.ok) {
        setFel(resultat.fel)
        setKod('')
        return
      }
      vidKlar()
    } finally {
      setVerifierar(false)
    }
  }

  return (
    <div>
      <header className="flex flex-col gap-1.5">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/12">
          <KeyRoundIcon className="size-5 text-primary" />
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Ange verifieringskod</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Öppna din autentiseringsapp och ange den aktuella sexsiffriga koden för att fortsätta till
          portalen.
        </p>
      </header>

      {faktorer.length > 1 && (
        <fieldset className="mt-5 flex flex-col gap-2">
          <legend className="mb-1 text-[13px] font-medium text-text-secondary">Vilken enhet vill du använda?</legend>
          {faktorer.map((faktor, index) => {
            const id = `mfa-faktor-${faktor.id}`
            return (
              <label
                key={faktor.id}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg bg-surface-emphasis px-3.5 py-2.5 text-[13px] has-[:checked]:ring-2 has-[:checked]:ring-ring"
              >
                <input
                  id={id}
                  type="radio"
                  name="mfa-faktor"
                  value={faktor.id}
                  checked={valdFaktorId === faktor.id}
                  onChange={() => {
                    setValdFaktorId(faktor.id)
                    setFel(null)
                  }}
                  className="size-4 accent-primary"
                />
                <span className="font-medium">{visningsnamnForFaktor(faktor, index)}</span>
              </label>
            )
          })}
        </fieldset>
      )}

      <form onSubmit={verifiera} className="mt-6" noValidate>
        <FieldGroup>
          <Field data-invalid={fel ? true : undefined}>
            <FieldLabel htmlFor="mfa-verifieringskod">Verifieringskod</FieldLabel>
            <Input
              id="mfa-verifieringskod"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={10}
              autoFocus
              value={kod}
              aria-invalid={fel ? true : undefined}
              onChange={(e) => {
                setKod(e.target.value)
                setFel(null)
              }}
            />
          </Field>

          {fel && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-start gap-2.5 rounded-lg bg-destructive/10 px-3.5 py-3"
            >
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-[13px] leading-relaxed text-text-secondary">{fel}</p>
            </div>
          )}

          <Button type="submit" disabled={verifierar} className="w-full">
            {verifierar && <Spinner data-icon="inline-start" />}
            {verifierar ? 'Verifierar…' : 'Verifiera'}
          </Button>
        </FieldGroup>
      </form>

      <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-surface-emphasis px-3.5 py-3">
        <ShieldQuestionIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <p className="text-[13px] leading-relaxed text-text-secondary">
            Tappat bort din autentiseringsapp? Kontakta en administratör för att återställa
            tvåstegsverifieringen på ditt konto.
          </p>
          <button
            type="button"
            onClick={vidLoggaUt}
            className="w-fit text-[13px] font-medium text-primary underline-offset-4 hover:underline"
          >
            Logga ut
          </button>
        </div>
      </div>
    </div>
  )
}
