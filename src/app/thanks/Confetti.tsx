"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function Confetti() {
  useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;
    const colors = ["#A3E635", "#00A0DC", "#22c55e"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
        scalar: 0.9,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
        scalar: 0.9,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.3 },
      colors,
    });
  }, []);

  return null;
}
