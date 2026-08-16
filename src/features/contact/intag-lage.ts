/**
 * Låser det publika ärendeintaget utan att ta ner webbplatsen.
 *
 * Syftet är att kunna ha hela sajten publikt uppe - inklusive
 * supportassistenten, som är helt lokal och inte skickar något någonstans -
 * medan själva inskickningen är stängd tills externt penetrationstest och
 * juridisk granskning är gjorda. Kunden ska aldrig fylla i ett formulär som
 * ändå kommer avvisas, så läget speglas också ärligt i gränssnittet.
 *
 * Läget läses ur miljövariabeln `PUBLIK_INTAG_LAGE` på servern. Den är
 * server-only och kan aldrig sättas eller kringgås från besökarens
 * webbläsare. Kontrollen görs i `skickaKontaktforfragan` innan något annat
 * händer, så ett stängt intag håller även om någon anropar serverfunktionen
 * direkt utan att ha sett gränssnittet.
 */
export type IntagLage = "oppen" | "stangd";

/**
 * Default är `oppen`. En felstavad eller saknad variabel ska inte tyst
 * stänga av ärendeintaget för alla kunder - det vore ett värre fel än att
 * den behöver sättas medvetet för att låsa.
 */
export function lasIntagLage(varde: string | undefined): IntagLage {
  return varde?.trim().toLocaleLowerCase("sv") === "stangd" ? "stangd" : "oppen";
}

/**
 * Texten kunden ser när intaget är låst. Säger vad som gäller och vart man
 * vänder sig i stället - aldrig ett tekniskt fel eller en tom sida.
 */
export const INTAG_STANGT_MEDDELANDE =
  "Vi tar just nu emot ärenden via e-post i stället för formuläret. Skriv till kontakt@nova-it.se så återkommer vi som vanligt.";
