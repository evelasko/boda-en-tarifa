import {
  CAPTAIN_BADGE,
  CAPTAIN_BADGE_CAPTION,
  FOOD_FILLS,
  FOOD_LABELS,
  FOOD_LETTERS,
  FOOD_STROKES,
  GIFT_BADGE,
  GIFT_BADGE_CAPTION,
  type FoodCategory,
} from '@/types/seating-layout';

const CATEGORIES: FoodCategory[] = ['meat', 'fish', 'vegetarian', 'child', 'unknown'];

interface Props {
  captainCaption?: string;
  showCaptain?: boolean;
  showGift?: boolean;
}

export default function SeatingDiagramLegend({
  captainCaption = CAPTAIN_BADGE_CAPTION,
  showCaptain = true,
  showGift = true,
}: Props) {
  const showBadges = showCaptain || showGift;

  return (
    <div className="seating-legend bg-white border border-charcoal/10 rounded-lg p-3 flex flex-wrap items-center gap-4 text-sm">
      {CATEGORIES.map((cat) => (
        <div key={cat} className="flex items-center gap-2">
          {/* Legend chip. Mirrors the seat disc so the legend always tracks
           *  any token tweak: backgroundColor + borderColor + colour all
           *  read from the same CSS vars as the SVG (FOOD_FILLS /
           *  FOOD_STROKES → var(--seat-fill-*) / var(--seat-stroke-*),
           *  and `color` → var(--seat-letter-color)). */}
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold"
            style={{
              backgroundColor: FOOD_FILLS[cat],
              borderColor: FOOD_STROKES[cat],
              borderWidth: 1.5,
              borderStyle: 'solid',
              color: 'var(--seat-letter-color)',
            }}
          >
            {FOOD_LETTERS[cat]}
          </span>
          <span className="text-charcoal/80">{FOOD_LABELS[cat]}</span>
        </div>
      ))}
      {showBadges && <div className="h-6 w-px bg-charcoal/15" aria-hidden />}
      {showCaptain && (
        <div className="flex items-center gap-2 text-charcoal/80">
          <span className="text-base leading-none">{CAPTAIN_BADGE}</span>
          <span>{captainCaption}</span>
        </div>
      )}
      {showGift && (
        <div className="flex items-center gap-2 text-charcoal/80">
          <span className="text-base leading-none">{GIFT_BADGE}</span>
          <span>{GIFT_BADGE_CAPTION}</span>
        </div>
      )}
    </div>
  );
}
