'use client'

import { ChevronDownIcon, PencilIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { Sektionsrubrik, Yta } from '@/components/portal/ui-delar'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { sparaStandardsvar } from '@/lib/store'
import type { Standardsvar } from '@/lib/types'

/**
 * Standardsvar. Samma texter som teknikerna väljer i svarsrutan på ett ärende,
 * så en ändring här syns direkt i ärendevyn.
 */
export function StandardsvarPanel({ standardsvar }: { standardsvar: Standardsvar[] }) {
  const { kan } = useAuth()
  const kanAndra = kan('hantera_systeminstallningar')

  const [redigerarId, setRedigerarId] = useState<string | null>(null)
  const [rubrik, setRubrik] = useState('')
  const [text, setText] = useState('')
  const [sparar, setSparar] = useState(false)

  function borjaRedigera(svar: Standardsvar) {
    setRedigerarId(svar.id)
    setRubrik(svar.rubrik)
    setText(svar.text)
  }

  async function spara(svarId: string) {
    const rensadRubrik = rubrik.trim()
    const rensadText = text.trim()
    if (!rensadRubrik || !rensadText) return

    setSparar(true)
    try {
      await sparaStandardsvar(svarId, rensadRubrik, rensadText)
      toast.success('Standardsvaret sparades')
      setRedigerarId(null)
    } finally {
      setSparar(false)
    }
  }

  return (
    <Yta className="flex flex-col gap-4 p-3.5">
      <Sektionsrubrik antal={standardsvar.length}>Standardsvar</Sektionsrubrik>

      <p className="rounded-lg bg-surface-emphasis p-2.5 text-[12px] leading-relaxed text-muted-foreground">
        Texterna används i svarsrutan på ett ärende. Platshållarna{' '}
        <code className="rounded bg-card px-1 py-0.5 text-[11px]">{'{{kundnamn}}'}</code> och{' '}
        <code className="rounded bg-card px-1 py-0.5 text-[11px]">{'{{tekniker}}'}</code> fylls i
        automatiskt när svaret används.
      </p>

      <ul className="flex flex-col gap-1.5">
        {standardsvar.map((svar) => {
          const redigeras = redigerarId === svar.id

          return (
            <li key={svar.id} className="rounded-lg bg-surface-emphasis p-3">
              {redigeras ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`rubrik-${svar.id}`}>Rubrik</Label>
                    <Input
                      id={`rubrik-${svar.id}`}
                      value={rubrik}
                      autoFocus
                      className="bg-card"
                      onChange={(e) => setRubrik(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`text-${svar.id}`}>Text</Label>
                    <Textarea
                      id={`text-${svar.id}`}
                      value={text}
                      rows={5}
                      className="resize-y bg-card"
                      onChange={(e) => setText(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={sparar}
                      onClick={() => setRedigerarId(null)}
                    >
                      Avbryt
                    </Button>
                    <Button
                      size="sm"
                      disabled={sparar || !rubrik.trim() || !text.trim()}
                      onClick={() => spara(svar.id)}
                    >
                      {sparar && <Spinner data-icon="inline-start" />}
                      Spara
                    </Button>
                  </div>
                </div>
              ) : (
                <Collapsible>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CollapsibleTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="group -ml-2 h-auto py-1 font-medium"
                        >
                          <ChevronDownIcon
                            data-icon="inline-start"
                            className="transition-transform group-data-panel-open:rotate-180"
                          />
                          {svar.rubrik}
                        </Button>
                      }
                    />
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-card px-2 py-0.5 text-[11px] leading-5 text-muted-foreground">
                        {svar.kategori}
                      </span>
                      {kanAndra && (
                        <Button variant="ghost" size="sm" onClick={() => borjaRedigera(svar)}>
                          <PencilIcon data-icon="inline-start" />
                          Ändra
                        </Button>
                      )}
                    </div>
                  </div>
                  <CollapsibleContent>
                    <p className="mt-2 whitespace-pre-wrap text-pretty rounded-lg bg-card p-2.5 text-[13px] leading-relaxed text-text-secondary">
                      {svar.text}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </li>
          )
        })}
      </ul>
    </Yta>
  )
}
