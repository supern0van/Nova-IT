// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { Framstegssparning } from './framstegssparning'

describe('Framstegssparning', () => {
  afterEach(cleanup)

  it('visar "Väntar på dig"-notisen bara för status vantar_pa_kund', () => {
    render(<Framstegssparning status="vantar_pa_kund" />)
    expect(screen.getByText(/Kunden ser:/)).toBeTruthy()
  })

  it('visar ingen notis för övriga statusar', () => {
    render(<Framstegssparning status="pagaende" />)
    expect(screen.queryByText(/Kunden ser:/)).toBeNull()
  })

  it('renderar alla tre stegen oavsett status', () => {
    render(<Framstegssparning status="stangd" />)
    expect(screen.getByText('Mottaget')).toBeTruthy()
    expect(screen.getByText('Vi arbetar med det')).toBeTruthy()
    expect(screen.getByText('Klart')).toBeTruthy()
  })
})
