import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { LegalDialogTrigger } from "@/components/legal-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { contactChannels, contactNotice, getServiceBySlug, services } from "@/lib/nova-data";
import { Container } from "@/components/design-system";
import { getIntagLage, submitContactRequest } from "@/features/contact/contact-server";
import { INTAG_STANGT_MEDDELANDE } from "@/features/contact/intag-lage";
import {
  composeContactMessage,
  type ContactAssistantContext,
} from "@/features/contact/contact-submission";
import { consumeSupportHandoff } from "@/features/support/support-handoff";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/turnstile-widget";
import { JsonLd } from "@/components/json-ld";
import { buildBreadcrumbJsonLd } from "@/lib/structured-data";

const contactUrl = "https://nova-it.se/kontakt";
const contactTitle = "Kontakta Nova IT";
const contactDescription = "Berätta vad som krånglar så återkommer Nova IT med en bra start.";
const socialImageUrl = "https://nova-it.se/nova-it-workspace.png";

export const Route = createFileRoute("/kontakt")({
  validateSearch: (search: Record<string, unknown>) => {
    const service = typeof search.service === "string" ? search.service : undefined;
    const handoff = search.handoff === "assistant" ? ("assistant" as const) : undefined;
    if (search.form !== "request") return { service };
    return handoff
      ? { service, form: "request" as const, handoff }
      : { service, form: "request" as const };
  },
  head: () => ({
    meta: [
      { title: contactTitle },
      { name: "description", content: contactDescription },
      { property: "og:title", content: contactTitle },
      {
        property: "og:description",
        content: "Berätta vad som krånglar med datorer, nätverk, installationer eller konton.",
      },
      { property: "og:url", content: contactUrl },
      { property: "og:image", content: socialImageUrl },
      { name: "twitter:title", content: contactTitle },
      { name: "twitter:description", content: contactDescription },
      { name: "twitter:image", content: socialImageUrl },
    ],
    links: [{ rel: "canonical", href: contactUrl }],
  }),
  component: ContactPage,
});

const MESSAGE_MAX = 1000;
const customerTypes = ["Privatperson", "Företag", "Skola", "Annat"] as const;
const urgencyLevels = ["Planerat", "Normal", "Akut"] as const;
const preparationTips = [
  "Vilken enhet, användare eller plats gäller det?",
  "När började problemet och händer det hela tiden?",
  "Vad har redan testats: omstart, annan kabel, annan plats eller webbläsare?",
];

const schema = z
  .object({
    name: z.string().trim().min(2, "Ange ditt namn med minst två tecken").max(100),
    email: z.string().trim().email("Ange en giltig e-postadress").max(255),
    phone: z.string().trim().max(60, "Kontaktvägen får vara högst 60 tecken"),
    customerType: z.enum(customerTypes, {
      message: "Välj vilken typ av kund ärendet gäller",
    }),
    companyName: z.string().trim().max(160, "Verksamhetens namn får vara högst 160 tecken"),
    service: z.string().min(1, "Välj vilken tjänst som passar bäst"),
    urgency: z.enum(urgencyLevels, { message: "Välj hur brådskande ärendet är" }),
    message: z
      .string()
      .trim()
      .min(10, "Beskriv ärendet med minst 10 tecken")
      .max(MESSAGE_MAX, `Beskrivningen får vara högst ${MESSAGE_MAX} tecken`),
    privacyAcknowledged: z.boolean().refine((value) => value, {
      message: "Bekräfta att du har tagit del av integritetspolicyn",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.customerType !== "Privatperson" && !data.companyName.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["companyName"],
        message: "Ange verksamhetens namn",
      });
    }
  });

