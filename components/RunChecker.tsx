"use client";

import { useEffect, useState } from "react";
import type { RepoRequirements } from "@/lib/types";

type OS = "macOS" | "Windows" | "Linux" | "Other";
type Gpu = "none" | "nvidia" | "amd" | "apple" | "intel";
interface Machine {
  os: OS;
  ramGB: number;
  gpu: Gpu;
  vramGB: number;
  label: string;
}

const KEY = "ossradar-machine";
const PRESETS: Machine[] = [
  { label: "MacBook Air M2 8GB", os: "macOS", ramGB: 8, gpu: "apple", vramGB: 0 },
  { label: "MacBook Pro M3 18GB", os: "macOS", ramGB: 18, gpu: "apple", vramGB: 0 },
  { label: "Windows laptop 16GB + RTX 4060 8GB", os: "Windows", ramGB: 16, gpu: "nvidia", vramGB: 8 },
  { label: "Linux desktop 32GB + RTX 4090 24GB", os: "Linux", ramGB: 32, gpu: "nvidia", vramGB: 24 },
  { label: "Low-end 8GB, no GPU", os: "Windows", ramGB: 8, gpu: "none", vramGB: 0 },
];

interface Detected {
  os: OS;
  memory: number | null;
  cores: number | null;
  renderer: string | null;
}

function detect(): Detected {
  const ua = navigator.userAgent;
  const os: OS = /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux|X11/.test(ua) && !/Android/.test(ua) ? "Linux" : "Other";
  let renderer: string | null = null;
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    if (gl && ext) renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
  } catch {}
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null;
  return { os, memory, cores: navigator.hardwareConcurrency || null, renderer };
}

function gpuFromRenderer(r: string | null): Gpu {
  if (!r) return "none";
  if (/nvidia|geforce|rtx|gtx/i.test(r)) return "nvidia";
  if (/apple|\bm[1-9]\b/i.test(r)) return "apple";
  if (/amd|radeon/i.test(r)) return "amd";
  if (/intel/i.test(r)) return "intel";
  return "none";
}

/** Usable GPU memory: Apple Silicon shares system RAM (~70% addressable by the GPU). */
const effectiveVram = (m: Machine) => (m.gpu === "apple" ? Math.floor(m.ramGB * 0.7) : m.gpu === "none" ? 0 : m.vramGB);

type Verdict = { level: "ok" | "slow" | "no" | "unknown"; reasons: string[] };

export function verdict(req: RepoRequirements, m: Machine): Verdict {
  const hw = req.ramMinGB != null || req.ramRecommendedGB != null || req.vramMinGB != null || req.gpuRequired != null;
  if (!hw && !req.os) return { level: "unknown", reasons: [] };
  const no: string[] = [];
  const slow: string[] = [];
  if (req.os && m.os !== "Other" && !req.os.toLowerCase().includes(m.os.toLowerCase()) && !/any|cross|all/i.test(req.os)) {
    no.push(`README lists ${req.os}; you picked ${m.os}.`);
  }
  if (req.ramMinGB != null && m.ramGB < req.ramMinGB) no.push(`Needs at least ${req.ramMinGB} GB RAM; you have ${m.ramGB} GB.`);
  else if (req.ramRecommendedGB != null && m.ramGB < req.ramRecommendedGB) slow.push(`${req.ramRecommendedGB} GB RAM recommended; you have ${m.ramGB} GB.`);
  const vram = effectiveVram(m);
  if (req.gpuRequired && m.gpu === "none") no.push("README says a GPU is required; you have none.");
  if (req.vramMinGB != null && vram < req.vramMinGB) {
    const msg = `Needs ${req.vramMinGB} GB VRAM; you have ${vram ? `~${vram} GB` : "none"}${m.gpu === "apple" ? " (shared memory)" : ""}.`;
    if (req.gpuRequired) no.push(msg);
    else slow.push(`${msg} It may fall back to CPU and run slowly.`);
  }
  if (no.length) return { level: "no", reasons: no };
  if (slow.length) return { level: "slow", reasons: slow };
  return {
    level: "ok",
    reasons: [hw ? "Your machine meets the requirements listed in the README." : `OS matches; the README lists no hardware minimums.`],
  };
}

