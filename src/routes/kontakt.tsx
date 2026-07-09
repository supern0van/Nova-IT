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
import { CheckCircle2, Clock, Mail, ShieldCheck } from "lucide-react";
import { contactChannels, demoNotice, getServiceBySlug, services } from "@/lib/nova-data";

export const Route = createFileRoute("/kontakt")({
  validateSearch: (search: Record<string, unknown>) => ({
    service: typeof search.service === "string" ? search.service : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Beskriv ärende – Nova IT" },
      {
        name: "description",
        content:
          "Tillgängligt demoformulär för IT-support med tydlig validering, tjänsteval och ärendebeskrivning.",
      },
      { property: "og:title", content: "Beskriv ärende – Nova IT" },
      {
        property: "og:description",
        content:
          "Frontend-only kontaktflöde som visar hur en svensk IT-supportsajt kan samla rätt information.",
      },
    ],
  }),
  component: ContactPage,
});

const MESSAGE_MAX = 1000;
const customerTypes = ["Privatperson", "Företag", "Skola", "Annat"] as const;
const urgencyLevels = ["Planerat", "Normal", "Akut"] as const;

const schema = z.object({
  name: z.string().trim().min(2, "Ange ditt namn med minst två tecken").max(100),
  email: z.string().trim().email("Ange en giltig e-postadress").max(255),
  phone: z
    .string()
    .trim()
    .min(6, "Ange ett telefonnummer eller skriv hur du vill bli kontaktad")
    .max(30),
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
  consent: z.literal(true, {
    message: "Godkänn att uppgifterna hanteras i detta demoformulär",
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
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Formuläret är kontrollerat</h1>
        <p className="mt-3 text-muted-foreground">
          Tack. I den här demon visas bara ett lyckat formulärflöde. I en skarp version skulle
          ärendet skickas till Nova IT:s supportkanal.
        </p>
        <div className="mt-6 rounded-md border border-border bg-muted/40 p-4 text-left text-sm">
          <p className="font-medium">Sammanfattning</p>
          <p className="mt-2 text-muted-foreground">
            Tjänst: {values.service || "Ej vald"} · Brådska: {values.urgency || "Ej vald"}
          </p>
        </div>
        <Button className="mt-8" onClick={resetForm}>
          Skicka ny demoförfrågan
        </Button>
      </section>
    );
  }

  const errorEntries = Object.entries(errors);
  const messageLength = values.message.length;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.4fr]">
        <div>
          <p className="text-sm font-medium uppercase text-muted-foreground">Kontaktformulär</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Beskriv ditt ärende</h1>
          <p className="mt-3 text-muted-foreground">
            Fyll i det viktigaste först: vem ärendet gäller, vad som inte fungerar och hur bråttom
            det är. {demoNotice}
          </p>

          <div className="mt-8 space-y-4 text-sm">
            <div className="flex items-start gap-3 text-muted-foreground">
              <Mail className="mt-0.5 h-4 w-4" />
              <span>
                <span className="block font-medium text-foreground">Demo-adress</span>
                {contactChannels.email}
              </span>
            </div>
            <div className="flex items-start gap-3 text-muted-foreground">
              <Clock className="mt-0.5 h-4 w-4" />
              <span>
                <span className="block font-medium text-foreground">Exempel på öppettid</span>
                {contactChannels.availability}
              </span>
            </div>
            <div className="flex items-start gap-3 text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4" />
              <span>
                <span className="block font-medium text-foreground">Ingen backend</span>
                Formuläret valideras i webbläsaren och skickar inte data vidare.
              </span>
            </div>
          </div>
        </div>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-6">
            {errorEntries.length > 0 && (
              <div
                role="alert"
                aria-live="assertive"
                className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm"
              >
                <p className="font-medium text-destructive">
                  Kontrollera {errorEntries.length} fält innan du skickar.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {errorEntries.map(([key, message]) => (
                    <li key={key}>{message}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={onSubmit} noValidate className="grid gap-5">
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

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Telefon eller kontaktväg"
                  name="phone"
                  error={errors.phone}
                  hint="Skriv telefonnummer, Teams eller annan kontaktväg."
                >
                  {(fieldProps) => (
                    <Input
                      {...fieldProps}
                      type="tel"
                      value={values.phone}
                      onChange={(event) => update("phone", event.target.value)}
                      autoComplete="tel"
                      required
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
                      onValueChange={(value) => update("urgency", value as FormValues["urgency"])}
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
                      Jag förstår att detta är ett demoformulär.
                    </Label>
                    <p id="consent-hint" className="mt-1 text-sm text-muted-foreground">
                      Uppgifterna används bara för att visa formulärets flöde i webbläsaren.
                    </p>
                  </div>
                </div>
                {errors.consent && (
                  <p id="consent-error" role="alert" className="mt-1 text-sm text-destructive">
                    {errors.consent}
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" className="mt-2 justify-self-start">
                Validera demoförfrågan
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
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
