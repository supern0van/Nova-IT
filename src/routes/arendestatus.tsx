import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Clock, Hourglass, LockKeyhole, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Container, PageHeader } from "@/components/design-system";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/turnstile-widget";
import { JsonLd } from "@/components/json-ld";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";
import { KUNDPORTAL_ORIGIN } from "@/lib/security-policy";
import {
  lookupCaseStatus,
  type PubliktArendeStatus,
} from "@/features/case-status/case-status-server";
import {
  GRUNDSTEG,
  aktivtGrundsteg,
  kategoriEtikett,
  statusEtikett,
  statusVagledning,
} from "@/features/case-status/case-status-labels";
import { cn } from "@/lib/utils";

const caseStatusUrl = "https://nova-it.se/arendestatus";
const caseStatusTitle = "Följ ditt ärende – Nova IT";
const caseStatusDescription =
  "Se status på ditt ärende med ärendenummer och e-post - ingen inloggning krävs.";

export const Route = createFileRoute("/arendestatus")({
  head: () => ({
    meta: [
      { title: caseStatusTitle },
      { name: "description", content: caseStatusDescription },
      { property: "og:title", content: caseStatusTitle },
      { property: "og:description", content: caseStatusDescription },
      { property: "og:url", content: caseStatusUrl },
      { name: "twitter:title", content: caseStatusTitle },
      { name: "twitter:description", content: caseStatusDescription },
    ],
    links: [{ rel: "canonical", href: caseStatusUrl }],
  }),
  component: ArendestatusPage,
});

const STATUS_IKON: Record<string, typeof Clock> = {
  ny: Clock,
  pagaende: Clock,
  vantar_pa_kund: Hourglass,
  bokad: Clock,
  lost: CheckCircle2,
  stangd: LockKeyhole,
};

function StatusMarke({ status }: { status: string }) {
  const Ikon = STATUS_IKON[status] ?? Clock;
  const varm = status === "vantar_pa_kund";
  const klar = status === "lost" || status === "stangd";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium",
        varm && "bg-amber-400/15 text-amber-300",
        klar && "bg-emerald-400/15 text-emerald-300",
        !varm && !klar && "bg-sky-300/15 text-sky-300",
      )}
    >
      <Ikon className="h-3.5 w-3.5" aria-hidden="true" />
      {statusEtikett(status)}
    </span>
  );
}

/** Enkel steg-för-steg-visning, samma tregrundsteg-modell som kundportalens
 *  Framstegssparning (se case-status-labels.ts) - en lättare version utan
 *  personalens extrasteg, eftersom den publika statuskollen medvetet inte
 *  returnerar dem här (adminportalens svar har fältet, men den här sidan
 *  håller sig till de tre grundstegen för att inte duplicera hela
 *  komponenten för en engångsvy). */
