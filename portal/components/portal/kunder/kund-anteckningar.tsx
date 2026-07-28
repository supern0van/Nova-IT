'use client'

import { LockIcon, NotebookPenIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { Sektionsrubrik } from '@/components/portal/ui-delar'
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
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { formateraDatumTid, relativTid } from '@/lib/labels'
import {
  laggTillKundanteckning,
  taBortKundanteckning,
  uppdateraKundanteckning,
} from '@/lib/store'
import type { Kundanteckning } from '@/lib/types'

/**
 * Interna anteckningar på kundnivå. Skrivningarna går via portalens operativa
 * adminlager, som i sin tur uppdaterar alla monterade vyer. Roller utan `redigera_kund` får
 * läsa men inte ändra.
 */
export function KundAnteckningar({
  kundId,
  anteckningar,
}: {
  kundId: string
  anteckningar: Kundanteckning[]
}) {
  const { anvandare, kan } = useAuth()
  const kanRedigera = kan('redigera_kund')

  const [nyText, setNyText] = useState('')
  const [visaNy, setVisaNy] = useState(false)
  const [sparar, setSparar] = useState(false)
  const [tarBortId, setTarBortId] = useState<string | null>(null)
  const [redigerarId, setRedigerarId] = useState<string | null>(null)
  const [redigeraText, setRedigeraText] = useState('')

  async function skapa() {
    if (!nyText.trim() || sparar) return
    setSparar(true)
    try {
      await laggTillKundanteckning(kundId, nyText, anvandare?.namn ?? 'Okänd')
      setNyText('')
      setVisaNy(false)
      toast.success('Anteckningen sparades', { description: 'Den visas endast internt.' })
    } catch (error) {
      toast.error('Kunde inte spara anteckningen', {
        description: error instanceof Error ? error.message : 'Försök igen.',
      })
    } finally {
      setSparar(false)
    }
  }

  async function sparaAndring(anteckningId: string) {
    if (!redigeraText.trim() || sparar) return
    setSparar(true)
    try {
      await uppdateraKundanteckning(anteckningId, redigeraText)
      setRedigerarId(null)
      toast.success('Anteckningen uppdaterades')
    } catch (error) {
      toast.error('Kunde inte uppdatera anteckningen', {
        description: error instanceof Error ? error.message : 'Försök igen.',
      })
    } finally {
      setSparar(false)
    }
  }

  async function taBort(anteckningId: string) {
    if (tarBortId) return
    setTarBortId(anteckningId)
    try {
      await taBortKundanteckning(anteckningId)
      toast.success('Anteckningen togs bort')
    } catch (error) {
      toast.error('Kunde inte ta bort anteckningen', {
        description: error instanceof Error ? error.message : 'Försök igen.',
      })
    } finally {
      setTarBortId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Sektionsrubrik
        antal={anteckningar.length}
        atgard={
          kanRedigera && !visaNy ? (
            <Button variant="outline" size="sm" onClick={() => setVisaNy(true)}>
              <PlusIcon data-icon="inline-start" />
              Ny anteckning
            </Button>
          ) : undefined
        }
      >
        Interna anteckningar
      </Sektionsrubrik>

      <p className="-mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
        <LockIcon className="size-3.5 shrink-0" aria-hidden />
        Syns aldrig för kunden.
      </p>

      {visaNy && kanRedigera && (
        <div className="flex flex-col gap-2 rounded-lg bg-surface-emphasis p-3">
          <Textarea
            value={nyText}
            onChange={(e) => setNyText(e.target.value)}
            rows={3}
            autoFocus
            className="resize-y bg-card"
            aria-label="Ny intern anteckning"
            placeholder="Portkod, utrustning, avtal, önskemål om kontaktväg…"
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={sparar}
              onClick={() => {
                setVisaNy(false)
                setNyText('')
              }}
            >
              Avbryt
            </Button>
            <Button size="sm" onClick={skapa} disabled={sparar || !nyText.trim()}>
              {sparar && <Spinner data-icon="inline-start" />}
              Spara anteckning
            </Button>
          </div>
        </div>
      )}

      {anteckningar.length === 0 && !visaNy ? (
        <Empty className="bg-surface-emphasis py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <NotebookPenIcon />
            </EmptyMedia>
            <EmptyTitle>Inga anteckningar ännu</EmptyTitle>
            <EmptyDescription>
              {kanRedigera
                ? 'Skriv ner det som är bra att veta inför nästa kontakt.'
                : 'Din roll kan läsa men inte skriva kundanteckningar.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {anteckningar.map((anteckning) => {
            const redigeras = redigerarId === anteckning.id

            return (
              <li
                key={anteckning.id}
                className="flex flex-col gap-2 rounded-lg bg-surface-emphasis p-3"
              >
                {redigeras ? (
                  <>
                    <Textarea
                      value={redigeraText}
                      onChange={(e) => setRedigeraText(e.target.value)}
                      rows={3}
                      autoFocus
                      className="resize-y bg-card"
                      aria-label="Redigera anteckning"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={sparar}
                        onClick={() => setRedigerarId(null)}
                      >
                        Avbryt
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => sparaAndring(anteckning.id)}
                        disabled={sparar || !redigeraText.trim()}
                      >
                        {sparar && <Spinner data-icon="inline-start" />}
                        Spara
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-pretty text-[13px] leading-relaxed text-text-secondary">
                      {anteckning.text}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] text-muted-foreground">
                        {anteckning.forfattare} · {relativTid(anteckning.skapad)}
                        {anteckning.uppdaterad &&
                          ` · ändrad ${formateraDatumTid(anteckning.uppdaterad)}`}
                      </p>
                      {kanRedigera && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRedigerarId(anteckning.id)
                              setRedigeraText(anteckning.text)
                            }}
                          >
                            <PencilIcon data-icon="inline-start" />
                            Ändra
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  disabled={tarBortId !== null}
                                >
                                  {tarBortId === anteckning.id ? (
                                    <Spinner data-icon="inline-start" />
                                  ) : (
                                    <Trash2Icon data-icon="inline-start" />
                                  )}
                                  Ta bort
                                </Button>
                              }
                            />
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogMedia>
                                  <Trash2Icon className="text-destructive" />
                                </AlertDialogMedia>
                                <AlertDialogTitle>Ta bort anteckningen?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Anteckningen tas bort permanent från kundens historik. Det går
                                  inte att ångra.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Behåll anteckningen</AlertDialogCancel>
                                <AlertDialogAction
                                  variant="destructive"
                                  onClick={() => taBort(anteckning.id)}
                                >
                                  Ta bort
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
