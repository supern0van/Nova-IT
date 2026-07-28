// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Kundanteckning } from '@/lib/types'

const anvandare = {
  id: 'user-1',
  namn: 'Admin Nova',
  epost: 'admin@nova-it.se',
  roll: 'administrator' as const,
  initialer: 'AN',
  titel: 'Administratör',
  aktiv: true,
}

const kan = vi.fn().mockReturnValue(true)
const laggTillKundanteckning = vi.fn()
const uppdateraKundanteckning = vi.fn()
const taBortKundanteckning = vi.fn()

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({ anvandare, kan }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/store', () => ({
  laggTillKundanteckning,
  uppdateraKundanteckning,
  taBortKundanteckning,
}))

let KundAnteckningar: typeof import('@/components/portal/kunder/kund-anteckningar').KundAnteckningar

beforeAll(async () => {
  ;({ KundAnteckningar } = await import('@/components/portal/kunder/kund-anteckningar'))
})

const anteckning: Kundanteckning = {
  id: 'kant-1',
  kundId: 'kund-1',
  text: 'Har nyckel hos grannen.',
  forfattare: 'Admin Nova',
  skapad: '2026-07-28T00:00:00.000Z',
}

describe('KundAnteckningar – felhantering och dubbelklicksskydd', () => {
  afterEach(() => {
    vi.clearAllMocks()
    kan.mockReturnValue(true)
    cleanup()
  })

  it('visar ett begripligt fel om laggTillKundanteckning kastar', async () => {
    const user = userEvent.setup()
    laggTillKundanteckning.mockRejectedValue(new Error('Kunde inte spara i den operativa databasen.'))
    render(<KundAnteckningar kundId="kund-1" anteckningar={[]} />)

    await user.click(screen.getByRole('button', { name: 'Ny anteckning' }))
    await user.type(screen.getByLabelText('Ny intern anteckning'), 'Portkod 1234.')
    await user.click(screen.getByRole('button', { name: 'Spara anteckning' }))

    expect(toast.error).toHaveBeenCalledWith('Kunde inte spara anteckningen', {
      description: 'Kunde inte spara i den operativa databasen.',
    })
  })

  it('sparar en ny anteckning vid lyckat anrop', async () => {
    const user = userEvent.setup()
    laggTillKundanteckning.mockResolvedValue(undefined)
    render(<KundAnteckningar kundId="kund-1" anteckningar={[]} />)

    await user.click(screen.getByRole('button', { name: 'Ny anteckning' }))
    await user.type(screen.getByLabelText('Ny intern anteckning'), 'Portkod 1234.')
    await user.click(screen.getByRole('button', { name: 'Spara anteckning' }))

    expect(laggTillKundanteckning).toHaveBeenCalledWith('kund-1', 'Portkod 1234.', 'Admin Nova')
  })

  it('visar ett begripligt fel om borttagning misslyckas', async () => {
    const user = userEvent.setup()
    taBortKundanteckning.mockRejectedValue(new Error('Kunde inte spara i den operativa databasen.'))
    render(<KundAnteckningar kundId="kund-1" anteckningar={[anteckning]} />)

    await user.click(screen.getByRole('button', { name: 'Ta bort' }))
    await user.click(screen.getByRole('button', { name: 'Ta bort' }))

    expect(toast.error).toHaveBeenCalledWith('Kunde inte ta bort anteckningen', {
      description: 'Kunde inte spara i den operativa databasen.',
    })
  })

  it('förhindrar dubbla borttagningsförsök av samma anteckning', async () => {
    const user = userEvent.setup()
    let losUpp: (() => void) | undefined
    taBortKundanteckning.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          losUpp = resolve
        }),
    )
    render(<KundAnteckningar kundId="kund-1" anteckningar={[anteckning]} />)

    await user.click(screen.getByRole('button', { name: 'Ta bort' }))
    await user.click(screen.getByRole('button', { name: 'Ta bort' }))

    expect(taBortKundanteckning).toHaveBeenCalledTimes(1)
    losUpp?.()
  })

  it('döljer skriv-/ändra-kontroller för roller utan redigera_kund', () => {
    kan.mockReturnValue(false)
    render(<KundAnteckningar kundId="kund-1" anteckningar={[anteckning]} />)

    expect(screen.queryByRole('button', { name: 'Ny anteckning' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Ta bort' })).toBeNull()
  })
})
