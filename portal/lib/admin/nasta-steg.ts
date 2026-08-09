import type { ArendeStatus } from '@/lib/types'

export interface AdminNastaSteg {
  rubrik: string
  beskrivning: string
}

export function adminNastaSteg(status: ArendeStatus, harAnsvarig: boolean): AdminNastaSteg {
  if (!harAnsvarig && status !== 'lost' && status !== 'stangd') {
    return {
      rubrik: 'Tilldela en ansvarig',
      beskrivning: 'Välj vem som äger ärendet innan nästa kundkontakt.',
    }
  }

  const steg: Record<ArendeStatus, AdminNastaSteg> = {
    ny: {
      rubrik: 'Bekräfta ärendet för kunden',
      beskrivning: 'Skicka ett första svar och dokumentera när kunden kan vänta sig nästa uppdatering.',
    },
    pagaende: {
      rubrik: 'Driv ärendet framåt',
      beskrivning: 'Dokumentera arbetet och ge kunden en tydlig nästa uppdatering.',
    },
    vantar_pa_kund: {
      rubrik: 'Invänta eller följ upp kundens svar',
      beskrivning: 'Kontrollera senaste meddelandet och påminn kunden vid behov.',
    },
    bokad: {
      rubrik: 'Förbered bokningen',
      beskrivning: 'Bekräfta tid, plats och vad kunden behöver göra före besöket.',
    },
    lost: {
      rubrik: 'Slutför dokumentationen',
      beskrivning: 'Kontrollera att lösning och kundkommunikation finns dokumenterade.',
    },
    stangd: {
      rubrik: 'Ingen aktiv åtgärd',
      beskrivning: 'Ärendet är avslutat. Öppna ett nytt ärende om kunden behöver mer hjälp.',
    },
  }

  return steg[status]
}
