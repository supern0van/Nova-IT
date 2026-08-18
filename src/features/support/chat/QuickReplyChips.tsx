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
    <div className="flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(suggestion)}
          className="min-h-8 rounded-full bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-sky-300/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