function Framstegssparning({ status }: { status: string }) {
  const aktivt = aktivtGrundsteg(status);

  return (
    <ol className="flex items-center" aria-label="Ärendets framsteg">
      {GRUNDSTEG.map((etikett, index) => {
        const klar = index < aktivt;
        const aktiv = index === aktivt;
        return (
          <li
            key={etikett}
            aria-current={aktiv ? "step" : undefined}
            className="flex flex-1 items-center last:flex-none"
          >
            <div className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full border-2 text-[13px] font-semibold",
                  klar && "border-emerald-400 bg-emerald-400 text-[#04101c]",
                  aktiv && !klar && "border-sky-300 bg-sky-300 text-[#04101c]",
                  !aktiv && !klar && "border-white/20 bg-transparent text-slate-500",
                )}
              >
                {klar ? <CheckCircle2 className="size-4" aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={cn(
                  "max-w-24 text-center text-[12px] font-medium",
                  aktiv || klar ? "text-white" : "text-slate-500",
                )}
              >
                {etikett}
              </span>
            </div>
            {index < GRUNDSTEG.length - 1 && (
              <span
                className={cn(
                  "mx-2 h-0.5 flex-1 rounded-full",
                  klar ? "bg-emerald-400" : "bg-white/15",
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ArendeResultat({ arende }: { arende: PubliktArendeStatus }) {
  const vagledning = statusVagledning(arende.status);

  return (
    <Card className="mt-6 border-white/12 bg-[#0c141d] text-white">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-slate-400">{arende.arendenummer}</p>
            <h2 className="mt-1 text-xl font-semibold">{arende.rubrik}</h2>
            <p className="mt-1 text-[13px] text-slate-400">{kategoriEtikett(arende.kategori)}</p>
          </div>
          <StatusMarke status={arende.status} />
        </div>

        <div className="mt-6">
          <Framstegssparning status={arende.status} />
        </div>

        <div className="mt-6 rounded-md border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">{vagledning.rubrik}</p>
          <p className="mt-1 text-[13px] leading-6 text-slate-300">{vagledning.beskrivning}</p>
        </div>

        <p className="mt-4 text-[12px] text-slate-500">
          Senast uppdaterad{" "}
          {new Date(arende.uppdaterad).toLocaleDateString("sv-SE", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>

        <p className="mt-6 text-[13px] leading-6 text-slate-300">
          Vill du läsa hela konversationen, svara Nova IT eller ladda upp en fil?{" "}
          <a
            href={`${KUNDPORTAL_ORIGIN}/logga-in`}
            className="font-medium text-sky-300 underline underline-offset-2 hover:text-sky-200"
          >
            Logga in i kundportalen
          </a>
          .
        </p>
      </CardContent>
    </Card>
  );
}

type SokLage = "vila" | "skickar" | "hittades_inte" | "fel";

function ArendestatusPage() {
  const [arendenummer, setArendenummer] = useState("");
  const [epost, setEpost] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [lage, setLage] = useState<SokLage>("vila");
  const [felmeddelande, setFelmeddelande] = useState<string | null>(null);
  const [arende, setArende] = useState<PubliktArendeStatus | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const kanSoka = Boolean(turnstileToken) && lage !== "skickar";

  async function sok(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLage("skickar");
    setFelmeddelande(null);
    setArende(null);

    try {
      const resultat = await lookupCaseStatus({
        data: {
          arendenummer: arendenummer.trim(),
          epost: epost.trim(),
          turnstileToken,
        },
      });

      if (!resultat.ok) {
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        if (resultat.fel === "sparrat") {
          setFelmeddelande("För många försök. Vänta en stund och försök igen.");
        } else if (resultat.fel === "turnstile") {
          setFelmeddelande("Verifieringen kunde inte genomföras. Ladda om sidan och försök igen.");
        } else {
          setFelmeddelande("Något gick fel just nu. Försök igen om en stund.");
        }
        setLage("fel");
        return;
      }

      if (!resultat.funnet) {
        turnstileRef.current?.reset();
        setTurnstileToken(null);
        setLage("hittades_inte");
        return;
      }

      setArende(resultat.arende);
      setLage("vila");
    } catch {
      turnstileRef.current?.reset();
      setTurnstileToken(null);
      setFelmeddelande("Något gick fel just nu. Försök igen om en stund.");
      setLage("fel");
    }
  }

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Hem", url: "https://nova-it.se/" },
          { name: "Följ ditt ärende", url: caseStatusUrl },
        ])}
      />
      <PageHeader
        eyebrow="Följ ditt ärende"
        title="Är ni på väg? Så här ligger det till."
        intro="Ange ärendenumret och e-postadressen du fick i bekräftelsen så visar vi ärendets status - ingen inloggning behövs."
      />

      <section className="nova-section">
        <Container className="max-w-xl py-14">
          <Card className="border-white/12 bg-[#0c141d] text-white">
            <CardContent className="p-6">
              <form onSubmit={sok} className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="arendenummer" className="text-slate-200">
                    Ärendenummer
                  </Label>
                  <Input
                    id="arendenummer"
                    name="arendenummer"
                    required
                    autoComplete="off"
                    placeholder="NIT-1234"
                    value={arendenummer}
                    onChange={(event) => setArendenummer(event.target.value)}
                    className="mt-1.5 border-white/15 bg-[#070d14] text-white placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <Label htmlFor="epost" className="text-slate-200">
                    E-post
                  </Label>
                  <Input
                    id="epost"
                    name="epost"
                    type="email"
                    required
                    autoComplete="email"
                    value={epost}
                    onChange={(event) => setEpost(event.target.value)}
                    className="mt-1.5 border-white/15 bg-[#070d14] text-white placeholder:text-slate-600"
                  />
                </div>

                <TurnstileWidget
                  ref={turnstileRef}
                  action="arendestatus"
                  onToken={setTurnstileToken}
                />

                {lage === "hittades_inte" && (
                  <p
                    role="alert"
                    className="flex items-start gap-2 text-[13px] leading-6 text-amber-300"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    Vi hittade inget ärende med den kombinationen. Kontrollera ärendenumret och
                    e-postadressen - båda måste stämma exakt med bekräftelsen du fick.
                  </p>
                )}

                {felmeddelande && (
                  <p role="alert" className="text-[13px] leading-6 text-rose-300">
                    {felmeddelande}
                  </p>
                )}

                <Button type="submit" disabled={!kanSoka} className="mt-2 w-full gap-2">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  {lage === "skickar" ? "Söker…" : "Visa status"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {arende && <ArendeResultat arende={arende} />}
        </Container>
      </section>
    </>
  );
}
