"use client";

import { useEffect, useRef, useState } from "react";

const SCRIPT_ID = "razorpay-embed-btn-js";
const SCRIPT_SRC = "https://cdn.razorpay.com/static/embed_btn/bundle.js";

declare global {
  interface Window {
    __rzp__?: { init?: () => void };
  }
}

export function RazorpayButton({ url, fallbackUrl, label }: { url: string; fallbackUrl: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      window.__rzp__?.init?.();
      return;
    }
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.src = SCRIPT_SRC;
    s.defer = true;
    s.onerror = () => setFailed(true);
    document.body.appendChild(s);
  }, []);

  return (
    <div className="w-full sm:w-auto">
      {!failed && (
        <div
          ref={ref}
          className="razorpay-embed-btn min-h-[44px] max-w-full overflow-hidden"
          data-url={url}
          data-text={label}
          data-color="#4F46E5"
          data-size="large"
        />
      )}
      <noscript>
        <a href={fallbackUrl} className="inline-block rounded-md bg-indigo-600 px-4 py-2 font-medium text-white">{label}</a>
      </noscript>
      <a href={fallbackUrl} className="mt-2 block text-sm text-indigo-700 underline dark:text-indigo-400">
        {failed ? `${label} on Razorpay` : "Button not loading? Open the payment page"}
      </a>
    </div>
  );
}
