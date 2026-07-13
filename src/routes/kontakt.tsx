import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { contactChannels, contactNotice, getServiceBySlug, services } from "@/lib/nova-data";
import { Container } from "@/components/design-system";
import { createContactEmailDraft } from "@/features/contact/contact-submission";

export const Route = createFileRoute("/kontakt")({
  validateSearch: (search: Record<string, unknown>) => ({
    service: typeof search.service === "string" ? search.service : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Beskriv ärende – Nova IT" },
      {
        name: "description",
        content: "Beskriv ditt IT-ärende till Nova IT och välj tjänst, brådska och kontaktväg.",
      },
      { property: "og:title", content: "Beskriv ärende – Nova IT" },
      {
        property: "og:description",
        content:
          "Förbered ett tydligt supportärende för datorproblem, nätverk, installationer eller konton.",
      },
    ],
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

const schema = z.object({
  name: z.string().trim().min(2, "Ange ditt namn med minst två tecken").max(100),
  email: z.string().trim().email("Ange en giltig e-postadress").max(255),
  phone: z.string().trim().max(60, "Kontaktvägen får vara högst 60 tecken"),
  customerType: z.enum(customerTypes, {
    message: "Välj vilken typ av kund ärendet gäller",
  }),
  service: z.string().min(1, "Välj vilken tjänst som passar bäst"),
  urgency: z.enum(urgencyLevels, { message: "Välj hur brådskande ärendet är" }),
  message: z
    .string()
    .trim()
    .min(10, "Beskriv ärendet med minst 10 tecken")
    .max(MESSAGE_MAX, `Beskrivningen får vara högst ${MESSAGE_MAX} tecken`),
  consent: z.boolean().refine((value) => value, {
    message: "Bekräfta att Nova IT får använda uppgifterna för att återkomma om ärendet",
  }),
});

type FormValues = {
  name: string;
  email: string;
  phone: string;
  customerType: "" | (typeof customerTypes)[number];
  service: string;
  urgency: "" | (typeof urgencyLevels)[number];
  message: string;
  consent: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;
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
    service,
    urgency: "",
    message: "",
    consent: false,
  };
}

function ContactPage() {
  const search = Route.useSearch();
  const selectedService = getServiceBySlug(search.service);
  const selectedServiceTitle = selectedService?.title ?? "";
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [values, setValues] = useState<FormValues>(() => createInitialValues(selectedServiceTitle));

  useEffect(() => {
    if (!selectedServiceTitle) return;
    setValues((current) =>
      current.service ? current : { ...current, service: selectedServiceTitle },
    );
  }, [selectedServiceTitle]);

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
    setErrors({});
    setValues(createInitialValues(selectedServiceTitle));
  }

  function openEmailDraft() {
    window.location.assign(createContactEmailDraft(values, contactChannels.contact));
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

  if (submitted) {
    return (
      <section className="tech-grid border-b border-border bg-secondary/35">
        <Container className="max-w-2xl py-20 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <p className="eyebrow mt-6">Ärendeunderlag</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
            Underlaget är förberett
          </h1>
          <p className="mt-3 text-muted-foreground">
            Ärendet är sammanställt med informationen som Nova IT behöver för en första bedömning.
          </p>
          <div className="mt-7 grid gap-px overflow-hidden rounded-lg border border-border bg-border text-left sm:grid-cols-2">
            <div className="bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Tjänst
              </p>
              <p className="mt-2 font-medium">{values.service || "Ej vald"}</p>
            </div>
            <div className="bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Brådska
              </p>
              <p className="mt-2 font-medium">{values.urgency || "Ej vald"}</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-border bg-card p-5 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Sammanfattning
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{values.message}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Kontaktväg: {values.email}
              {values.phone ? ` · ${values.phone}` : ""}
            </p>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={openEmailDraft}>Öppna e-postutkast</Button>
            <Button variant="outline" onClick={resetForm}>
              Förbered ett nytt ärende
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
      <section className="border-b border-sky-100 bg-[#eef7fb] text-foreground">
        <Container className="py-14 lg:py-18">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Kontakt</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">
            Berätta vad som händer.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{contactNotice}</p>
        </Container>
      </section>

      <section className="border-b border-border bg-background">
        <Container className="py-14 lg:py-18">
          <div className="grid min-w-0 gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
            <div className="min-w-0 lg:sticky lg:top-28">
              <p className="eyebrow">Inför kontakten</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl">
                Rätt underlag. Rätt hjälp.
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Svara på det du vet. Det räcker för att Nova IT ska kunna börja på rätt ställe.
              </p>

              {selectedService && (
                <div className="mt-7 rounded-lg border border-primary/20 bg-primary/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                    Förvald tjänst
                  </p>
                  <p className="mt-2 font-semibold">{selectedService.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {selectedService.outcome}
                  </p>
                </div>
              )}

              <div className="mt-8 space-y-4 text-sm">
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
                <ContactFact
                  icon={ShieldCheck}
                  title="Trygg första kontakt"
                  text="Skicka aldrig lösenord, bankuppgifter eller andra känsliga uppgifter i ett nytt ärende."
                />
              </div>
              <div className="mt-7 rounded-lg border border-border bg-background/80 p-5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold">Bra att ha med</h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {preparationTips.map((tip) => (
                    <li key={tip} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Card className="min-w-0 border-border operational-shadow">
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
                    <legend className="px-2 text-sm font-semibold">1. Dina uppgifter</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Namn" name="name" error={errors.name}>
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
                      <Field label="E-post" name="email" error={errors.email}>
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
                      <Field label="Kundtyp" name="customerType" error={errors.customerType}>
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
                    </div>
                  </fieldset>

                  <fieldset className="min-w-0 rounded-lg border border-border p-5">
                    <legend className="px-2 text-sm font-semibold">2. Ärendet</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field
                        label="Tjänst"
                        name="service"
                        error={errors.service}
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
                      <Field label="Brådska" name="urgency" error={errors.urgency}>
                        {(fieldProps) => (
                          <Select
                            value={values.urgency}
                            onValueChange={(value) =>
                              update("urgency", value as FormValues["urgency"])
                            }
                          >
                            <SelectTrigger {...fieldProps}>
                              <SelectValue placeholder="Välj brådska" />
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
                      <Field
                        label="Beskriv ärendet"
                        name="message"
                        error={errors.message}
                        hint={`Minst 10 tecken. ${messageLength}/${MESSAGE_MAX} tecken använda.`}
                      >
                        {(fieldProps) => (
                          <Textarea
                            {...fieldProps}
                            rows={6}
                            value={values.message}
                            onChange={(event) => update("message", event.target.value)}
                            maxLength={MESSAGE_MAX}
                            required
                          />
                        )}
                      </Field>
                    </div>
                  </fieldset>

                  <fieldset className="min-w-0 rounded-lg border border-border p-5">
                    <legend className="px-2 text-sm font-semibold">3. Bekräfta</legend>
                    <div>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="consent"
                          checked={values.consent}
                          onCheckedChange={(checked) => update("consent", checked === true)}
                          aria-invalid={errors.consent ? true : undefined}
                          aria-describedby={
                            errors.consent ? "consent-hint consent-error" : "consent-hint"
                          }
                        />
                        <div>
                          <Label htmlFor="consent" className="text-sm font-medium">
                            Nova IT får använda uppgifterna för att återkomma om ärendet.
                          </Label>
                          <p id="consent-hint" className="mt-1 text-sm text-muted-foreground">
                            Skicka inte lösenord, bankuppgifter eller annan känslig information i
                            första kontakten.
                          </p>
                        </div>
                      </div>
                      {errors.consent && (
                        <p
                          id="consent-error"
                          role="alert"
                          className="mt-1 text-sm text-destructive"
                        >
                          {errors.consent}
                        </p>
                      )}
                    </div>

                    <Button type="submit" size="lg" className="mt-5 w-full sm:w-auto">
                      Visa ärendesammanfattning
                    </Button>
                  </fieldset>
                </form>
              </CardContent>
            </Card>
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
            className="font-medium text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:text-sky-800 hover:decoration-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
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
  children,
}: {
  label: string;
  name: keyof FormValues;
  error?: string;
  hint?: ReactNode;
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
