'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { kundtypLabel } from '@/lib/labels'
import { skapaKund, uppdateraKund } from '@/lib/store'
import type { Kund, Kundtyp } from '@/lib/types'

/** Samma e-postkontroll som demoinloggningen använder. */
function giltigEpost(varde: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(varde.trim())
}

/**
 * Svenska telefonnummer skrivs på många sätt. Vi accepterar siffror, mellanslag,
 * bindestreck, parenteser och inledande +, och kräver minst sju siffror.
 */
function giltigTelefon(varde: string) {
  const rensad = varde.trim()
  if (!/^[+]?[\d\s\-()]+$/.test(rensad)) return false
  return rensad.replace(/\D/g, '').length >= 7
}

// Speglar constraints i admin_kunder (se supabase/migrations/*_admin_operativa_tabeller.sql)
// så att formuläret stoppar samma indata servern ändå skulle avvisa.
const NAMN_MAX = 160
const EPOST_MIN = 3
const EPOST_MAX = 254
const TELEFON_MAX = 40
const ORGANISATION_MAX = 160

/**
 * Skapar en ny kund eller redigerar en befintlig. Vid redigering låses namn och
 * kundtyp – de utgör kundens identitet i ärendehistoriken – medan adress,
 * telefon, e-post och kontaktperson kan ändras.
 */
