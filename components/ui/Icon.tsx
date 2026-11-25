// Small inline icon set (no icon font or external requests). Decorative by
// default; pass `label` when the icon carries meaning on its own.
const paths: Record<string, string> = {
  search: "M11 4a7 7 0 1 0 4.4 12.4l4.1 4.1 1.4-1.4-4.1-4.1A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z",
  cart: "M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 8H7.2M10 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  bell: "M12 3a6 6 0 0 0-6 6v3.6L4.5 15H19.5L18 12.6V9a6 6 0 0 0-6-6Zm-2 15a2 2 0 0 0 4 0",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  grid: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z",
  home: "M3 11 12 4l9 7v9h-6v-6H9v6H3v-9Z",
  check: "M5 12.5 10 17l9-10",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2",
  alert: "M12 3 2 20h20L12 3Zm0 6v5m0 3v.5",
  info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 8v5m0-8v.5",
  x: "M6 6l12 12M18 6 6 18",
  flask: "M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.5L14 9V3",
  chevron: "m9 6 6 6-6 6",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.7-5.7 1.4-1.4M4.9 19.1l1.4-1.4m0-11.4L4.9 4.9m14.2 14.2-1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
  monitor: "M3 5h18v11H3V5Zm6 15h6m-3-4v4",
  sparkle:
    "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 12 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z",
  coin: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v10m-3-7.5c0-1 1.3-1.5 3-1.5s3 .7 3 2-1.3 1.6-3 2-3 .8-3 2 1.3 2 3 2 3-.6 3-1.5",
  rocket:
    "M14 4c3 0 6 3 6 6l-6 6-4-4 6-6M10 12l-4 1-2 3 4 1M12 14l-1 4-3 2-1-4m8-9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z",
  star: "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z",
  shield: "M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Zm-3.5 9 2.5 2.5 4.5-5",
  truck: "M3 6h11v9H3V6Zm11 3h4l3 3v3h-7V9ZM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  store:
    "M4 9 5.5 4h13L20 9M4 9h16M4 9c0 1.7 1.3 3 3 3s3-1.3 3-3m0 0c0 1.7 1.3 3 3 3s3-1.3 3-3m0 0c0 1.7 1.3 3 3 3s3-1.3 3-3M5 12v8h14v-8M10 20v-5h4v5",
  returns: "M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3",
  play: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-2 5.5v7l6-3.5-6-3.5Z",
  flag: "M5 21V4m0 0h11l-2 4 2 4H5",
  // Category icons (seed data "icon" keys).
  phone: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 15h2",
  laptop: "M5 5h14v10H5V5ZM3 19h18",
  headphones: "M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4v-5Zm13 0h3v5h-3v-5Z",
  watch: "M8 7h8v10H8V7Zm1-4h6l1 4H8l1-4Zm0 18h6l1-4H8l1 4Z",
  tv: "M3 5h18v12H3V5Zm5 15h8",
  camera: "M4 8h4l2-3h4l2 3h4v11H4V8Zm8 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  gamepad:
    "M6 8h12a4 4 0 0 1 4 4v1a3 3 0 0 1-5.4 1.8L15 13H9l-1.6 1.8A3 3 0 0 1 2 13v-1a4 4 0 0 1 4-4Zm2 2v4m-2-2h4m6-1v.5m2 1.5v.5",
  smarthome: "M3 11 12 4l9 7v9H3v-9Zm7 6a3 3 0 0 1 4 0m-6-2.5a6 6 0 0 1 8 0",
  gadget: "M9 3h6v4H9V3Zm-2 4h10v14H7V7Zm3 4h4",
  tool: "M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9a4 4 0 0 0-2-2Z",
  bolt: "M13 3 5 14h6l-1 7 8-11h-6l1-7Z",
  car: "M5 16h14v-4l-2-5H7l-2 5v4Zm0 0v2m14-2v2M7 13h.5m9 0h.5",
};

export type IconName = keyof typeof paths;

export function Icon({
  name,
  size = 20,
  label,
  className,
  filled = false,
}: {
  name: IconName;
  size?: number;
  label?: string;
  className?: string;
  /** Fill the shape with the current colour (stars, dots). */
  filled?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
