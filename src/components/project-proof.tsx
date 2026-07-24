import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ExternalLink, FileText } from "lucide-react";

export function ProjectProof() {
  return (
    <section
      aria-labelledby="project-proof-title"
      className="border-b border-white/12 py-8 sm:py-10"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16">
        <div>
          <p className="eyebrow">Datorer som räcker längre</p>
          <h2
            id="project-proof-title"
            className="mt-3 max-w-xl text-3xl font-semibold tracking-normal text-balance sm:text-4xl"
          >
            Bedöm först. Byt ut när det faktiskt behövs.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Vi tittar på skick, prestanda och användningsområde innan vi föreslår nästa steg. Målet
            är att ge dig ett ärligt underlag, oavsett om det leder till service, uppgradering eller
            att det är dags att välja något nytt.
          </p>
        </div>

        <div className="border-y border-white/12 py-7">
          <div className="flex gap-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-sky-200/20 bg-sky-300/10 text-sky-200">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-white">Projekt Återbruk</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Ett dokumenterat LIA-projekt där 116 datorer inventerades, rengjordes,
                funktionstestades och förbereddes för fortsatt användning.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link
                  to="/projekt-aterbruk"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  Läs om arbetet och metoden
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="/projekt-aterbruk.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  Originalpresentation (PDF)
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
          <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-slate-400">
            Projekt Återbruk är ett genomfört LIA-/utbildningsprojekt. Det är inte en kundreferens
            eller ett utfört uppdrag av Nova IT, utan dokumentation av den metod och praktiska
            erfarenhet som vi bygger vidare på.
          </p>
        </div>
      </div>
    </section>
  );
}
