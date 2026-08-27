/**
 * Svenskt UX-språk för ärendestatuskollen, portering (inte import - de två
 * repona delar inget gemensamt paket) av kundportalens
 * `lib/arende-status.ts`s `ETIKETTER`/`VAGLEDNING`, samt en spegling av
 * adminportalens `Kategori`-värden (`lib/admin/publikt-intag-server.ts`s
 * `tjanstTillKategori`, omvänt).
 */

const STATUS_ETIKETTER: Record<string, string> = {
  ny: "Ny",
  pagaende: "Pågående",
  vantar_pa_kund: "Väntar på dig",
  bokad: "Bokad",
  lost: "Löst",
  stangd: "Stängd",
};

const STATUS_VAGLEDNING: Record<string, string> = {
  ny: "Ärendet är mottaget och väntar på att en tekniker tar sig an det.",
  pagaende: "En tekniker arbetar just nu med ärendet.",
  vantar_pa_kund: "Vi väntar på ett svar eller en uppgift från dig för att kunna gå vidare.",
  bokad: "Ett besök eller en tid är inbokad för ärendet.",
  lost: "Ärendet är löst. Hör av dig om problemet kommer tillbaka.",
  stangd: "Ärendet är stängt.",
};

const KATEGORI_ETIKETTER: Record<string, string> = {
  datorer_vardags_it: "Datorer & vardags-IT",
  natverk_wifi: "Nätverk & wifi",
  konton_moln_sakerhet: "Konton, moln & säkerhet",
  installation: "Installation",
  sakerhet_virus: "Säkerhet & virus",
};

export function statusEtikett(status: string): string {
  return STATUS_ETIKETTER[status] ?? status;
}

export function statusVagledning(status: string): string {
  return STATUS_VAGLEDNING[status] ?? "";
}

export function kategoriEtikett(kategori: string): string {
  return KATEGORI_ETIKETTER[kategori] ?? kategori;
}

export function formateraDatum(iso: string): string {
  try {
    return new Intl.DateTimeFormat("sv-SE", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
