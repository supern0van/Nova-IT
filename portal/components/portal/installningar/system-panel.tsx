'use client'

import { RotateCcwIcon, ShieldAlertIcon } from 'lucide-react'
import { useState } from 'react'
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
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { listaAnvandare } from '@/lib/auth/demo-auth'
import { rollLabel } from '@/lib/labels'
import { aterstallDemodata } from '@/lib/store'

/**
 * Systemöversikt. Personallista i läsläge plus möjligheten att återställa
 * demodatan till sitt utgångsläge.
 */
export function SystemPanel() {
  const { kan } = useAuth()
  const kanSePersonal = kan('hantera_anvandare')
  const [aterstaller, setAterstaller] = useState(false)
  const personal = listaAnvandare()

  function aterstall() {
    setAterstaller(true)
    aterstallDemodata()
    toast.success('Demodatan är återställd till utgångsläget')
    setAterstaller(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {kanSePersonal && (
        <Yta className="flex flex-col gap-4 p-3.5">
          <Sektionsrubrik antal={personal.length}>Personal</Sektionsrubrik>

          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Konton och roller är låsta i demon. Att bjuda in eller stänga av personal kräver en
            riktig backend med autentisering.
          </p>

          <ul className="flex flex-col gap-1.5">
            {personal.map((person) => (
              <li
                key={person.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface-emphasis p-3"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-[11px] font-semibold text-text-secondary"
                  >
                    {person.initialer}
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="truncate text-[13px] font-medium">{person.namn}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{person.epost}</p>
                  </div>
                </div>

                <dl className="flex flex-wrap items-start gap-x-8 gap-y-2">
                  <Faltrad etikett="Titel">{person.titel}</Faltrad>
                  <Faltrad etikett="Roll">{rollLabel[person.roll]}</Faltrad>
                  <Faltrad etikett="Status">
                    <span className={person.aktiv ? 'text-success' : 'text-muted-foreground'}>
                      {person.aktiv ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </Faltrad>
                </dl>
              </li>
            ))}
          </ul>
        </Yta>
      )}

      <Yta className="flex flex-col gap-4 p-3.5">
        <Sektionsrubrik>Demodata</Sektionsrubrik>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-emphasis p-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-[13px] font-medium">Återställ demodata</p>
            <p className="text-pretty text-[12px] leading-relaxed text-muted-foreground">
              Alla ärenden, kunder, bokningar, anteckningar och inställningar går tillbaka till
              utgångsläget.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="outline" size="sm" disabled={aterstaller}>
                  {aterstaller ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <RotateCcwIcon data-icon="inline-start" />
                  )}
                  Återställ
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia>
                  <ShieldAlertIcon className="text-destructive" />
                </AlertDialogMedia>
                <AlertDialogTitle>Återställa all demodata?</AlertDialogTitle>
                <AlertDialogDescription>
                  Allt du har ändrat under sessionen försvinner, inklusive nya kunder, ärenden och
                  anteckningar. Det går inte att ångra.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={aterstall}>
                  Återställ demodata
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Yta>
    </div>
  )
}
