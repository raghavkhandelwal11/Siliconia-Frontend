import { Icon, type IconName } from "@/components/ui/Icon";

const known = new Set<string>([
  "phone",
  "laptop",
  "headphones",
  "watch",
  "tv",
  "camera",
  "gamepad",
  "smarthome",
  "gadget",
  "tool",
  "bolt",
  "car",
]);

/** Icon for a top-level category; admins may add categories without a matching icon. */
export function CategoryIcon({ icon, size = 24 }: { icon?: string; size?: number }) {
  return <Icon name={(icon && known.has(icon) ? icon : "grid") as IconName} size={size} />;
}
