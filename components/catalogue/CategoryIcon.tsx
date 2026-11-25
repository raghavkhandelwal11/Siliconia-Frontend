import type { CSSProperties } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

// Each top-level category has its own hue, used for its icon tile everywhere.
const hues: Record<string, number> = {
  phone: 248,
  laptop: 214,
  headphones: 276,
  watch: 330,
  tv: 192,
  camera: 18,
  gamepad: 300,
  smarthome: 165,
  gadget: 40,
  tool: 2,
  bolt: 52,
  car: 140,
};

/** Hue for a category icon key (admin-added categories fall back to the brand hue). */
export function hueFor(icon?: string): number {
  return (icon && hues[icon]) || 248;
}

/** Icon for a top-level category; admins may add categories without a matching icon. */
export function CategoryIcon({ icon, size = 24 }: { icon?: string; size?: number }) {
  return <Icon name={(icon && icon in hues ? icon : "grid") as IconName} size={size} />;
}

/** The icon on a tinted tile in the category's colour. */
export function CategoryTile({
  icon,
  size = 44,
  className = "",
}: {
  icon?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`icon-tile shrink-0 ${className}`}
      style={{ "--hue": hueFor(icon), width: size, height: size } as CSSProperties}
    >
      <CategoryIcon icon={icon} size={Math.round(size * 0.5)} />
    </span>
  );
}
