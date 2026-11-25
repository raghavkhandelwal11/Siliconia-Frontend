import { Icon } from "@/components/ui/Icon";

/** Star rating with a text equivalent for screen readers. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-gold" role="img" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} className={i <= Math.round(value) ? "fill-current" : "opacity-30"} />
      ))}
    </span>
  );
}
