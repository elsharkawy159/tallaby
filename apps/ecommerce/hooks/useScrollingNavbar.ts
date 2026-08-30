import { useState, useEffect, useRef } from "react";

const SCROLL_TOP_THRESHOLD = 10;
const SCROLL_DELTA_THRESHOLD = 8;

export const useScrollingNavbar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      if (ticking.current) return;

      ticking.current = true;

      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY.current;

        if (currentScrollY <= SCROLL_TOP_THRESHOLD) {
          setIsVisible(true);
        } else if (Math.abs(delta) >= SCROLL_DELTA_THRESHOLD) {
          setIsVisible(delta < 0);
        }

        lastScrollY.current = currentScrollY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { isVisible };
};
