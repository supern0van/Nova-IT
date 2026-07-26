'use client'

import { ChevronsUpDownIcon, LogOutIcon, RotateCcwIcon, ShieldIcon, WrenchIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { rollLabel } from '@/lib/labels'
import { aterstallDemodata } from '@/lib/store'
import { cn } from '@/lib/utils'

/** Visar inloggad användare, roll och utloggning. */
export function AnvandarMeny({
  komprimerad = false,
  iPanel = false,
}: {
  komprimerad?: boolean
  iPanel?: boolean
}) {
  const { anvandare, loggaUt } = useAuth()
  const [loggarUt, setLoggarUt] = useState(false)

  if (!anvandare) return null

  const RollIkon = anvandare.roll === 'administrator' ? ShieldIcon : WrenchIcon

  async function hanteraUtloggning() {
    setLoggarUt(true)
    try {
      const resultat = await loggaUt()
      if (!resultat.ok) {
        toast.error('Utloggningen kunde inte slutföras', {
          description: 'Kontrollera din internetanslutning och försök igen.',
        })
      }
    } finally {
      setLoggarUt(false)
    }
  }

  function aterstall() {
    aterstallDemodata()
    toast.success('Demodata återställd', {
      description: 'Alla ärenden, bokningar och anteckningar är tillbaka i sitt utgångsläge.',
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Kontomeny"
            className={cn(
              'flex w-full items-center rounded-lg transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              komprimerad ? 'h-9 w-9 justify-center' : 'gap-2.5 p-2',
            )}
          >
            <Avatar className="size-7 shrink-0">
              <AvatarFallback className="bg-primary/14 text-[11px] font-semibold text-primary">
                {anvandare.initialer}
              </AvatarFallback>
            </Avatar>
            {!komprimerad && (
              <>
                <span className="flex min-w-0 flex-1 flex-col text-left">
                  <span className="truncate text-[13px] font-medium leading-tight">
                    {anvandare.namn}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] leading-tight text-muted-foreground">
                    <RollIkon className="size-3 shrink-0" />
                    <span className="truncate">{rollLabel[anvandare.roll]}</span>
                  </span>
                </span>
                <ChevronsUpDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
              </>
            )}
          </button>
        }
      />
      <DropdownMenuContent
        align={iPanel ? 'center' : 'start'}
        side={komprimerad ? 'right' : 'top'}
        className="w-60"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
            <span className="text-[13px] font-medium">{anvandare.namn}</span>
            <span className="font-normal text-xs text-muted-foreground">{anvandare.epost}</span>
            <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-md bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              <RollIkon className="size-3" />
              {rollLabel[anvandare.roll]}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={aterstall}>
            <RotateCcwIcon />
            Återställ demodata
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={hanteraUtloggning} disabled={loggarUt} variant="destructive">
            <LogOutIcon />
            {loggarUt ? 'Loggar ut…' : 'Logga ut'}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
