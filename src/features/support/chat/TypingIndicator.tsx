/**
 * Ärlig skrivindikator - i motsats till den gamla, medvetet ENSTAKA
 * klassificeraren (som aldrig visade någon), är detta nu en riktig,
 * flerturs AI-konversation som faktiskt tar en stund att generera. Att visa
 * det är hederligt, inte teater.
 *
 * Håller sig medvetet neutral: tre pulserande punkter, ingen "Online"-text,
 * ingen persona, ingen maskot - se docs/supportbot-3d-polish-report.md för
 * varför laget tidigare aktivt tog bort motsvarande antropomorfisering.
 * `motion-reduce` stänger av pulsen helt för den som bett om det.
 */
export function TypingIndicator() {
  return (
    <div
      className="ml-10 flex items-center gap-1.5 py-1"
      role="status"
      aria-label="Ärendeguiden skriver ett svar"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-slate-500 motion-safe:animate-pulse"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
}