type FormValues = {
  name: string;
  email: string;
  phone: string;
  customerType: "" | (typeof customerTypes)[number];
  companyName: string;
  service: string;
  urgency: "" | (typeof urgencyLevels)[number];
  message: string;
  privacyAcknowledged: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;
type AssistantContext = ContactAssistantContext & {
  guidance: string;
};
type FieldControlProps = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

function createInitialValues(service = ""): FormValues {
  return {
    name: "",
    email: "",
    phone: "",
    customerType: "",
    companyName: "",
    service,
    urgency: "",
    message: "",
    privacyAcknowledged: false,
  };
}

function ContactPage() {
  const search = Route.useSearch();
  const selectedService = getServiceBySlug(search.service);
  const selectedServiceTitle = selectedService?.title ?? "";
  const [submitted, setSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [arendenummer, setArendenummer] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [assistantHandoffApplied, setAssistantHandoffApplied] = useState(false);
  const [assistantContext, setAssistantContext] = useState<AssistantContext | null>(null);
  const [handoffMissing, setHandoffMissing] = useState(false);
  const [values, setValues] = useState<FormValues>(() => createInitialValues(selectedServiceTitle));
  // Stabil per formulärsession - samma nyckel skickas med vid varje
  // sändningsförsök av SAMMA inskickning (dubbelklick, nätverksretry), så
  // adminportalen kan känna igen och avvisa dubbletter. Ny nyckel genereras
  // bara när formuläret faktiskt återställs (resetForm), inte vid varje
  // omrendering.
  const idempotencyKeyRef = useRef(crypto.randomUUID());
  // Spam-/missbruksskydd: se skickaKontaktforfragan() i contact-server.ts
  // för varför dessa tre kontrolleras server-side, inte bara här.
  const formRenderedAtRef = useRef<number | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // Fynd (granskning 2026-08-25, #1) - Turnstile-tokens är engångsanvändbara.
  // Utan den här handtaget skickades samma redan förbrukade token med igen
  // vid ett omförsök efter ett misslyckat inskick, vilket garanterat
  // misslyckades igen - kunden fastnade och behövde ladda om sidan.
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  // Presentationsläge - den bindande kontrollen sitter server-side i
  // skickaKontaktforfragan(). Startar som "oppen" så att formuläret inte
  // blinkar förbi som stängt innan serverns svar hunnit fram.
  const [intagStangt, setIntagStangt] = useState(false);

  useEffect(() => {
    let avbruten = false;
    getIntagLage()
      .then((lage) => {
        if (!avbruten) setIntagStangt(lage === "stangd");
      })
      .catch(() => {
        // Kan inte läsa läget: låt formuläret vara synligt. Servern stoppar
        // ändå inskickningen om intaget faktiskt är stängt.
      });
    return () => {
      avbruten = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedServiceTitle) return;
    // The URL search parameter can change without remounting the route.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues((current) =>
      current.service ? current : { ...current, service: selectedServiceTitle },
    );
  }, [selectedServiceTitle]);

  useEffect(() => {
    formRenderedAtRef.current ??= Date.now();
  }, []);

  useEffect(() => {
    if (search.handoff !== "assistant") return;
    const handoff = consumeSupportHandoff();
    if (!handoff) {
      // Guiden bad om att skicka med en konversation (?handoff=assistant), men
      // sessionStorage-underlaget saknas eller kunde inte tolkas (blockerad
      // lagring, för kort kontaktorsak - se parseSupportHandoff). Utan den
      // här flaggan landar kunden på en helt tom formulärsida utan minsta
      // förklaring till varför deras chatt inte följde med.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHandoffMissing(true);
      return;
    }
    const handoffService = getServiceBySlug(handoff.serviceSlug);

    // The handoff is consumed from browser sessionStorage after hydration.
    setValues((current) => ({
      ...current,
      message: current.message || handoff.customerDescription,
      service: current.service || handoffService?.title || "",
      urgency:
        current.urgency ||
        (handoff.urgency === "urgent" || handoff.urgency === "priority" ? "Akut" : ""),
    }));
    setAssistantContext({
      contactReason: handoff.contactReason,
      context: handoff.context,
      guidance: handoff.guidance,
      transcript: handoff.transcript,
    });
    setAssistantHandoffApplied(true);
  }, [search.handoff]);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function resetForm() {
    setSubmitted(false);
    setIsSending(false);
    setSent(false);
    setSendError(null);
    setErrors({});
    setAssistantContext(null);
    setAssistantHandoffApplied(false);
    setValues(createInitialValues(selectedServiceTitle));
    setArendenummer(null);
    setConfirmationSent(true);
    idempotencyKeyRef.current = crypto.randomUUID();
    formRenderedAtRef.current = Date.now();
    setHoneypot("");
  }

  // Skiljer sig från resetForm(): tar bara tillbaka till redigeringsvyn utan
  // att tömma det som redan fyllts i - "Ändra uppgifter" ska låta kunden
  // justera sina svar, inte börja om från noll.
  function goBackToEdit() {
    setSubmitted(false);
    setSendError(null);
  }

  async function sendContactRequest() {
    setIsSending(true);
    setSendError(null);

    const tjanstSlug = services.find((tjanst) => tjanst.title === values.service)?.slug ?? "";

    try {
      const resultat = await submitContactRequest({
        data: {
          kalla: assistantHandoffApplied ? "supportassistent" : "kontaktformular",
          name: values.name,
          email: values.email,
          phone: values.phone,
          customerType: values.customerType as (typeof customerTypes)[number],
          companyName: values.companyName,
          service: values.service,
          tjanstSlug,
          urgency: values.urgency as (typeof urgencyLevels)[number],
          message: composeContactMessage(values.message, assistantContext),
          idempotencyKey: idempotencyKeyRef.current,
          website: honeypot,
          formRenderedAt: formRenderedAtRef.current ?? Date.now(),
          turnstileToken,
        },
      });
      setArendenummer(resultat.arendenummer);
      setConfirmationSent(resultat.confirmationSent);
      setSent(true);
    } catch (error) {
      console.error("Contact request submission failed.", error);
      setSendError(
        "Ärendet kunde inte skickas just nu. Försök igen om en stund eller skriv direkt till oss.",
      );
      // Den redan skickade token:en är förbrukad oavsett vad som gick fel
      // server-side - utan att begära en ny hade ett omförsök misslyckats
      // garanterat, oavsett hur många gånger kunden klickade "Skicka".
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    } finally {
      setIsSending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = schema.safeParse(values);

    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (!next[key]) next[key] = issue.message;
      }

      setErrors(next);
      const firstInvalidField = parsed.error.issues[0]?.path[0];
      if (typeof firstInvalidField === "string") {
        window.requestAnimationFrame(() => document.getElementById(firstInvalidField)?.focus());
      }
      return;
    }

    setErrors({});
    setSubmitted(true);
  }

  if (!("form" in search) || search.form !== "request") {
    return <ContactInformation />;
  }

  // Låst intag: visa aldrig ett formulär som ändå kommer avvisas. Resten av
  // webbplatsen, inklusive supportassistenten, fungerar som vanligt.
  if (intagStangt) {
    return (
      <section className="border-b border-border bg-secondary/35">
        <Container className="max-w-2xl py-20 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary text-muted-foreground">
            <Mail className="h-7 w-7" />
          </span>
          <p className="eyebrow mt-6">Kontakt</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
            Skriv till oss direkt så länge
          </h1>
          <p className="mt-4 text-muted-foreground">{INTAG_STANGT_MEDDELANDE}</p>
          <p className="mt-7">
            <a
              href={`mailto:${contactChannels.contact}`}
              className="text-lg font-semibold text-primary underline underline-offset-4"
            >
              {contactChannels.contact}
            </a>
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Beskriv vad som krånglar, när det började och vad det påverkar, så återkommer vi med hur
            vi bäst kan hjälpa till.
          </p>
        </Container>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="border-b border-border bg-secondary/35">
        <Container className="max-w-2xl py-20 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-300/15 text-emerald-200">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="eyebrow mt-6">Kontaktförfrågan</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
            {sent
              ? confirmationSent
                ? "Tack, din förfrågan är mottagen"
                : "Din förfrågan är registrerad"
              : "Granska innan du skickar"}
          </h1>
          {sent && arendenummer && (
            <p className="mt-4 font-mono text-lg font-semibold text-foreground">
              Ärendenummer: {arendenummer}
            </p>
          )}
          <p className="mt-3 text-muted-foreground">
            {sent
              ? confirmationSent
                ? `En bekräftelse har skickats till ${values.email}.`
                : "Vi kunde inte skicka bekräftelsen just nu, men ärendet finns registrerat."
              : "När du skickar går ärendet direkt till Nova IT. Vi svarar till den e-postadress du har angett."}
          </p>
          <div className="mt-7 grid gap-px overflow-hidden rounded-lg border border-border bg-border text-left sm:grid-cols-2">
            <div className="bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Område
              </p>
              <p className="mt-2 font-medium">{values.service || "Ej vald"}</p>
            </div>
            <div className="bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Prioritet
              </p>
              <p className="mt-2 font-medium">{values.urgency || "Ej vald"}</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-border bg-card p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Din beskrivning
            </p>
            {assistantContext && (
              <div className="mt-3 rounded-md border border-border bg-secondary/35 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground">Kontaktorsak</p>
                <p className="mt-1 text-sm font-medium">{assistantContext.contactReason}</p>
                {assistantContext.context && (
                  <p className="mt-1 text-xs text-muted-foreground">{assistantContext.context}</p>
                )}
              </div>
            )}
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {values.message}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Kontaktväg: {values.email}
              {values.phone ? ` · ${values.phone}` : ""}
            </p>
          </div>
          {sendError && (
            <div
              role="alert"
              className="mt-4 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-left text-sm text-muted-foreground"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <p>
                {sendError}{" "}
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
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {!sent && (
              <div className="flex flex-col items-center gap-3 sm:items-start">
                <TurnstileWidget ref={turnstileRef} action="contact" onToken={setTurnstileToken} />
                {/* Widgeten monteras här, på samma steg som knappen, och
                    hinner inte alltid utfärda en token innan en snabb
                    användare hinner klicka - utan denna spärr skickades
                    turnstileToken: null med, vilket servern (som kräver
                    Turnstile i produktion) avvisar med ett generiskt fel som
                    inte förklarar varför. Väntar hellre en halv sekund. */}
                <Button onClick={sendContactRequest} disabled={isSending || !turnstileToken}>
                  {isSending ? "Skickar..." : !turnstileToken ? "Verifierar..." : "Skicka ärendet"}
                </Button>
              </div>
            )}
            <Button variant="outline" onClick={sent ? resetForm : goBackToEdit}>
              {sent ? "Skicka ett nytt ärende" : "Ändra uppgifter"}
            </Button>
          </div>
        </Container>
      </section>
    );
  }

  const errorEntries = Object.entries(errors);
  const messageLength = values.message.length;

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Hem", url: "https://nova-it.se/" },
          { name: "Kontakt", url: contactUrl },
        ])}
      />
      <section className="nova-page-header">
        <Container className="py-14 lg:py-18">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Kontakt</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal text-balance sm:text-5xl lg:text-6xl">
            Hur kan vi hjälpa dig?
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{contactNotice}</p>
        </Container>
      </section>

      <section className="nova-section">
        <Container className="py-14 lg:py-18">
          <div className="grid min-w-0 gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div className="min-w-0 lg:sticky lg:top-28">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                Inför kontakten
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-balance sm:text-4xl">
                Du behöver inte ha alla svar.
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                Berätta vad som krånglar och vad du redan har provat. Vi hjälper dig att reda ut
                resten.
              </p>

              {selectedService && (
                <div className="mt-7 rounded-md border border-sky-300/25 bg-sky-300/8 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">
                    Förvald tjänst
                  </p>
                  <p className="mt-2 font-semibold">{selectedService.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{selectedService.outcome}</p>
                </div>
              )}

              <div className="mt-8 space-y-4 text-sm">
                {contactChannels.showOnContactPage && (
                  <>
                    <ContactFact
                      icon={Mail}
                      title="Kontakt"
                      text={contactChannels.contact}
                      href={`mailto:${contactChannels.contact}`}
                    />
                    <ContactFact
                      icon={Mail}
                      title="Support"
                      text={contactChannels.support}
                      href={`mailto:${contactChannels.support}`}
                    />
                    <ContactFact
                      icon={Mail}
                      title="Allmänt"
                      text={contactChannels.general}
                      href={`mailto:${contactChannels.general}`}
                    />
                  </>
                )}
              </div>
              <div className="mt-7 rounded-md border border-white/10 bg-white/[0.035] p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-sky-300" />
                  <h2 className="text-sm font-semibold">Bra att ha med</h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-300">
                  {preparationTips.map((tip) => (
                    <li key={tip} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Card className="min-w-0 border-white/10 bg-white/[0.035] shadow-[0_24px_70px_-44px_rgb(0_0_0_/_0.9)]">
              <CardContent className="p-5 sm:p-7">
                {errorEntries.length > 0 && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm"
                  >
                    <p className="font-medium text-destructive">
                      Granska {errorEntries.length} fält innan du går vidare.
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                      {errorEntries.map(([key, message]) => (
                        <li key={key}>{message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <form onSubmit={onSubmit} noValidate className="grid gap-5">
                  <fieldset className="min-w-0 rounded-lg border border-border p-5">
                    <legend className="px-2 text-sm font-semibold">Dina uppgifter</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Namn" name="name" error={errors.name} required>
                        {(fieldProps) => (
                          <Input
                            {...fieldProps}
                            value={values.name}
                            onChange={(event) => update("name", event.target.value)}
                            autoComplete="name"
                            required
                          />
                        )}
                      </Field>
                      <Field label="E-post" name="email" error={errors.email} required>
                        {(fieldProps) => (
                          <Input
                            {...fieldProps}
                            type="email"
                            value={values.email}
                            onChange={(event) => update("email", event.target.value)}
                            autoComplete="email"
                            required
                          />
                        )}
                      </Field>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Telefon eller annan kontaktväg"
                        name="phone"
                        error={errors.phone}
                        hint="Valfritt. Skriv telefonnummer, Teams eller annan kontaktväg."
                      >
                        {(fieldProps) => (
                          <Input
                            {...fieldProps}
                            type="tel"
                            value={values.phone}
                            onChange={(event) => update("phone", event.target.value)}
                            autoComplete="tel"
                          />
                        )}
                      </Field>
                      <Field
                        label="Kundtyp"
                        name="customerType"
                        error={errors.customerType}
                        required
                      >
                        {(fieldProps) => (
                          <Select
                            value={values.customerType}
                            onValueChange={(value) =>
                              update("customerType", value as FormValues["customerType"])
                            }
                          >
                            <SelectTrigger {...fieldProps}>
                              <SelectValue placeholder="Välj kundtyp" />
                            </SelectTrigger>
                            <SelectContent>
                              {customerTypes.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </Field>
                      {values.customerType && values.customerType !== "Privatperson" && (
                        <Field
                          label="Verksamhetens namn"
                          name="companyName"
                          error={errors.companyName}
                          required
                        >
                          {(fieldProps) => (
                            <Input
                              {...fieldProps}
                              value={values.companyName}
                              onChange={(event) => update("companyName", event.target.value)}
                              autoComplete="organization"
                            />
                          )}
                        </Field>
                      )}
                    </div>
                  </fieldset>

                  <fieldset className="min-w-0 rounded-lg border border-border p-5">
                    <legend className="px-2 text-sm font-semibold">
                      Vad behöver du hjälp med?
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Tjänst"
                        name="service"
                        error={errors.service}
                        required
                        hint={
                          selectedService
                            ? `Förvalt från länken: ${selectedService.title}.`
                            : "Välj den tjänst som ligger närmast problemet."
                        }
                      >
                        {(fieldProps) => (
                          <Select
                            value={values.service}
                            onValueChange={(value) => update("service", value)}
                          >
                            <SelectTrigger {...fieldProps}>
                              <SelectValue placeholder="Välj tjänst" />
                            </SelectTrigger>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.slug} value={service.title}>
                                  {service.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </Field>
                      <Field
                        label="När behöver du hjälp?"
                        name="urgency"
                        error={errors.urgency}
                        required
                      >
                        {(fieldProps) => (
                          <Select
                            value={values.urgency}
                            onValueChange={(value) =>
                              update("urgency", value as FormValues["urgency"])
                            }
                          >
                            <SelectTrigger {...fieldProps}>
                              <SelectValue placeholder="Välj ungefärlig tidsram" />
                            </SelectTrigger>
                            <SelectContent>
                              {urgencyLevels.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </Field>
                    </div>

                    <div className="mt-4">
                      {handoffMissing && (
                        <div
                          role="status"
                          className="mb-4 rounded-md border border-amber-300/20 bg-amber-300/[0.045] px-4 py-3 text-sm leading-6 text-amber-100"
                        >
                          Vi kunde inte hämta konversationen från guiden automatiskt. Beskriv gärna
                          kort igen vad som händer nedan.
                        </div>
                      )}
                      {assistantContext && (
                        <div
                          className="mb-4 rounded-md border border-sky-300/20 bg-sky-300/[0.045] px-4 py-3"
                          aria-label="Kontaktorsak från den automatiska guiden"
                        >
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                            <LockKeyhole className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
                            Kontaktorsak från guiden
                          </div>
                          <p className="mt-2 text-sm font-medium text-slate-100">
                            {assistantContext.contactReason}
                          </p>
                          {assistantContext.context && (
                            <p className="mt-1 text-xs text-slate-400">
                              {assistantContext.context}
                            </p>
                          )}
                          <p className="mt-2 text-xs leading-5 text-slate-400">
                            {assistantContext.guidance}
                          </p>
                        </div>
                      )}
                      <Field
                        label={assistantContext ? "Din beskrivning" : "Beskriv ärendet"}
                        name="message"
                        error={errors.message}
                        required
                        hint={
                          assistantHandoffApplied
                            ? `Skriv med egna ord under den låsta kontaktorsaken. ${messageLength}/${MESSAGE_MAX} tecken använda.`
                            : `Minst 10 tecken. ${messageLength}/${MESSAGE_MAX} tecken använda.`
                        }
                      >
                        {(fieldProps) => (
                          <Textarea
                            {...fieldProps}
                            rows={6}
                            className="resize-none"
                            value={values.message}
                            onChange={(event) => update("message", event.target.value)}
                            placeholder={assistantContext?.guidance}
                            maxLength={MESSAGE_MAX}
                            required
                          />
                        )}
                      </Field>
                    </div>
                  </fieldset>

                  <fieldset className="min-w-0 rounded-lg border border-border p-5">
                    <legend className="px-2 text-sm font-semibold">Skicka förfrågan</legend>
                    <div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="privacyAcknowledged"
                          checked={values.privacyAcknowledged}
                          onCheckedChange={(checked) =>
                            update("privacyAcknowledged", checked === true)
                          }
                          aria-invalid={errors.privacyAcknowledged ? true : undefined}
                          aria-describedby={
                            errors.privacyAcknowledged
                              ? "privacy-hint privacy-error"
                              : "privacy-hint"
                          }
                        />
                        <div>
                          <Label htmlFor="privacyAcknowledged" className="text-sm font-medium">
                            Jag har tagit del av informationen om hur Nova IT hanterar mina
                            uppgifter.
                          </Label>
                          <p id="privacy-hint" className="mt-1 text-sm text-muted-foreground">
                            Läs{" "}
                            <LegalDialogTrigger
                              document="privacy"
                              className="underline underline-offset-4 hover:text-foreground"
                            >
                              integritetspolicyn
                            </LegalDialogTrigger>
                            . Skicka inte lösenord, bankuppgifter eller annan känslig information.
                            Undvik uppgifter om andra personer om de inte behövs för ärendet.
                          </p>
                        </div>
                      </div>
                      {errors.privacyAcknowledged && (
                        <p
                          id="privacy-error"
                          role="alert"
                          className="mt-1 text-sm text-destructive"
                        >
                          {errors.privacyAcknowledged}
                        </p>
                      )}
                    </div>

                    <Button type="submit" size="lg" className="mt-5 w-full sm:w-auto">
                      Visa ärendesammanfattning
                    </Button>
                  </fieldset>

                  {/* Honeypot - osynligt och onåbart för en människa som fyller i formuläret
                      normalt. Fyllt fält = troligen ett automatiserat skript, se
                      skickaKontaktforfragan() i contact-server.ts. */}
                  <div
                    aria-hidden="true"
                    className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
                  >
                    <label htmlFor="website" aria-hidden="true">
                      Lämna detta fält tomt
                    </label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      value={honeypot}
                      onChange={(event) => setHoneypot(event.target.value)}
                    />
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}

function ContactInformation() {
  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Hem", url: "https://nova-it.se/" },
          { name: "Kontakt", url: contactUrl },
        ])}
      />
      <section className="nova-page-header">
        <Container className="py-14 lg:py-18">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Kontakt</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-normal text-balance sm:text-5xl lg:text-6xl">
            Kontaktuppgifter
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            För en ny förfrågan använder du knappen Kontakta oss i sidhuvudet. Du kan också skriva
            direkt till oss.
          </p>
        </Container>
      </section>

      <section className="nova-section">
        <Container className="grid gap-10 py-14 lg:grid-cols-[0.72fr_1.28fr] lg:py-18">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
              Skriv till oss
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-balance">
              Rätt väg från början.
            </h2>
            <p className="mt-4 max-w-md leading-7 text-slate-300">
              Skriv kort vad det gäller. Skicka aldrig lösenord, bankuppgifter eller andra känsliga
              uppgifter i ett första meddelande.
            </p>
          </div>

          <div className="nova-panel divide-y divide-white/10 rounded-md">
            <div className="p-6 sm:p-8">
              <ContactFact
                icon={Mail}
                title="E-post"
                text={contactChannels.contact}
                href={`mailto:${contactChannels.contact}`}
              />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function ContactFact({
  icon: Icon,
  title,
  text,
  href,
}: {
  icon: typeof Mail;
  title: string;
  text: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3 text-muted-foreground">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>
        <span className="block font-medium text-foreground">{title}</span>
        {href ? (
          <a
            href={href}
            className="font-medium text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:text-sky-200 hover:decoration-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d151e]"
          >
            {text}
          </a>
        ) : (
          text
        )}
      </span>
    </div>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  name: keyof FormValues;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: (props: FieldControlProps) => ReactNode;
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  const describedBy = [hint ? hintId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <Label htmlFor={name} className="mb-1.5 block">
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children({
        id: name,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy || undefined,
      })}
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
