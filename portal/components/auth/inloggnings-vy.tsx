'use client'

import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  HeadsetIcon,
  LockIcon,
  MailIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { NovaMark } from '@/components/nova-mark'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { authAdapter, felmeddelanden, hamtaIhagkommenEpost } from '@/lib/auth/demo-auth'

type Lage = 'inloggning' | 'glomt'

export function InloggningsVy() {
  const router = useRouter()
  const { anvandare, initierar, loggaIn, loggarIn, sessionUtgick, rensaSessionUtgick } = useAuth()

  const [lage, setLage] = useState<Lage>('inloggning')
  const [epost, setEpost] = useState('')
  const [losenord, setLosenord] = useState('')
  const [visaLosenord, setVisaLosenord] = useState(false)
  const [ihagkommen, setIhagkommen] = useState(false)
  const [fel, setFel] = useState<string | null>(null)
  const [faltFel, setFaltFel] = useState<{ epost?: boolean; losenord?: boolean }>({})

  // Redan inloggad? Skicka vidare in i portalen.
  useEffect(() => {
    if (!initierar && anvandare) router.replace('/portal')
  }, [initierar, anvandare, router])

  // Förifyll e-post om "kom ihåg mig" användes förra gången.
  useEffect(() => {
    const sparad = hamtaIhagkommenEpost()
    if (sparad) {
      setEpost(sparad)
      setIhagkommen(true)
    }
  }, [])

  async function skicka(e: React.FormEvent) {
    e.preventDefault()
    setFel(null)
    rensaSessionUtgick()

    // Klientvalidering före anrop, så att fel känns omedelbara.
    const nästaFältFel = { epost: !epost.trim(), losenord: !losenord }
    if (nästaFältFel.epost || nästaFältFel.losenord) {
      setFaltFel(nästaFältFel)
      setFel(felmeddelanden.saknade_uppgifter)
      return
    }
    setFaltFel({})

    const resultat = await loggaIn(epost, losenord, ihagkommen)
    if (resultat.ok) {
      router.replace('/portal')
      return
    }

    const meddelande = felmeddelanden[resultat.fel ?? 'fel_uppgifter']
    setFel(meddelande)
    if (resultat.fel === 'ogiltig_epost') setFaltFel({ epost: true })
    if (resultat.fel === 'fel_uppgifter') setFaltFel({ epost: true, losenord: true })
  }

  return (
    <main className="relative flex min-h-svh flex-col lg:grid lg:grid-cols-[1fr_minmax(0,29rem)]">
      <VarumarkesPanel />

      <div className="relative flex flex-1 items-center justify-center bg-surface px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          {/* Kompakt logotyp – syns bara när varumärkespanelen är dold. */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <NovaMark className="size-9" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">Nova IT</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Adminportal
              </span>
            </div>
          </div>

          {lage === 'glomt' ? (
            <GlomtLosenord epost={epost} vidAvbryt={() => setLage('inloggning')} />
          ) : (
            <>
              <header className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-semibold tracking-tight">Logga in</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Portalen används av Nova IT:s personal för att hantera kundärenden.
                </p>
              </header>

              {sessionUtgick && (
                <div className="mt-5 flex items-start gap-2.5 rounded-lg bg-warning/10 px-3.5 py-3">
                  <ClockIcon className="mt-0.5 size-4 shrink-0 text-warning" />
                  <p className="text-[13px] leading-relaxed text-text-secondary">
                    Din session har gått ut av säkerhetsskäl. Logga in igen för att fortsätta.
                  </p>
                </div>
              )}

              <form onSubmit={skicka} className="mt-6" noValidate>
                <FieldGroup>
                  <Field data-invalid={faltFel.epost || undefined}>
                    <FieldLabel htmlFor="epost">E-postadress</FieldLabel>
                    <div className="relative">
                      <MailIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="epost"
                        type="email"
                        inputMode="email"
                        autoComplete="username"
                        placeholder="fornamn@nova-it.se"
                        value={epost}
                        aria-invalid={faltFel.epost || undefined}
                        onChange={(e) => {
                          setEpost(e.target.value)
                          if (faltFel.epost) setFaltFel((f) => ({ ...f, epost: false }))
                        }}
                        className="pl-9"
                      />
                    </div>
                  </Field>

                  <Field data-invalid={faltFel.losenord || undefined}>
                    <div className="flex items-center justify-between gap-2">
                      <FieldLabel htmlFor="losenord">Lösenord</FieldLabel>
                      <button
                        type="button"
                        onClick={() => setLage('glomt')}
                        className="text-[13px] font-medium text-primary underline-offset-4 transition-colors hover:underline"
                      >
                        Glömt lösenord?
                      </button>
                    </div>
                    <div className="relative">
                      <LockIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="losenord"
                        type={visaLosenord ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="Ditt lösenord"
                        value={losenord}
                        aria-invalid={faltFel.losenord || undefined}
                        onChange={(e) => {
                          setLosenord(e.target.value)
                          if (faltFel.losenord) setFaltFel((f) => ({ ...f, losenord: false }))
                        }}
                        className="pl-9 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setVisaLosenord((v) => !v)}
                        aria-label={visaLosenord ? 'Dölj lösenord' : 'Visa lösenord'}
                        aria-pressed={visaLosenord}
                        className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {visaLosenord ? (
                          <EyeOffIcon className="size-4" />
                        ) : (
                          <EyeIcon className="size-4" />
                        )}
                      </button>
                    </div>
                  </Field>

                  <Field orientation="horizontal">
                    <Checkbox
                      id="ihagkommen"
                      checked={ihagkommen}
                      onCheckedChange={(v) => setIhagkommen(v === true)}
                    />
                    <FieldLabel htmlFor="ihagkommen" className="font-normal text-text-secondary">
                      Kom ihåg mig på den här datorn
                    </FieldLabel>
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

                  <Button type="submit" disabled={loggarIn} className="w-full">
                    {loggarIn && <Spinner data-icon="inline-start" />}
                    {loggarIn ? 'Loggar in…' : 'Logga in'}
                  </Button>
                </FieldGroup>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

/** Vänster panel: varumärkesuttryck från nova-it.se, tonat för internt bruk. */
function VarumarkesPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-background p-12 lg:flex">
      <div className="nova-glow pointer-events-none absolute inset-x-0 top-0 h-80" />

      <div className="relative flex items-center gap-3">
        <NovaMark className="size-9" />
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold leading-tight">Nova IT</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Adminportal
          </span>
        </div>
      </div>

      <div className="relative flex max-w-md flex-col gap-8">
        <div className="flex flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary">
            Internt arbetsverktyg
          </span>
          <h2 className="text-pretty text-[2rem] font-semibold leading-[1.2]">
            Alla kundärenden på ett ställe
          </h2>
          <p className="text-pretty text-[15px] leading-relaxed text-text-muted">
            Ärenden från kontaktformuläret, supportassistenten och den kommande kundportalen samlas
            i ett gemensamt flöde – med tydlig ansvarsfördelning och full historik.
          </p>
        </div>

        <ul className="flex flex-col gap-3.5">
          {[
            { ikon: HeadsetIcon, text: 'Samlat inflöde från alla kontaktvägar' },
            { ikon: CheckCircle2Icon, text: 'Status, prioritet och ansvarig tekniker' },
            { ikon: ShieldCheckIcon, text: 'Interna anteckningar skilda från kundsvar' },
          ].map(({ ikon: Ikon, text }) => (
            <li key={text} className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-emphasis">
                <Ikon className="size-4 text-primary" />
              </span>
              <span className="text-sm text-text-secondary">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-muted-foreground">
        Nova IT · IT-hjälp i Västerort och Stockholms innerstad
      </p>
    </aside>
  )
}

/**
 * Glömt lösenord – ingår inte i detta autentiseringssteg.
 * Flödet är fortsatt simulerat (`authAdapter.begarAterstallning`) och skickar
 * inget riktigt mejl. Kopplas till Supabase i ett separat, senare uppdrag.
 */
function GlomtLosenord({ epost: initialEpost, vidAvbryt }: { epost: string; vidAvbryt: () => void }) {
  const [epost, setEpost] = useState(initialEpost)
  const [skickar, setSkickar] = useState(false)
  const [klart, setKlart] = useState(false)
  const [fel, setFel] = useState<string | null>(null)

  async function skicka(e: React.FormEvent) {
    e.preventDefault()
    setFel(null)
    setSkickar(true)
    const resultat = await authAdapter.begarAterstallning(epost)
    setSkickar(false)
    if (!resultat.ok) {
      setFel(felmeddelanden[resultat.fel ?? 'ogiltig_epost'])
      return
    }
    setKlart(true)
  }

  if (klart) {
    return (
      <div className="flex flex-col gap-5">
        <span className="flex size-11 items-center justify-center rounded-xl bg-success/12">
          <CheckCircle2Icon className="size-5 text-success" />
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Kontrollera din inkorg</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Om <span className="font-medium text-text-secondary">{epost}</span> finns registrerad
            har vi skickat en återställningslänk dit.
          </p>
        </div>
        <p className="rounded-lg bg-surface-emphasis px-3.5 py-3 text-xs leading-relaxed text-muted-foreground">
          Den här funktionen är inte fullt ut kopplad ännu – inget mejl skickas i nuläget.
        </p>
        <Button variant="outline" onClick={vidAvbryt} className="w-full">
          <ArrowLeftIcon data-icon="inline-start" />
          Tillbaka till inloggning
        </Button>
      </div>
    )
  }

  return (
    <div>
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Glömt lösenord</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Ange din e-postadress så skickar vi en länk för att välja ett nytt lösenord.
        </p>
      </header>

      <form onSubmit={skicka} className="mt-6" noValidate>
        <FieldGroup>
          <Field data-invalid={fel ? true : undefined}>
            <FieldLabel htmlFor="aterstall-epost">E-postadress</FieldLabel>
            <div className="relative">
              <MailIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="aterstall-epost"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="fornamn@nova-it.se"
                value={epost}
                aria-invalid={fel ? true : undefined}
                onChange={(e) => {
                  setEpost(e.target.value)
                  setFel(null)
                }}
                className="pl-9"
              />
            </div>
          </Field>

          {fel && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg bg-destructive/10 px-3.5 py-3"
            >
              <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              <p className="text-[13px] leading-relaxed text-text-secondary">{fel}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={skickar} className="w-full">
              {skickar && <Spinner data-icon="inline-start" />}
              {skickar ? 'Skickar…' : 'Skicka återställningslänk'}
            </Button>
            <Button type="button" variant="ghost" onClick={vidAvbryt} className="w-full">
              <ArrowLeftIcon data-icon="inline-start" />
              Tillbaka
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