const STYLE = {
  ok: ["✅", "Should run", "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"],
  slow: ["⚠️", "Might be slow", "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"],
  no: ["❌", "Unlikely to run", "border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200"],
  unknown: ["❔", "Can't tell; the README doesn't list requirements", "border-zinc-300 bg-zinc-50 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"],
} as const;

const field = "h-9 w-full rounded-md border border-zinc-300 bg-white px-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-zinc-700 dark:bg-zinc-900";

export function RunChecker({ req }: { req: RepoRequirements }) {
  const [det, setDet] = useState<Detected | null>(null);
  const [m, setM] = useState<Machine | null>(null);

  useEffect(() => {
    const d = detect();
    let saved: Machine | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    } catch {}
    const gpu = gpuFromRenderer(d.renderer);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser APIs are only readable after mount
    setDet(d);
    setM(saved ?? { label: "Detected", os: d.os, ramGB: d.memory ?? 8, gpu, vramGB: gpu === "nvidia" || gpu === "amd" ? 8 : 0 });
  }, []);

  function update(next: Partial<Machine>, label = "Custom") {
    if (!m) return;
    const v = { ...m, ...next, label };
    setM(v);
    try {
      localStorage.setItem(KEY, JSON.stringify(v));
    } catch {}
  }

  const v = m ? verdict(req, m) : null;
  const [icon, title, cls] = STYLE[v?.level ?? "unknown"];

  return (
    <section aria-labelledby="run-check" className="mt-6 rounded-lg border border-zinc-200 p-4 sm:p-5 dark:border-zinc-800">
      <h2 id="run-check" className="text-xl font-semibold tracking-tight">Will it run on my machine?</h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {det
          ? <>Detected (approximate): {det.os}{det.memory ? ` · ~${det.memory}${det.memory >= 8 ? "+" : ""} GB RAM` : ""}{det.cores ? ` · ${det.cores} CPU threads` : ""}{det.renderer ? ` · ${det.renderer}` : ""}. Browsers cap and blur these values, so adjust below.</>
          : "Detecting your browser's hardware hints…"}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => update(p, p.label)}
            aria-pressed={m?.label === p.label}
            className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors ${m?.label === p.label ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {m && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            OS
            <select className={`${field} mt-1 text-zinc-900 dark:text-zinc-100`} value={m.os} onChange={(e) => update({ os: e.target.value as OS })}>
              {["macOS", "Windows", "Linux", "Other"].map((o) => <option key={o}>{o}</option>)}
            </select>
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            RAM (GB)
            <input className={`${field} mt-1 tabular-nums text-zinc-900 dark:text-zinc-100`} type="number" min={1} max={1024} value={m.ramGB} onChange={(e) => update({ ramGB: Math.max(1, Number(e.target.value) || 1) })} />
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            GPU
            <select className={`${field} mt-1 text-zinc-900 dark:text-zinc-100`} value={m.gpu} onChange={(e) => update({ gpu: e.target.value as Gpu })}>
              <option value="none">None / integrated</option>
              <option value="nvidia">NVIDIA</option>
              <option value="amd">AMD</option>
              <option value="apple">Apple Silicon</option>
              <option value="intel">Intel Arc</option>
            </select>
          </label>
          <label className="text-xs text-zinc-500 dark:text-zinc-400">
            VRAM (GB)
            <input className={`${field} mt-1 tabular-nums text-zinc-900 disabled:opacity-50 dark:text-zinc-100`} type="number" min={0} max={256} disabled={m.gpu === "none" || m.gpu === "apple"} value={m.gpu === "apple" ? effectiveVram(m) : m.gpu === "none" ? 0 : m.vramGB} onChange={(e) => update({ vramGB: Math.max(0, Number(e.target.value) || 0) })} />
          </label>
        </div>
      )}

      {v && (
        <div role="status" className={`mt-4 rounded-md border px-4 py-3 ${cls}`}>
          <p className="font-semibold"><span aria-hidden>{icon}</span> {title}</p>
          <ul className="mt-1 space-y-0.5 text-sm">
            {v.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      )}
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Based only on what the README states. Your choice is saved in this browser and used on every repo page.</p>
    </section>
  );
}
