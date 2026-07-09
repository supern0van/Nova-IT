import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { CheckCircle2, Mail, Phone, MapPin } from "lucide-react";
import { services } from "@/lib/nova-data";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Boka support – Nova IT" },
      {
        name: "description",
        content: "Boka IT-support eller kontakta Nova IT. Vi svarar inom en timme på vardagar.",
      },
      { property: "og:title", content: "Boka support – Nova IT" },
      { property: "og:description", content: "Beskriv problemet så återkommer vi snabbt." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Ange ditt namn").max(100),
  email: z.string().trim().email("Ogiltig e-postadress").max(255),
  phone: z.string().trim().min(6, "Ange ett telefonnummer").max(30),
  customerType: z.enum(["Privatperson", "Företag", "Skola", "Annat"], {
    message: "Välj kundtyp",
  }),
  service: z.string().min(1, "Välj en tjänst"),
  urgency: z.enum(["Låg", "Normal", "Akut"], { message: "Välj brådskandenivå" }),
  message: z.string().trim().min(10, "Beskriv ärendet med minst 10 tecken").max(1000),
  consent: z.literal(true, { message: "Du måste godkänna hanteringen av dina uppgifter" }),
});

type FormErrors = Partial<Record<keyof z.infer<typeof schema>, string>>;

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    customerType: "",
    service: "",
    urgency: "",
    message: "",
    consent: false,
  });

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: FormErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
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
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Tack, vi hör av oss!</h1>
        <p className="mt-3 text-muted-foreground">
          Din förfrågan är mottagen. En tekniker återkommer inom en timme på vardagar,
          annars första vardagen efter helgen. Brådskande? Ring oss på 08 – 123 45 67.
        </p>
        <Button className="mt-8" onClick={() => { setSubmitted(false); setValues({ name: "", email: "", phone: "", customerType: "", service: "", urgency: "", message: "", consent: false }); }}>
          Skicka ny förfrågan
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Boka support</h1>
          <p className="mt-3 text-muted-foreground">
            Beskriv ditt ärende så återkommer en tekniker med en tydlig åtgärdsplan.
          </p>

          <div className="mt-8 space-y-4 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="h-4 w-4" /> hej@novait.se
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone className="h-4 w-4" /> 08 – 123 45 67
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="h-4 w-4" /> Storgatan 1, Stockholm
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={onSubmit} noValidate className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Namn" error={errors.name} htmlFor="name">
                  <Input id="name" value={values.name} onChange={(e) => update("name", e.target.value)} required />
                </Field>
                <Field label="E-post" error={errors.email} htmlFor="email">
                  <Input id="email" type="email" value={values.email} onChange={(e) => update("email", e.target.value)} required />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Telefon" error={errors.phone} htmlFor="phone">
                  <Input id="phone" type="tel" value={values.phone} onChange={(e) => update("phone", e.target.value)} required />
                </Field>
                <Field label="Kundtyp" error={errors.customerType} htmlFor="customerType">
                  <Select value={values.customerType} onValueChange={(v) => update("customerType", v)}>
                    <SelectTrigger id="customerType"><SelectValue placeholder="Välj..." /></SelectTrigger>
                    <SelectContent>
                      {["Privatperson", "Företag", "Skola", "Annat"].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tjänst" error={errors.service} htmlFor="service">
                  <Select value={values.service} onValueChange={(v) => update("service", v)}>
                    <SelectTrigger id="service"><SelectValue placeholder="Välj tjänst..." /></SelectTrigger>
                    <SelectContent>
                      {services.map((s) => (
                        <SelectItem key={s.slug} value={s.title}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Brådskandenivå" error={errors.urgency} htmlFor="urgency">
                  <Select value={values.urgency} onValueChange={(v) => update("urgency", v)}>
                    <SelectTrigger id="urgency"><SelectValue placeholder="Välj..." /></SelectTrigger>
                    <SelectContent>
                      {["Låg", "Normal", "Akut"].map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Beskriv ditt ärende" error={errors.message} htmlFor="message">
                <Textarea id="message" rows={5} value={values.message} onChange={(e) => update("message", e.target.value)} required />
              </Field>

              <div>
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox
                    checked={values.consent}
                    onCheckedChange={(c) => update("consent", c === true)}
                    aria-label="Godkänn hantering av personuppgifter"
                  />
                  <span className="text-muted-foreground">
                    Jag godkänner att Nova IT hanterar mina uppgifter för att besvara detta ärende.
                  </span>
                </label>
                {errors.consent && (
                  <p className="mt-1 text-sm text-destructive">{errors.consent}</p>
                )}
              </div>

              <Button type="submit" size="lg" className="mt-2 justify-self-start">
                Skicka förfrågan
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
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="mb-1.5 block">
        {label}
      </Label>
      {children}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