export function KundDialog({
  oppen,
  setOppen,
  befintlig,
  vidSkapad,
}: {
  oppen: boolean
  setOppen: (oppen: boolean) => void
  befintlig?: Kund
  vidSkapad?: (kund: Kund) => void
}) {
  const { anvandare } = useAuth()
  const redigerar = Boolean(befintlig)

  const [namn, setNamn] = useState('')
  const [kundtyp, setKundtyp] = useState<Kundtyp>('privatperson')
  const [organisation, setOrganisation] = useState('')
  const [orgnummer, setOrgnummer] = useState('')
  const [kontaktperson, setKontaktperson] = useState('')
  const [epost, setEpost] = useState('')
  const [telefon, setTelefon] = useState('')
  const [adress, setAdress] = useState('')
  const [ort, setOrt] = useState('')
  const [anteckning, setAnteckning] = useState('')
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<Record<string, string>>({})

  // Fyll formuläret varje gång dialogen öppnas.
  useEffect(() => {
    if (!oppen) return
    setFel({})
    setAnteckning('')
    if (befintlig) {
      setNamn(befintlig.namn)
      setKundtyp(befintlig.kundtyp)
      setOrganisation(befintlig.organisation ?? '')
      setOrgnummer(befintlig.orgnummer ?? '')
      setKontaktperson(befintlig.kontaktperson ?? '')
      setEpost(befintlig.epost)
      setTelefon(befintlig.telefon)
      setAdress(befintlig.adress)
      setOrt(befintlig.ort)
      return
    }
    setNamn('')
    setKundtyp('privatperson')
    setOrganisation('')
    setOrgnummer('')
    setKontaktperson('')
    setEpost('')
    setTelefon('')
    setAdress('')
    setOrt('')
  }, [oppen, befintlig])

  function validera() {
    const nyaFel: Record<string, string> = {}

    if (!redigerar) {
      const namnTrimmat = namn.trim()
      if (!namnTrimmat) nyaFel.namn = 'Ange kundens namn.'
      else if (namnTrimmat.length < 2) nyaFel.namn = 'Namnet är för kort.'
      else if (namnTrimmat.length > NAMN_MAX) {
        nyaFel.namn = `Namnet får vara högst ${NAMN_MAX} tecken.`
      }
    }

    const epostTrimmad = epost.trim()
    if (!epostTrimmad) nyaFel.epost = 'Ange en e-postadress.'
    else if (epostTrimmad.length < EPOST_MIN || epostTrimmad.length > EPOST_MAX) {
      nyaFel.epost = `E-postadressen måste vara mellan ${EPOST_MIN} och ${EPOST_MAX} tecken.`
    } else if (!giltigEpost(epostTrimmad)) {
      nyaFel.epost = 'E-postadressen ser inte giltig ut.'
    }

    const telefonTrimmat = telefon.trim()
    if (!telefonTrimmat) nyaFel.telefon = 'Ange ett telefonnummer.'
    else if (telefonTrimmat.length > TELEFON_MAX) {
      nyaFel.telefon = `Telefonnumret får vara högst ${TELEFON_MAX} tecken.`
    } else if (!giltigTelefon(telefonTrimmat)) {
      nyaFel.telefon = 'Ange ett telefonnummer med minst sju siffror.'
    }

    const organisationTrimmad = organisation.trim()
    if (organisationTrimmad.length > ORGANISATION_MAX) {
      nyaFel.organisation = `Verksamhetens namn får vara högst ${ORGANISATION_MAX} tecken.`
    } else if (!redigerar && kundtyp === 'verksamhet' && !organisationTrimmad) {
      nyaFel.organisation = 'Ange verksamhetens fullständiga namn.'
    }

    setFel(nyaFel)
    return Object.keys(nyaFel).length === 0
  }

  async function spara() {
    if (sparar) return
    if (!validera()) return
    setSparar(true)
    const forfattare = anvandare?.namn ?? 'Okänd'

    try {
      if (befintlig) {
        await uppdateraKund(befintlig.id, {
          adress,
          ort,
          telefon,
          epost,
          kontaktperson,
          organisation,
          orgnummer,
        })
        toast.success('Kunduppgifterna sparades')
      } else {
        const kund = await skapaKund(
          {
            namn,
            kundtyp,
            epost,
            telefon,
            adress,
            ort,
            organisation: kundtyp === 'verksamhet' ? organisation : undefined,
            orgnummer: kundtyp === 'verksamhet' ? orgnummer : undefined,
            kontaktperson: kundtyp === 'verksamhet' ? kontaktperson : undefined,
            forstaAnteckning: anteckning,
          },
          forfattare,
        )
        toast.success('Kunden lades upp', {
          description: 'Kunden är sparad och syns direkt i registret.',
        })
        vidSkapad?.(kund)
      }
      setOppen(false)
    } catch (error) {
      toast.error(befintlig ? 'Kunde inte spara kunduppgifterna' : 'Kunde inte lägga upp kunden', {
        description: error instanceof Error ? error.message : 'Försök igen.',
      })
    } finally {
      setSparar(false)
    }
  }

  return (
    <Dialog open={oppen} onOpenChange={setOppen}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{redigerar ? 'Ändra kunduppgifter' : 'Ny kund'}</DialogTitle>
          <DialogDescription>
            {redigerar
              ? 'Namn och kundtyp är låsta eftersom de används i ärendehistoriken.'
              : 'Kunduppgifterna sparas i Nova IT:s system.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3.5">
          {redigerar ? (
            <div className="flex flex-col gap-1 rounded-lg bg-surface-emphasis px-3 py-2.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Kund
              </span>
              <span className="text-[13px] font-medium">{befintlig?.namn}</span>
              <span className="text-[11px] text-muted-foreground">
                {kundtypLabel[befintlig?.kundtyp ?? 'privatperson']}
              </span>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field data-invalid={Boolean(fel.namn)}>
                <FieldLabel htmlFor="kund-namn">Namn</FieldLabel>
                <Input
                  id="kund-namn"
                  value={namn}
                  onChange={(e) => setNamn(e.target.value)}
                  placeholder="Förnamn Efternamn eller verksamhetsnamn"
                  aria-invalid={Boolean(fel.namn)}
                  maxLength={NAMN_MAX}
                />
                {fel.namn && <FieldError>{fel.namn}</FieldError>}
              </Field>

              <Field>
                <FieldLabel>Kundtyp</FieldLabel>
                <Select
                  items={{
                    privatperson: kundtypLabel.privatperson,
                    verksamhet: kundtypLabel.verksamhet,
                  }}
                  value={kundtyp}
                  onValueChange={(v) => setKundtyp(v as Kundtyp)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: Kundtyp) => kundtypLabel[v]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="privatperson">{kundtypLabel.privatperson}</SelectItem>
                    <SelectItem value="verksamhet">{kundtypLabel.verksamhet}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          )}

          {(redigerar ? befintlig?.kundtyp === 'verksamhet' : kundtyp === 'verksamhet') && (
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field data-invalid={Boolean(fel.organisation)}>
                <FieldLabel htmlFor="kund-organisation">Fullständigt verksamhetsnamn</FieldLabel>
                <Input
                  id="kund-organisation"
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                  placeholder="Exempel AB"
                  aria-invalid={Boolean(fel.organisation)}
                  maxLength={ORGANISATION_MAX}
                />
                {fel.organisation && <FieldError>{fel.organisation}</FieldError>}
              </Field>

              <Field>
                <FieldLabel htmlFor="kund-orgnummer">Organisationsnummer</FieldLabel>
                <Input
                  id="kund-orgnummer"
                  value={orgnummer}
                  onChange={(e) => setOrgnummer(e.target.value)}
                  placeholder="556000-0000"
                />
              </Field>
            </div>
          )}

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field data-invalid={Boolean(fel.epost)}>
              <FieldLabel htmlFor="kund-epost">E-post</FieldLabel>
              <Input
                id="kund-epost"
                type="email"
                value={epost}
                onChange={(e) => setEpost(e.target.value)}
                placeholder="namn@exempel.se"
                aria-invalid={Boolean(fel.epost)}
                maxLength={EPOST_MAX}
              />
              {fel.epost && <FieldError>{fel.epost}</FieldError>}
            </Field>

            <Field data-invalid={Boolean(fel.telefon)}>
              <FieldLabel htmlFor="kund-telefon">Telefon</FieldLabel>
              <Input
                id="kund-telefon"
                type="tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="070-000 00 00"
                aria-invalid={Boolean(fel.telefon)}
                maxLength={TELEFON_MAX}
              />
              {fel.telefon && <FieldError>{fel.telefon}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="kund-adress">Adress</FieldLabel>
              <Input
                id="kund-adress"
                value={adress}
                onChange={(e) => setAdress(e.target.value)}
                placeholder="Gatunamn 1"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="kund-ort">Ort</FieldLabel>
              <Input
                id="kund-ort"
                value={ort}
                onChange={(e) => setOrt(e.target.value)}
                placeholder="Hässelby"
              />
            </Field>
          </div>

          {(redigerar ? befintlig?.kundtyp === 'verksamhet' : kundtyp === 'verksamhet') && (
            <Field>
              <FieldLabel htmlFor="kund-kontaktperson">Kontaktperson</FieldLabel>
              <Input
                id="kund-kontaktperson"
                value={kontaktperson}
                onChange={(e) => setKontaktperson(e.target.value)}
                placeholder="Namn på den vi pratar med"
              />
            </Field>
          )}

          {!redigerar && (
            <Field>
              <FieldLabel htmlFor="kund-anteckning">Första interna anteckning</FieldLabel>
              <Textarea
                id="kund-anteckning"
                value={anteckning}
                onChange={(e) => setAnteckning(e.target.value)}
                rows={2}
                placeholder="Portkod, utrustning, önskad kontaktväg… (valfritt)"
              />
            </Field>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOppen(false)} disabled={sparar}>
            Avbryt
          </Button>
          <Button onClick={spara} disabled={sparar}>
            {sparar && <Spinner data-icon="inline-start" />}
            {redigerar ? 'Spara ändringar' : 'Lägg upp kund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
