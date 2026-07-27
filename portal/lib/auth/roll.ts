/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  ROLE API – delade typer och hjälpfunktioner                          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * `SystemRoll` styr vad en inloggad portalanvändare FÅR GÖRA i systemet.
 * Den är medvetet en EGEN, fristående typ – inte samma sak som `Roll` i
 * `lib/types.ts` ('administrator' | 'tekniker'), som beskriver portalens
 * personal-/teknikerroll i ärende-/bokningstilldelningen och styr
 * `harBehorighet()` i `lib/auth/supabase-auth.ts`. De två typerna råkar båda ha
 * ett värde som heter "administrator", men beskriver olika saker och ska
 * inte blandas ihop.
 *
 * Detta är den enda platsen i portalen som ska innehålla
 * `roll === '...'`-jämförelser för den inloggade användarens systemroll.
 * Övrig kod anropar dessa funktioner istället för att jämföra rollsträngar
 * direkt, så att en eventuell framtida roll bara behöver uppdateras här.
 *
 * Den här filen innehåller medvetet ENDAST typer och rena, synkrona
 * hjälpfunktioner – ingen databasåtkomst. Den importeras därför fritt från
 * både klient- och serverkod (t.ex. `components/auth/auth-provider.tsx`).
 * Server-only-uppslagningen mot databasen bor i `lib/auth/roll-server.ts` –
 * importera den ALDRIG härifrån eller från en `'use client'`-komponent, då
 * den drar in service-rollnyckeln.
 */

export type SystemRoll = 'administrator' | 'medarbetare'

export const systemRoller = ['administrator', 'medarbetare'] as const satisfies readonly SystemRoll[]

export function arSystemRoll(varde: unknown): varde is SystemRoll {
  return typeof varde === 'string' && systemRoller.includes(varde as SystemRoll)
}

export function harRoll(roll: SystemRoll | null | undefined, malRoll: SystemRoll): boolean {
  return roll === malRoll
}

export function arAdministrator(roll: SystemRoll | null | undefined): boolean {
  return harRoll(roll, 'administrator')
}

export function arMedarbetare(roll: SystemRoll | null | undefined): boolean {
  return harRoll(roll, 'medarbetare')
}
