import { CompassIcon } from 'lucide-react'
import Link from 'next/link'

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Empty className="max-w-md border-none bg-card py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CompassIcon />
          </EmptyMedia>
          <EmptyTitle>Sidan hittades inte</EmptyTitle>
          <EmptyDescription>
            Adressen finns inte, eller så har den flyttats. Kontrollera länken, eller gå tillbaka
            till startsidan.
          </EmptyDescription>
        </EmptyHeader>
        <Button render={<Link href="/" />}>Till startsidan</Button>
      </Empty>
    </main>
  )
}
