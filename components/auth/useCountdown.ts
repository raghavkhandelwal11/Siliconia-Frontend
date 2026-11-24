"use client";

import { useEffect, useState } from "react";

/** Seconds left until `until` (epoch ms), ticking once a second. */
export function useCountdown(until: number): number {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [until]);
  return left;
}
