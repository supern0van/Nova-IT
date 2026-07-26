'use client'

import { MailPlusIcon, MailXIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { Sektionsrubrik, Yta } from '@/components/portal/ui-delar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { laggTillMottagare, taBortMottagare, vaxlaMottagare } from '@/lib/store'
import type { EpostMottagare } from '@/lib/types'

const EPOST_MONSTER = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * E-postmottagare. Adresserna som aviseringarna går till, med syfte per rad
 * så att det framgår varför en adress finns i listan.
 */
export function MottagarePanel({ mottagare }: { mottagare: EpostMottagare[] }) {
  const { kan } = useAuth()
  const kanAndra = kan('hantera_systeminstallningar')

  const [visaNy, setVisaNy] = useState(false)
  const [epost, setEpost] = useState('')
  const [syfte, setSyfte] = useState('')
  const [fel, setFel] = useState<{ epost?: string; syfte?: string }>({})
  const [sparar, setSparar] = useState(false)
  const [vaxlar, setVaxlar] = useState<string | null>(null)

  function stang() {
    setVisaNy(false)
    setEpost('')
    setSyfte('')
    setFel({})
  }

  async function skapa() {
    const rensadEpost = epost.trim().toLowerCase()
    const rensatSyfte = syfte.trim()
    const nyaFel: { epost?: string; syfte?: string } = {}

    if (!rensadEpost) nyaFel.epost = 'Ange en e-postadress.'
    else if (!EPOST_MONSTER.test(rensadEpost)) nyaFel.epost = 'Adressen ser inte ut att vara giltig.'
    else if (mottagare.some((m) => m.epost.toLowerCase() === rensadEpost))
      nyaFel.epost = 'Adressen finns redan i listan.'

    if (!rensatSyfte) nyaFel.syfte = 'Beskriv vad adressen används till.'

    setFel(nyaFel)
    if (Object.keys(nyaFel).length > 0) return

    setSparar(true)
    try {
      await laggTillMottagare(rensadEpost, rensatSyfte)
      toast.success(`${rensadEpost} lades till som mottagare`)
      stang()
    } finally {
      setSparar(false)
    }
  }

  async function vaxla(m: EpostMottagare) {
    setVaxlar(m.id)
    try {
      await vaxlaMottagare(m.id)
      toast.success(m.aktiv ? `${m.epost} får inga aviseringar` : `${m.epost} får aviseringar`)
    } finally {
      setVaxlar(null)
    }
  }

  async function taBort(m: EpostMottagare) {
    await taBortMottagare(m.id)
    toast.success(`${m.epost} togs bort`)
  }

  return (
    <Yta className="flex flex-col gap-4 p-3.5">
      <Sektionsrubrik
        antal={mottagare.length}
        atgard={
          kanAndra &&
          !visaNy && (
            <Button variant="ghost" size="sm" onClick={() => setVisaNy(true)}>
              <PlusIcon data-icon="inline-start" />
              Ny mottagare
            </Button>
          )
        }
      >
        E-postmottagare
      </Sektionsrubrik>

      {visaNy && (
        <div className="flex flex-col gap-3 rounded-lg bg-surface-emphasis p-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="ny-mottagare-epost">E-postadress</Label>
              <Input
                id="ny-mottagare-epost"
                type="email"
                value={epost}
                autoFocus
                className="bg-card"
                placeholder="namn@nova-it.se"
                aria-invalid={!!fel.epost}
                onChange={(e) => setEpost(e.target.value)}
              />
              {fel.epost && <p className="text-[12px] text-destructive">{fel.epost}</p>}
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Label htmlFor="ny-mottagare-syfte">Syfte</Label>
              <Input
                id="ny-mottagare-syfte"
                value={syfte}
                className="bg-card"
                placeholder="Nya ärenden"
                aria-invalid={!!fel.syfte}
                onChange={(e) => setSyfte(e.target.value)}
              />
              {fel.syfte && <p className="text-[12px] text-destructive">{fel.syfte}</p>}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" disabled={sparar} onClick={stang}>
              Avbryt
            </Button>
            <Button size="sm" disabled={sparar} onClick={skapa}>
              {sparar && <Spinner data-icon="inline-start" />}
              Lägg till
            </Button>
          </div>
        </div>
      )}

      {mottagare.length === 0 && !visaNy ? (
        <Empty className="bg-surface-emphasis py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MailXIcon />
            </EmptyMedia>
            <EmptyTitle>Inga mottagare</EmptyTitle>
            <EmptyDescription>
              Utan mottagare finns det ingen som får aviseringarna.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {mottagare.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-emphasis p-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <MailPlusIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-[13px] font-medium">{m.epost}</p>
                  <p className="text-[12px] text-muted-foreground">{m.syfte}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {vaxlar === m.id && <Spinner className="size-3.5 text-muted-foreground" />}
                <Switch
                  checked={m.aktiv}
                  disabled={!kanAndra || vaxlar === m.id}
                  onCheckedChange={() => vaxla(m)}
                  aria-label={`Aviseringar till ${m.epost}`}
                />
                {kanAndra && (
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2Icon data-icon="inline-start" />
                          Ta bort
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogMedia>
                          <Trash2Icon className="text-destructive" />
                        </AlertDialogMedia>
                        <AlertDialogTitle>Ta bort mottagaren?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {m.epost} slutar få aviseringar och tas bort ur listan. Vill du bara
                          pausa adressen kan du stänga av den med reglaget i stället.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Behåll mottagaren</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={() => taBort(m)}>
                          Ta bort
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Yta>
  )
}
