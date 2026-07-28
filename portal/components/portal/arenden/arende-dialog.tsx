'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { kanalLabel, prioritetLabel, prioritetOrdning } from '@/lib/labels'
import { manuellaKanaler, skapaArende } from '@/lib/store'
import type { Arendekategori, Kategori, Kund, Prioritet } from '@/lib/types'

// Speglar constraints i admin_arenden (se supabase/migrations/*_admin_operativa_tabeller.sql)
// så att formuläret stoppar samma indata servern ändå skulle avvisa.
const RUBRIK_MIN = 3
const RUBRIK_MAX = 180
const BESKRIVNING_MIN = 5

/**
 * Registrerar ett nytt ärende manuellt, t.ex. efter ett telefonsamtal eller
 * en manuell kundkontakt. Öppnas från ärendelistan (fri kundväljare) eller
 * från en kundprofil (kunden förvald och låst).
 */
export function ArendeDialog({
  oppen,
  setOppen,
  kunder,
  kategorier,
  forvaldKundId,
}: {
  oppen: boolean
  setOppen: (oppen: boolean) => void
  kunder: Kund[]
  kategorier: Arendekategori[]
  forvaldKundId?: string
}) {
  const { anvandare } = useAuth()
  const router = useRouter()

  const [kundId, setKundId] = useState('')
  const [rubrik, setRubrik] = useState('')
  const [kategori, setKategori] = useState<Kategori | ''>('')
  const [underkategori, setUnderkategori] = useState('')
  const [prioritet, setPrioritet] = useState<Prioritet>('normal')
  const [kanal, setKanal] = useState<(typeof manuellaKanaler)[number]>('telefon')
  const [beskrivning, setBeskrivning] = useState('')
  const [sparar, setSparar] = useState(false)
  const [fel, setFel] = useState<Record<string, string>>({})

  const kundLast = Boolean(forvaldKundId)

  // Fyll formuläret varje gång dialogen öppnas.
  useEffect(() => {
    if (!oppen) return
    setFel({})
    setKundId(forvaldKundId ?? '')
    setRubrik('')
    setKategori('')
    setUnderkategori('')
    setPrioritet('normal')
    setKanal('telefon')
    setBeskrivning('')
  }, [oppen, forvaldKundId])

  const valdKategori = useMemo(
    () => kategorier.find((k) => k.nyckel === kategori),
    [kategorier, kategori],
  )
  const underkategorier = valdKategori?.underkategorier ?? []

  function vidKategoribyte(nyckel: string) {
    const ny = nyckel as Kategori
    setKategori(ny)
    setUnderkategori('')
    const kat = kategorier.find((k) => k.nyckel === ny)
    if (kat) setPrioritet(kat.standardPrioritet)
  }

  function validera() {
    const nyaFel: Record<string, string> = {}
    if (!kundId) nyaFel.kund = 'Välj vilken kund ärendet gäller.'

    const rubrikTrimmad = rubrik.trim()
    if (!rubrikTrimmad) nyaFel.rubrik = 'Ange en kort rubrik.'
    else if (rubrikTrimmad.length < RUBRIK_MIN) {
      nyaFel.rubrik = `Rubriken är för kort (minst ${RUBRIK_MIN} tecken).`
    } else if (rubrikTrimmad.length > RUBRIK_MAX) {
      nyaFel.rubrik = `Rubriken är för lång (max ${RUBRIK_MAX} tecken).`
    }

    if (!kategori) nyaFel.kategori = 'Välj en kategori.'
    if (kategori && underkategorier.length > 0 && !underkategori) {
      nyaFel.underkategori = 'Välj en underkategori.'
    }

    const beskrivningTrimmad = beskrivning.trim()
    if (!beskrivningTrimmad) nyaFel.beskrivning = 'Beskriv vad ärendet gäller.'
    else if (beskrivningTrimmad.length < BESKRIVNING_MIN) {
      nyaFel.beskrivning = `Beskrivningen är för kort (minst ${BESKRIVNING_MIN} tecken).`
    }

    setFel(nyaFel)
    return Object.keys(nyaFel).length === 0
  }

  async function spara() {
    // Extra skydd utöver den avstängda knappen, så att upprepade klick eller
    // en dubbel Enter-tryckning under sparning aldrig kan skapa två ärenden.
    if (sparar) return
    if (!validera()) return

    setSparar(true)
    const aktor = anvandare?.namn ?? 'Okänd'

    try {
      const nytt = await skapaArende(
        {
          kundId,
          rubrik,
          kategori: kategori as Kategori,
          underkategori,
          prioritet,
          kanal,
          beskrivning,
        },
        aktor,
      )
      toast.success('Ärendet registrerades', {
        description: `${nytt.arendenummer} – ${nytt.rubrik}`,
        action: {
          label: 'Öppna',
          onClick: () => router.push(`/portal/arenden/${nytt.id}`),
        },
      })
      setOppen(false)
      router.push(`/portal/arenden/${nytt.id}`)
    } finally {
      setSparar(false)
    }
  }

  return (
    <Dialog open={oppen} onOpenChange={(v) => !sparar && setOppen(v)}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Nytt ärende</DialogTitle>
          <DialogDescription>
            Registrera ett ärende som kommit in muntligt eller via en kanal som inte loggar
            automatiskt. Ärendet läggs upp med status Ny, precis som inkommande ärenden.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3.5">
          {kundLast ? (
            <div className="flex flex-col gap-1 rounded-lg bg-surface-emphasis px-3 py-2.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                Kund
              </span>
              <span className="text-[13px] font-medium">
                {kunder.find((k) => k.id === kundId)?.namn ?? 'Okänd kund'}
              </span>
            </div>
          ) : (
            <Field data-invalid={Boolean(fel.kund)}>
              <FieldLabel>Kund</FieldLabel>
              <Select
                items={Object.fromEntries(kunder.map((k) => [k.id, k.namn]))}
                value={kundId}
                onValueChange={(v) => setKundId(String(v))}
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

          <Field data-invalid={Boolean(fel.rubrik)}>
            <FieldLabel htmlFor="arende-rubrik">Rubrik</FieldLabel>
            <Input
              id="arende-rubrik"
              value={rubrik}
              onChange={(e) => setRubrik(e.target.value)}
              placeholder="Kort sammanfattning av vad ärendet gäller"
              aria-invalid={Boolean(fel.rubrik)}
              maxLength={RUBRIK_MAX}
            />
            {fel.rubrik && <FieldError>{fel.rubrik}</FieldError>}
          </Field>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field data-invalid={Boolean(fel.kategori)}>
              <FieldLabel>Kategori</FieldLabel>
              <Select
                items={Object.fromEntries(kategorier.map((k) => [k.nyckel, k.namn]))}
                value={kategori}
                onValueChange={(v) => vidKategoribyte(String(v))}
              >
                <SelectTrigger className="w-full" aria-invalid={Boolean(fel.kategori)}>
                  <SelectValue placeholder="Välj kategori">
                    {(v: string) => kategorier.find((k) => k.nyckel === v)?.namn ?? 'Välj kategori'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {kategorier.map((k) => (
                    <SelectItem key={k.nyckel} value={k.nyckel}>
                      {k.namn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fel.kategori && <FieldError>{fel.kategori}</FieldError>}
            </Field>

            <Field data-invalid={Boolean(fel.underkategori)}>
              <FieldLabel>Underkategori</FieldLabel>
              <Select
                items={Object.fromEntries(underkategorier.map((u) => [u, u]))}
                value={underkategori}
                onValueChange={(v) => setUnderkategori(String(v))}
                disabled={underkategorier.length === 0}
              >
                <SelectTrigger className="w-full" aria-invalid={Boolean(fel.underkategori)}>
                  <SelectValue
                    placeholder={
                      underkategorier.length === 0 ? 'Ingen underkategori krävs' : 'Välj underkategori'
                    }
                  >
                    {(v: string) => v}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {underkategorier.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fel.underkategori && <FieldError>{fel.underkategori}</FieldError>}
            </Field>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field>
              <FieldLabel>Prioritet</FieldLabel>
              <Select
                items={Object.fromEntries(prioritetOrdning.map((p) => [p, prioritetLabel[p]]))}
                value={prioritet}
                onValueChange={(v) => setPrioritet(v as Prioritet)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: Prioritet) => prioritetLabel[v]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[...prioritetOrdning].reverse().map((p) => (
                    <SelectItem key={p} value={p}>
                      {prioritetLabel[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Kanal</FieldLabel>
              <Select
                items={Object.fromEntries(manuellaKanaler.map((k) => [k, kanalLabel[k]]))}
                value={kanal}
                onValueChange={(v) => setKanal(v as (typeof manuellaKanaler)[number])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: (typeof manuellaKanaler)[number]) => kanalLabel[v]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {manuellaKanaler.map((k) => (
                    <SelectItem key={k} value={k}>
                      {kanalLabel[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field data-invalid={Boolean(fel.beskrivning)}>
            <FieldLabel htmlFor="arende-beskrivning">Beskrivning</FieldLabel>
            <Textarea
              id="arende-beskrivning"
              value={beskrivning}
              onChange={(e) => setBeskrivning(e.target.value)}
              rows={4}
              placeholder="Vad kunden hörde av sig om, och vad som eventuellt redan gjorts"
              aria-invalid={Boolean(fel.beskrivning)}
            />
            {fel.beskrivning && <FieldError>{fel.beskrivning}</FieldError>}
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOppen(false)} disabled={sparar}>
            Avbryt
          </Button>
          <Button onClick={spara} disabled={sparar}>
            {sparar && <Spinner data-icon="inline-start" />}
            Registrera ärende
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
