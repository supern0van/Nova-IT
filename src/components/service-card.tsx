import type { Service } from "@/lib/nova-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const difficultyStyles: Record<Service["difficulty"], string> = {
  Start: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Standard: "border-sky-200 bg-sky-50 text-sky-800",
  Fördjupad: "border-amber-200 bg-amber-50 text-amber-900",
};

export function ServiceCard({ service }: { service: Service }) {
  const Icon = service.icon;

  return (
    <Card className="flex h-full flex-col border-border/70 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <Badge variant="outline" className={difficultyStyles[service.difficulty]}>
            {service.difficulty}
          </Badge>
        </div>
        <p className="mt-4 text-xs font-medium uppercase text-muted-foreground">
          {service.category}
        </p>
        <CardTitle className="text-lg">{service.title}</CardTitle>
        <CardDescription>{service.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-1 flex-col justify-between gap-4">
        <div>
          <p className="flex gap-2 text-sm font-medium text-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            {service.outcome}
          </p>
          <p className="mt-4 text-xs font-semibold uppercase text-muted-foreground">Exempel</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {service.examples.map((e) => (
              <li key={e} className="flex gap-2">
                <span className="text-primary">•</span>
                {e}
              </li>
            ))}
          </ul>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link
            to="/kontakt"
            search={{ service: service.slug }}
            aria-label={`Beskriv ärende för ${service.title}`}
          >
            Beskriv ärende
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
