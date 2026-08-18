/**
 * AI-föreslagna snabbsvar - ersätter det gamla hårdkodade fyra-alternativ-
 * flödet med korta, kontextuella förslag modellen tar fram per tur. Visas
 * ALLTID vid sidan av fritextfältet, aldrig i stället för det - se
 * omdesignplanens researchunderlag om quick-replies.
 */
export function QuickReplyChips({
  suggestions,
  onSelect,
  disabled,
}: {
  suggestions: string[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="ml-10 flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          className="min-h-9 rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-sky-300/50 hover:bg-sky-300/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
