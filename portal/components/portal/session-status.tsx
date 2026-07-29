'use client'

import { Clock3Icon, ShieldAlertIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { INAKTIVITETS_TIMEOUT_MS } from '@/lib/auth/session-timeouts'
import { cn } from '@/lib/utils'

function formatTid(ms: number) {
  const sekunder = Math.max(0, Math.ceil(ms / 1000))
  const minuter = Math.floor(sekunder / 60)
  return `${String(minuter).padStart(2, '0')}:${String(sekunder % 60).padStart(2, '0')}`
}

function formatKlocka(datum: Date) {
  return datum.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

export function SessionStatus() {
  const { session, inaktivitetKvarMs, fornyaAktivitet } = useAuth()
  const [klocka, setKlocka] = useState(() => new Date())

  useEffect(() => {
    const intervall = window.setInterval(() => setKlocka(new Date()), 1000)
    return () => window.clearInterval(intervall)
  }, [])

  if (!session || inaktivitetKvarMs === null) return null

  const visarVarning = inaktivitetKvarMs <= 2 * 60 * 1000
  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col items-end gap-2">
      <div
        className={cn(
          'flex items-center gap-2 rounded-full border bg-card/95 px-3 py-1.5 text-[11px] shadow-sm backdrop-blur',
          visarVarning ? 'border-warning/60 text-warning' : 'border-border text-muted-foreground',
        )}
        title={`Automatisk utloggning om ${formatTid(inaktivitetKvarMs)}`}
      >
        <Clock3Icon className="size-3.5" aria-hidden />
        <span className="font-mono tabular-nums text-foreground">{formatKlocka(klocka)}</span>
        <span aria-hidden>·</span>
        <span>utloggning {formatTid(inaktivitetKvarMs)}</span>
      </div>

      {visarVarning && (
        <div
          className="w-[min( calc(100vw-2rem),22rem)] rounded-xl border border-warning/50 bg-warning/10 p-3 text-sm shadow-lg backdrop-blur"
          role="alert"
        >
          <div className="flex gap-2">
            <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <div className="flex min-w-0 flex-col gap-2">
              <p className="font-medium">Du loggas ut om {formatTid(inaktivitetKvarMs)}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Spara eller fortsätt arbeta för att behålla sessionen.
              </p>
              <Button size="sm" variant="outline" className="w-fit" onClick={fornyaAktivitet}>
                Fortsätt vara inloggad
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
