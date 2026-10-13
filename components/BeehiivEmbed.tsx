"use client";

import { useEffect, useRef } from "react";

export const BEEHIIV_FORM_ID = "27bc587d-447d-4e08-bd2b-4bfde33b3b8c";

/** Renders Beehiiv's embedded subscribe form in place. Re-injects the loader on every mount so it survives client navigation. */
export function BeehiivEmbed() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = "";
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://subscribe-forms.beehiiv.com/v3/loader.js`;
    s.setAttribute("data-beehiiv-form", BEEHIIV_FORM_ID);
    el.appendChild(s);
    return () => {
      el.innerHTML = "";
    };
  }, []);
  return <div ref={ref} className="min-h-[60px] w-full" />;
}
