// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

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
const laggTillMeddelande = vi.fn()

vi.mock('@/components/auth/auth-provider', () => ({
  useAuth: () => ({ anvandare, kan }),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/lib/store', () => ({
  laggTillMeddelande,
}))

let Konversation: typeof import('@/components/portal/arende/konversation').Konversation

beforeAll(async () => {
  ;({ Konversation } = await import('@/components/portal/arende/konversation'))
})

function renderaKonversation() {
  render(<Konversation arendeId="arende-1" meddelanden={[]} standardsvar={[]} />)
}

describe('Konversation – felhantering och dubbelklicksskydd', () => {
  afterEach(() => {
    vi.clearAllMocks()
    kan.mockReturnValue(true)
    cleanup()
  })

  it('visar ett begripligt fel om laggTillMeddelande kastar, texten behålls', async () => {
    const user = userEvent.setup()
    laggTillMeddelande.mockRejectedValue(new Error('Kunde inte spara i den operativa databasen.'))
    renderaKonversation()

    await user.type(screen.getByLabelText('Svar till kund'), 'Hej, vi återkommer imorgon.')
    await user.click(screen.getByRole('button', { name: 'Skicka svar' }))

    expect(toast.error).toHaveBeenCalledWith('Kunde inte skicka svaret', {
      description: 'Kunde inte spara i den operativa databasen.',
    })
    // Texten ska inte försvinna vid ett misslyckat försök, så användaren slipper skriva om.
    expect((screen.getByLabelText('Svar till kund') as HTMLTextAreaElement).value).toBe(
      'Hej, vi återkommer imorgon.',
    )
  })

  it('skickar svaret och rensar fältet vid lyckat anrop', async () => {
    const user = userEvent.setup()
    laggTillMeddelande.mockResolvedValue(undefined)
    renderaKonversation()

    await user.type(screen.getByLabelText('Svar till kund'), 'Hej!')
    await user.click(screen.getByRole('button', { name: 'Skicka svar' }))

    expect(laggTillMeddelande).toHaveBeenCalledWith('arende-1', 'Hej!', false, 'Admin Nova')
    expect((screen.getByLabelText('Svar till kund') as HTMLTextAreaElement).value).toBe('')
  })

  it('förhindrar dubbelklick – meddelandet skickas bara en gång', async () => {
    const user = userEvent.setup()
    let losUpp: (() => void) | undefined
    laggTillMeddelande.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          losUpp = resolve
        }),
    )
    renderaKonversation()

    await user.type(screen.getByLabelText('Svar till kund'), 'Hej!')
    const knapp = screen.getByRole('button', { name: 'Skicka svar' })
    await user.click(knapp)
    await user.click(knapp)

    expect(laggTillMeddelande).toHaveBeenCalledTimes(1)
    losUpp?.()
  })

  it('markerar interna anteckningar separat och skickar internt=true', async () => {
    const user = userEvent.setup()
    laggTillMeddelande.mockResolvedValue(undefined)
    renderaKonversation()

    await user.click(screen.getByRole('tab', { name: /Intern anteckning/ }))
    await user.type(screen.getByLabelText('Intern anteckning'), 'Bara för kollegorna.')
    await user.click(screen.getByRole('button', { name: 'Spara anteckning' }))

    expect(laggTillMeddelande).toHaveBeenCalledWith(
      'arende-1',
      'Bara för kollegorna.',
      true,
      'Admin Nova',
    )
  })
})
