import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, HelpCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Container, PageHeader } from "@/components/design-system";
import { JsonLd } from "@/components/json-ld";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";
import { contactChannels } from "@/lib/nova-data";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/turnstile-widget";
import {
  checkTicketStatus,
  type ArendeStatusResultat,
} from "@/features/status-check/status-check-server";
import {
  formateraDatum,
  kategoriEtikett,
  statusEtikett,
  statusVagledning,
} from "@/features/status-check/status-labels";

const pageUrl = "https://nova-it.se/arendestatus";
const pageTitle = "Kolla ärendestatus – Nova IT";
const pageDescription = "Se status på ditt ärende med ärendenummer och e-post, utan att logga in.";

export const Route = createFileRoute("/arendestatus")({
  head: () => ({
    meta: [
      { title: pageTitle },
      { name: "description", content: pageDescription },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: pageDescription },
      { property: "og:url", content: pageUrl },
    ],
    links: [{ rel: "canonical", href: pageUrl }],
  }),
  component: ArendestatusPage,
});

function ArendestatusPage() {
  const [ticketNumber, setTicketNumber] = useState("");
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const [formRenderedAt] = useState(() => Date.now());
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ArendeStatusResultat | "not_found" | null>(null);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsChecking(true);

    try {
      const svar = await checkTicketStatus({
        data: {
          ticketNumber,
          email,
          website,
          formRenderedAt,
          turnstileToken,
        },
      });
      setResult(svar.funnet ? svar.arende : "not_found");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Uppslaget kunde inte genomföras just nu. Försök igen om en stund.",
      );
      turnstileRef.current?.reset();
      setTurnstileToken(null);
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Hem", url: "https://nova-it.se/" },
          { name: "Ärendestatus", url: pageUrl },
        ])}
      />
      <PageHeader
        eyebrow="Ärendestatus"
        title="Se hur det går med ditt ärende"
        intro="Ange ärendenumret och e-postadressen du fick när ärendet skapades - ingen inloggning krävs."
      />

      <section className="nova-section">
        <Container className="max-w-xl py-14 lg:py-18">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="ticketNumber">Ärendenummer</Label>
                  <Input
                    id="ticketNumber"
                    name="ticketNumber"
                    placeholder="NIT-2601"
                    value={ticketNumber}
                    onChange={(event) => setTicketNumber(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-postadress</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="du@example.se"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                {/* Honeypot - osynligt/onåbart för en människa som fyller i
                    formuläret normalt. Se status-check-server.ts. */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="website">Lämna detta fält tomt</label>
                  <input
                    id="website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                  />
                </div>

                <TurnstileWidget
                  action="statuskoll"
                  onToken={setTurnstileToken}
                  ref={turnstileRef}
                />

                {error && (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-left text-sm text-muted-foreground"
                  >
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <p>
                      {error}{" "}
                      <a
                        className="font-medium text-primary underline-offset-4 hover:underline"
                        href={`mailto:${contactChannels.contact}`}
                      >
                        Skriv till {contactChannels.contact}
                      </a>
                      .
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isChecking || !turnstileToken}
                  className="w-full sm:w-auto"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  {isChecking ? "Söker..." : !turnstileToken ? "Verifierar..." : "Visa status"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {result === "not_found" && (
            <div
              role="status"
              className="mt-6 flex gap-3 rounded-lg border border-border bg-secondary/35 p-5 text-sm text-muted-foreground"
            >
              <HelpCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <p>
                Vi hittade inget ärende som matchar ärendenumret och e-postadressen. Kontrollera
                stavningen, eller{" "}
                <a
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  href={`mailto:${contactChannels.contact}`}
                >
                  skriv till {contactChannels.contact}
                </a>
                .
              </p>
            </div>
          )}

          {result && result !== "not_found" && (
            <div role="status" className="mt-6 rounded-lg border border-border bg-card p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {result.arendenummer}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">{result.rubrik}</h2>
                </div>
              </div>

              <div className="mt-5 grid gap-px overflow-hidden rounded-lg border border-border bg-border text-left sm:grid-cols-2">
                <div className="bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Status
                  </p>
                  <p className="mt-1.5 font-medium">{statusEtikett(result.status)}</p>
                </div>
                <div className="bg-card p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Kategori
                  </p>
                  <p className="mt-1.5 font-medium">{kategoriEtikett(result.kategori)}</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {statusVagledning(result.status)}
              </p>

              {result.steg.length > 0 && (
                <ol className="mt-5 space-y-3 border-t border-border pt-5">
                  {result.steg.map((steg) => (
                    <li
                      key={steg.nyckel}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="font-medium">{steg.etikett}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {formateraDatum(steg.tidpunkt)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              <p className="mt-5 text-xs text-muted-foreground">
                Senast uppdaterad {formateraDatum(result.uppdaterad)}. Vill du svara eller se hela
                konversationen? Logga in i{" "}
                <a
                  className="font-medium text-primary underline-offset-4 hover:underline"
                  href="https://portal.nova-it.se"
                >
                  kundportalen
                </a>
                .
              </p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
