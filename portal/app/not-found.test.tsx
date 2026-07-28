// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import NotFound from '@/app/not-found'

describe('NotFound', () => {
  afterEach(() => {
    cleanup()
  })

  it('visar en begriplig svensk 404-sida med väg tillbaka, inte Next.js standardsida', () => {
    render(<NotFound />)

    expect(screen.getByText('Sidan hittades inte')).toBeTruthy()
    const lank = screen.getByRole('button', { name: 'Till startsidan' })
    expect(lank.getAttribute('href')).toBe('/')
  })
})
