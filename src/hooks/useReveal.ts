import { useEffect } from "react";

/**
 * Fades `[data-reveal]` elements up as they scroll into view.
 *
 * The hidden state only applies once `js-reveal` is on <html>, so the page
 * is fully visible without JS, and the CSS skips motion entirely for
 * prefers-reduced-motion. Each element reveals once and is then unobserved.
 */
export function useReveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const root = document.documentElement;
    root.classList.add("js-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );

    document.querySelectorAll("[data-reveal]").forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      root.classList.remove("js-reveal");
    };
  }, []);
}
