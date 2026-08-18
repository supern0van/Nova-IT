---
id: NOVA-0048
date: 2026-08-18
date_precision: day
type: changed
status: completed
systems:
  - publik-webbplats
---

# Bygg om ärendeguidens panel till tre fasta delar

## Vad ändrades?

Ren frontend-/layout-omarbetning av chattpanelen (`SupportChat.tsx` + `chat/*`
i `src/features/support/`). Panelen består nu tydligt av tre fasta delar:

1. **Konversationsyta** - det enda som scrollar. Snabbsvarsknappar ligger
   inte längre kvar som stora kort i historiken; bara faktisk dialog
   (kundens meddelanden, guidens/AI:ns svar, källhänvisningar) visas där.
2. **Aktuella val** - en egen, fast placerad yta direkt ovanför inputfältet.
   Visar bara den SENASTE turens snabbsvarsförslag - inte en växande lista
   av gamla alternativ som byggs upp allteftersom konversationen fortsätter.
3. **Inmatning** - alltid synlig längst ned, aldrig bakom scroll. Länken för
   att eskalera till en människa flyttades hit som en diskret rad i
   footern, istället för att ligga blandad i konversationshistoriken.

Övriga förbättringar: autoscroll sker bara när användaren redan var nära
botten av konversationen (stör inte någon som aktivt scrollat upp för att
läsa äldre meddelanden), smalare/diskretare scrollbar, färre synliga
borders (användarbubblan, snabbsvarschips, källchips och
sessionsgräns-notisen använder nu bakgrund/kontrast istället för inramning).
Säkerhetsvarningen (`SafetyNotice`) behåller medvetet sin tydliga ram - den
ska fortsätta sticka ut. `chat/EscalationLink.tsx` togs bort (ersatt av en
motsvarande länk inbyggd i `ChatComposer.tsx`, ingen anropande kod kvar).

## Varför?

Panelen kändes fortfarande opolerad och mer som ett formulär än en modern
konversation: för stora alternativrutor, ramar-i-ramar, val som blandades
ihop med själva dialogen, en framträdande scrollbar, och input/aktuella val
som kunde hamna långt ifrån varandra. Detta är en ren UI/UX-beställning från
ägaren - AI-logiken, Workers AI-integrationen, serverfunktionerna och
`SUPPORT_AI_LAGE`/`SUPPORT_CHAT_LAGE` rörs medvetet inte alls.

## Resultat

- 133 tester gröna (`bun test`), typecheck och lint rena, produktionsbygge
  verifierat.
- Ingen ändring i `support-chat.ts`, `support-chat-server.ts`,
  `support-tools.ts`, `support-knowledge.ts` eller någon serverfunktion.
- Samma funktionalitet som innan (fritext, snabbsvarsval, spårbyte,
  fortsatt AI-dialog, övergång till ärendeskapande) - bara presentationen
  är omarbetad.

## Dokumentationspåverkan

Ingen - ren visuell polering av redan dokumenterad funktion (NOVA-0047),
inget nytt produktbeslut eller arkitekturändring.
