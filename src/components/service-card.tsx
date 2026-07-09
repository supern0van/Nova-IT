import type { Service } from "@/lib/nova-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

const difficultyStyles: Record<Service["difficulty"], string> = {
  Enkel: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Medel: "bg-amber-100 text-amber-800 border-amber-200",
  Avancerad: "bg-rose-100 text-rose-800 border-rose-200",
};

export function ServiceCard({ service }: { service: Service }) {
  const Icon = service.icon;
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <Badge variant="outline" className={difficultyStyles[service.difficulty]}>
            {service.difficulty}
          </Badge>
        </div>
        <CardTitle className="mt-4 text-lg">{service.title}</CardTitle>
        <CardDescription>{service.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-1 flex-col justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Exempel
          </p>
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
          <Link to="/kontakt">
            Boka {service.title.toLowerCase()}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
