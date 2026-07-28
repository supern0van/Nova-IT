'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { listaTilldelningsbara } from '@/lib/auth/demo-auth'
import { bokningStatusLabel, bokningTypLabel } from '@/lib/labels'
import { bokningTyper, skapaBokning, uppdateraBokning } from '@/lib/store'
import type { Arende, Bokning, BokningStatus, BokningTyp, Kund } from '@/lib/types'

const langder = [20, 30, 45, 60, 90, 120, 180]

/** Rimlig standardplats utifrån bokningstyp och kundens adress. */
function standardPlats(typ: BokningTyp, kund?: Kund, telefon?: string) {
  switch (typ) {
    case 'hembesok':
      return kund ? `${kund.adress}, ${kund.ort}` : ''
    case 'distanssupport':
      return 'Fjärranslutning'
    case 'verkstadsbesok':
      return 'Nova IT, verkstaden'
    case 'telefonkontakt':
      return telefon ?? kund?.telefon ?? ''
  }
}

/**
 * Skapar eller ändrar en bokning. Används både från ärendedetaljsidan och från
 * bokningsvyn. Skrivningarna går via portalens operativa adminlager.
 */
export function BokningDialog({
  oppen,
  setOppen,
  befintlig,
  arende,
  kunder,
}: {
  oppen: boolean
  setOppen: (oppen: boolean) => void
  befintlig?: Bokning
  arende?: Arende
  kunder: Kund[]
}) {
  const { anvandare } = useAuth()
  const tekniker = listaTilldelningsbara()
  const redigerar = Boolean(befintlig)

  const imorgon = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 10)
  }, [])

  const [kundId, setKundId] = useState('')
  const [typ, setTyp] = useState<BokningTyp>('hembesok')
  const [status, setStatus] = useState<BokningStatus>('planerad')
  const [datum, setDatum] = useState(imorgon)
  const [tid, setTid] = useState('09:00')
  const [langd, setLangd] = useState('60')
  const [ansvarig, setAnsvarig] = useState('')
  const [plats, setPlats] = useState('')
  const [notering, setNotering] = useState('')
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<Record<string, string>>({})

  // Fyll formuläret varje gång dialogen öppnas.
  useEffect(() => {
    if (!oppen) return
    setFel({})
    if (befintlig) {
      setKundId(befintlig.kundId)
      setTyp(befintlig.typ)
      setStatus(befintlig.status)
      setDatum(befintlig.datum)
      setTid(befintlig.tid)
      setLangd(String(befintlig.langdMinuter))
      setAnsvarig(befintlig.tekniker)
      setPlats(befintlig.plats)
      setNotering(befintlig.notering ?? '')
      return
    }
    const valdKund = arende ? kunder.find((k) => k.id === arende.kundId) : undefined
    const startTyp: BokningTyp = arende?.kundtyp === 'verksamhet' ? 'hembesok' : 'hembesok'
    setKundId(arende?.kundId ?? '')
    setTyp(startTyp)
    setStatus('planerad')
    setDatum(imorgon)
    setTid('09:00')
    setLangd('60')
    setAnsvarig(arende?.ansvarigId ?? anvandare?.id ?? tekniker[0]?.id ?? '')
    setPlats(standardPlats(startTyp, valdKund, arende?.telefon))
    setNotering('')
  }, [oppen, befintlig, arende, kunder, imorgon, anvandare?.id, tekniker])

  function vidTypbyte(nyTyp: BokningTyp) {
    setTyp(nyTyp)
    const kund = kunder.find((k) => k.id === kundId)
    setPlats(standardPlats(nyTyp, kund, arende?.telefon))
  }

  function validera() {
    const nyaFel: Record<string, string> = {}
    if (!kundId) nyaFel.kund = 'Välj vilken kund bokningen gäller.'
    if (!datum) nyaFel.datum = 'Ange ett datum.'
    if (!tid) nyaFel.tid = 'Ange en tid.'
    if (!ansvarig) nyaFel.tekniker = 'Välj vem som utför besöket.'
    if (!plats.trim()) nyaFel.plats = 'Ange plats, adress eller telefonnummer.'
    setFel(nyaFel)
    return Object.keys(nyaFel).length === 0
  }

  async function spara() {
    if (!validera()) return
    setSparar(true)
    const kund = kunder.find((k) => k.id === kundId)
    const aktor = anvandare?.namn ?? 'Okänd'

    try {
      if (befintlig) {
        await uppdateraBokning(
          befintlig.id,
          {
            datum,
            tid,
            typ,
            status,
            notering: notering.trim() || undefined,
            tekniker: ansvarig,
            langdMinuter: Number(langd),
          },
          aktor,
        )
        toast.success('Bokningen uppdaterades')
      } else {
        await skapaBokning(
          {
            arendeId: arende?.id,
            arendenummer: arende?.arendenummer,
            kundId,
            kundNamn: kund?.namn ?? arende?.kundNamn ?? 'Okänd kund',
            typ,
            status,
            datum,
            tid,
            langdMinuter: Number(langd),
            tekniker: ansvarig,
            plats: plats.trim(),
            notering: notering.trim() || undefined,
          },
          aktor,
        )
        toast.success('Bokningen skapades', {
          description: 'Kunden meddelas inte automatiskt ännu.',
        })
      }
      setOppen(false)
    } finally {
      setSparar(false)
    }
  }

  return (
    <Dialog open={oppen} onOpenChange={setOppen}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{redigerar ? 'Ändra bokning' : 'Ny bokning'}</DialogTitle>
          <DialogDescription>
            {arende
              ? `Kopplas till ärende ${arende.arendenummer} – ${arende.kundNamn}.`
              : 'Bokningen sparas i Nova IT:s system. Ingen kalenderinbjudan skickas ännu.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3.5">
          {!arende && (
            <Field data-invalid={Boolean(fel.kund)}>
              <FieldLabel>Kund</FieldLabel>
              <Select
                items={Object.fromEntries(kunder.map((k) => [k.id, k.namn]))}
                value={kundId}
                onValueChange={(v) => {
                  const nyKundId = String(v)
                  setKundId(nyKundId)
                  setPlats(standardPlats(typ, kunder.find((k) => k.id === nyKundId)))
                }}
              >
                <SelectTrigger className="w-full" aria-invalid={Boolean(fel.kund)}>
                  <SelectValue placeholder="Välj kund">
                    {(v: string) => kunder.find((k) => k.id === v)?.namn ?? 'Välj kund'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {kunder.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.namn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fel.kund && <FieldError>{fel.kund}</FieldError>}
            </Field>
          )}

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field>
              <FieldLabel>Typ av besök</FieldLabel>
              <Select
                items={Object.fromEntries(bokningTyper.map((t) => [t, bokningTypLabel[t]]))}
                value={typ}
                onValueChange={(v) => vidTypbyte(v as BokningTyp)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: BokningTyp) => bokningTypLabel[v]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {bokningTyper.map((t) => (
                    <SelectItem key={t} value={t}>
                      {bokningTypLabel[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                items={{
                  planerad: bokningStatusLabel.planerad,
                  bekraftad: bokningStatusLabel.bekraftad,
                  genomford: bokningStatusLabel.genomford,
                }}
                value={status}
                onValueChange={(v) => setStatus(v as BokningStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: BokningStatus) => bokningStatusLabel[v]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planerad">{bokningStatusLabel.planerad}</SelectItem>
                  <SelectItem value="bekraftad">{bokningStatusLabel.bekraftad}</SelectItem>
                  <SelectItem value="genomford">{bokningStatusLabel.genomford}</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field data-invalid={Boolean(fel.datum)}>
              <FieldLabel htmlFor="bokning-datum">Datum</FieldLabel>
              <Input
                id="bokning-datum"
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                aria-invalid={Boolean(fel.datum)}
              />
              {fel.datum && <FieldError>{fel.datum}</FieldError>}
            </Field>

            <Field data-invalid={Boolean(fel.tid)}>
              <FieldLabel htmlFor="bokning-tid">Tid</FieldLabel>
              <Input
                id="bokning-tid"
                type="time"
                value={tid}
                onChange={(e) => setTid(e.target.value)}
                aria-invalid={Boolean(fel.tid)}
              />
              {fel.tid && <FieldError>{fel.tid}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>Beräknad längd</FieldLabel>
              <Select
                items={Object.fromEntries(langder.map((l) => [String(l), `${l} minuter`]))}
                value={langd}
                onValueChange={(v) => setLangd(String(v))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: string) => `${v} minuter`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {langder.map((l) => (
                    <SelectItem key={l} value={String(l)}>
                      {l} minuter
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field data-invalid={Boolean(fel.tekniker)}>
              <FieldLabel>Utförs av</FieldLabel>
              <Select
                items={Object.fromEntries(tekniker.map((t) => [t.id, t.namn]))}
                value={ansvarig}
                onValueChange={(v) => setAnsvarig(String(v))}
              >
                <SelectTrigger className="w-full" aria-invalid={Boolean(fel.tekniker)}>
                  <SelectValue placeholder="Välj tekniker">
                    {(v: string) => tekniker.find((t) => t.id === v)?.namn ?? 'Välj tekniker'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tekniker.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.namn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fel.tekniker && <FieldError>{fel.tekniker}</FieldError>}
            </Field>
          </div>

          <Field data-invalid={Boolean(fel.plats)}>
            <FieldLabel htmlFor="bokning-plats">Plats</FieldLabel>
            <Input
              id="bokning-plats"
              value={plats}
              onChange={(e) => setPlats(e.target.value)}
              placeholder="Adress, fjärranslutning eller telefonnummer"
              aria-invalid={Boolean(fel.plats)}
            />
            {fel.plats && <FieldError>{fel.plats}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="bokning-notering">Intern notering</FieldLabel>
            <Textarea
              id="bokning-notering"
              value={notering}
              onChange={(e) => setNotering(e.target.value)}
              rows={2}
              placeholder="Portkod, utrustning att ta med, kontaktperson på plats…"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOppen(false)} disabled={sparar}>
            Avbryt
          </Button>
          <Button onClick={spara} disabled={sparar}>
            {sparar && <Spinner data-icon="inline-start" />}
            {redigerar ? 'Spara ändringar' : 'Skapa bokning'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
