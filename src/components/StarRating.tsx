import { Star } from 'lucide-react';

export function StarRating({
  rating,
  size = 16,
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (r: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
        >
          <Star
            style={{ width: size, height: size }}
            className={n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-cream-200 text-cream-200'}
          />
        </button>
      ))}
    </div>
  );
}
