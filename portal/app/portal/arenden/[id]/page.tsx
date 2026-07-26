import type { Metadata } from 'next'

import { ArendeDetalj } from '@/components/portal/arende/arende-detalj'

export const metadata: Metadata = {
  title: 'Ärende',
}

export default async function ArendeSida({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ArendeDetalj arendeId={id} />
}
