// src/features/semaforo/CriteriosConfigTab.tsx
import { useState, useCallback } from "react";
import {
  getConfig,
  setCriteriosAdmin,
  setCriteriosPeer,
  setPesos,
  setUmbrales,
  resetConfig,
  calcSemaforoDinamico,
  type CriterioAdminConfig,
  type CriterioPeerConfig,
} from "./configStore";
import { SEMAFORO_CONFIG } from "./utils";
import { cx } from "@/lib/utils";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

function useConfigState() {
  const [cfg, setCfg] = useState(getConfig());
  const [saved, setSaved] = useState(false);

  const persist = useCallback((next: typeof cfg) => {
    setCfg(next);
    setCriteriosAdmin(next.criteriosAdmin);
    setCriteriosPeer(next.criteriosPeer);
    setPesos(next.pesoAdmin, next.pesoPeer);
    setUmbrales(next.umbralVerde, next.umbralAmarillo);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  return { cfg, setCfg, persist, saved };
}

function moveArray<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function CriteriosConfigTab() {
  const { cfg, setCfg, persist, saved } = useConfigState();
  const [activeTab, setActiveTab] = useState<"admin" | "peer" | "pesos">("admin");

  // ─── Admin handlers ─────────────────────────────────────────────────────────
  const addAdmin = () => {
    const key = `criterio_${Date.now()}`;
    setCfg((p) => ({
      ...p,
      criteriosAdmin: [...p.criteriosAdmin, { key, label: "Nuevo criterio" }],
    }));
  };
  const updateAdmin = (idx: number, label: string) => {
    setCfg((p) => ({
      ...p,
      criteriosAdmin: p.criteriosAdmin.map((c, i) => (i === idx ? { ...c, label } : c)),
    }));
  };
  const removeAdmin = (idx: number) => {
    setCfg((p) => ({
      ...p,
      criteriosAdmin: p.criteriosAdmin.filter((_, i) => i !== idx),
    }));
  };
  const moveAdmin = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= cfg.criteriosAdmin.length) return;
    setCfg((p) => ({ ...p, criteriosAdmin: moveArray(p.criteriosAdmin, idx, to) }));
  };

  // ─── Peer handlers ──────────────────────────────────────────────────────────
  const addPeer = () => {
    const key = `peer_${Date.now()}`;
    setCfg((p) => ({
      ...p,
      criteriosPeer: [...p.criteriosPeer, { key, label: "Nuevo criterio", icon: "⭐" }],
    }));
  };
  const updatePeer = (idx: number, field: "label" | "icon", value: string) => {
    setCfg((p) => ({
      ...p,
      criteriosPeer: p.criteriosPeer.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    }));
  };
  const removePeer = (idx: number) => {
    setCfg((p) => ({
      ...p,
      criteriosPeer: p.criteriosPeer.filter((_, i) => i !== idx),
    }));
  };
  const movePeer = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= cfg.criteriosPeer.length) return;
    setCfg((p) => ({ ...p, criteriosPeer: moveArray(p.criteriosPeer, idx, to) }));
  };

  // ─── Pesos handlers ─────────────────────────────────────────────────────────
  const setAdminWeight = (v: number) => {
    const peer = Math.max(0, Math.min(100, 100 - v));
    setCfg((p) => ({ ...p, pesoAdmin: v, pesoPeer: peer }));
  };
  const setPeerWeight = (v: number) => {
    const admin = Math.max(0, Math.min(100, 100 - v));
    setCfg((p) => ({ ...p, pesoPeer: v, pesoAdmin: admin }));
  };

  // ─── Umbrales handlers ──────────────────────────────────────────────────────
  const setVerde = (v: number) => {
    const safe = Math.max(1, Math.min(100, v));
    setCfg((p) => ({ ...p, umbralVerde: safe, umbralAmarillo: Math.min(p.umbralAmarillo, safe - 1) }));
  };
  const setAmarillo = (v: number) => {
    const safe = Math.max(0, Math.min(99, v));
    setCfg((p) => ({ ...p, umbralAmarillo: safe }));
  };

  const handleSave = () => persist(cfg);
  const handleReset = () => {
    if (confirm("¿Restablecer todos los parámetros a sus valores por defecto?")) {
      resetConfig();
      setCfg(getConfig());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const previewSemaforo = (score: number) => {
    const color = calcSemaforoDinamico(score);
    if (!color) return null;
    const c = SEMAFORO_CONFIG[color];
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold"
        style={{ background: c.badgeBg, color: c.badgeText, borderColor: c.badgeText + "30" }}
      >
        {c.dot} {c.label} · {score}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tabs internos */}
      <div className="flex items-center gap-1 bg-neutral-100/80 rounded-2xl p-1">
        {[
          { key: "admin", label: "Criterios Admin" },
          { key: "peer", label: "Criterios Peer" },
          { key: "pesos", label: "Pesos y Umbrales" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={cx(
              "flex-1 px-4 py-1.5 rounded-xl text-xs font-bold transition",
              activeTab === t.key ? "bg-k-bg-card shadow-k-card text-k-text-h" : "text-k-text-b hover:text-neutral-600"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── Admin Criterios ─────────────────────────────────────────────────── */}
      {activeTab === "admin" && (
        <div className="rounded-[28px] border border-k-border bg-k-bg-card p-6 shadow-k-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-k-text-h tracking-tight">Criterios de Evaluación Admin</h3>
              <p className="text-xs text-k-text-b mt-0.5">{cfg.criteriosAdmin.length} criterios · Máximo {cfg.criteriosAdmin.length * 5} puntos</p>
            </div>
            <button
              onClick={addAdmin}
              className="inline-flex items-center gap-1.5 rounded-xl bg-k-bg-sidebar text-white px-3 py-2 text-xs font-bold hover:bg-obsidian transition"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar
            </button>
          </div>

          <div className="space-y-2">
            {cfg.criteriosAdmin.map((c, idx) => (
              <div key={c.key} className="flex items-center gap-2 rounded-xl border border-k-border bg-k-bg-card2/50 px-3 py-2">
                <span className="text-xs font-bold text-k-text-b w-6">{idx + 1}</span>
                <input
                  value={c.label}
                  onChange={(e) => updateAdmin(idx, e.target.value)}
                  className="flex-1 rounded-lg border border-k-border bg-k-bg-card px-3 py-1.5 text-sm font-medium text-k-text-h outline-none focus:ring-2 focus:ring-obsidian/10"
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveAdmin(idx, -1)}
                    disabled={idx === 0}
                    className="h-7 w-7 rounded-lg border border-k-border bg-k-bg-card flex items-center justify-center hover:bg-k-bg-card2 transition disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveAdmin(idx, 1)}
                    disabled={idx === cfg.criteriosAdmin.length - 1}
                    className="h-7 w-7 rounded-lg border border-k-border bg-k-bg-card flex items-center justify-center hover:bg-k-bg-card2 transition disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeAdmin(idx)}
                    className="h-7 w-7 rounded-lg border border-rose-200 bg-rose-50 flex items-center justify-center hover:bg-rose-100 text-rose-500 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {cfg.criteriosAdmin.length === 0 && (
              <div className="text-center py-8 text-sm text-k-text-b">No hay criterios configurados.</div>
            )}
          </div>
        </div>
      )}

      {/* ─── Peer Criterios ──────────────────────────────────────────────────── */}
      {activeTab === "peer" && (
        <div className="rounded-[28px] border border-k-border bg-k-bg-card p-6 shadow-k-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-k-text-h tracking-tight">Criterios de Evaluación Peer</h3>
              <p className="text-xs text-k-text-b mt-0.5">{cfg.criteriosPeer.length} criterios</p>
            </div>
            <button
              onClick={addPeer}
              className="inline-flex items-center gap-1.5 rounded-xl bg-k-bg-sidebar text-white px-3 py-2 text-xs font-bold hover:bg-obsidian transition"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar
            </button>
          </div>

          <div className="space-y-2">
            {cfg.criteriosPeer.map((c, idx) => (
              <div key={c.key} className="flex items-center gap-2 rounded-xl border border-k-border bg-k-bg-card2/50 px-3 py-2">
                <span className="text-lg w-8 text-center">{c.icon}</span>
                <input
                  value={c.label}
                  onChange={(e) => updatePeer(idx, "label", e.target.value)}
                  className="flex-1 rounded-lg border border-k-border bg-k-bg-card px-3 py-1.5 text-sm font-medium text-k-text-h outline-none focus:ring-2 focus:ring-obsidian/10"
                />
                <input
                  value={c.icon}
                  onChange={(e) => updatePeer(idx, "icon", e.target.value)}
                  className="w-16 rounded-lg border border-k-border bg-k-bg-card px-2 py-1.5 text-sm text-center outline-none focus:ring-2 focus:ring-obsidian/10"
                  maxLength={2}
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => movePeer(idx, -1)}
                    disabled={idx === 0}
                    className="h-7 w-7 rounded-lg border border-k-border bg-k-bg-card flex items-center justify-center hover:bg-k-bg-card2 transition disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => movePeer(idx, 1)}
                    disabled={idx === cfg.criteriosPeer.length - 1}
                    className="h-7 w-7 rounded-lg border border-k-border bg-k-bg-card flex items-center justify-center hover:bg-k-bg-card2 transition disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removePeer(idx)}
                    className="h-7 w-7 rounded-lg border border-rose-200 bg-rose-50 flex items-center justify-center hover:bg-rose-100 text-rose-500 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {cfg.criteriosPeer.length === 0 && (
              <div className="text-center py-8 text-sm text-k-text-b">No hay criterios configurados.</div>
            )}
          </div>
        </div>
      )}

      {/* ─── Pesos y Umbrales ────────────────────────────────────────────────── */}
      {activeTab === "pesos" && (
        <div className="space-y-4">
          <div className="rounded-[28px] border border-k-border bg-k-bg-card p-6 shadow-k-card space-y-5">
            <h3 className="text-lg font-black text-k-text-h tracking-tight">Pesos de Evaluación</h3>

            {/* Admin */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-k-text-h">Evaluación Admin / Supervisor</span>
                <span className="text-sm font-black text-k-text-h">{cfg.pesoAdmin}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={cfg.pesoAdmin}
                onChange={(e) => setAdminWeight(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-k-bg-sidebar"
              />
            </div>

            {/* Peer */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-k-text-h">Evaluación de Compañeros (Peer)</span>
                <span className="text-sm font-black text-k-text-h">{cfg.pesoPeer}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={cfg.pesoPeer}
                onChange={(e) => setPeerWeight(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-k-bg-sidebar"
              />
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm font-medium text-blue-700 text-center">
              Fórmula: ({cfg.pesoAdmin}% × eval admin) + ({cfg.pesoPeer}% × peers) = Score Final
            </div>
          </div>

          <div className="rounded-[28px] border border-k-border bg-k-bg-card p-6 shadow-k-card space-y-5">
            <h3 className="text-lg font-black text-k-text-h tracking-tight">Umbrales del Semáforo</h3>

            {/* Verde */}
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg bg-emerald-50 border border-emerald-100">
                🟢
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-k-text-h">Verde</div>
                <div className="text-xs text-k-text-b">Mínimo para desempeño óptimo</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-k-text-h">≥</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={cfg.umbralVerde}
                  onChange={(e) => setVerde(Number(e.target.value))}
                  className="w-20 rounded-lg border border-k-border bg-k-bg-card px-3 py-2 text-sm font-bold text-k-text-h text-center outline-none focus:ring-2 focus:ring-obsidian/10"
                />
                <span className="text-sm font-bold text-k-text-h">%</span>
              </div>
            </div>

            {/* Amarillo */}
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg bg-amber-50 border border-amber-100">
                🟡
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-k-text-h">Amarillo</div>
                <div className="text-xs text-k-text-b">Mínimo para desempeño aceptable</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-k-text-h">≥</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={cfg.umbralAmarillo}
                  onChange={(e) => setAmarillo(Number(e.target.value))}
                  className="w-20 rounded-lg border border-k-border bg-k-bg-card px-3 py-2 text-sm font-bold text-k-text-h text-center outline-none focus:ring-2 focus:ring-obsidian/10"
                />
                <span className="text-sm font-bold text-k-text-h">%</span>
              </div>
            </div>

            {/* Rojo implícito */}
            <div className="flex items-center gap-4 opacity-60">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-lg bg-rose-50 border border-rose-100">
                🔴
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-k-text-h">Rojo</div>
                <div className="text-xs text-k-text-b">Por debajo de {cfg.umbralAmarillo}%</div>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4">
              <div className="text-[10px] font-bold text-k-text-b uppercase tracking-widest mb-2">Vista previa</div>
              <div className="flex flex-wrap gap-2">
                {previewSemaforo(92)}
                {previewSemaforo(75)}
                {previewSemaforo(45)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Acciones globales ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-xl border border-k-border bg-k-bg-card px-4 py-2.5 text-sm font-bold text-k-text-b hover:bg-k-bg-card2 transition"
        >
          <RotateCcw className="h-4 w-4" />
          Restablecer valores
        </button>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl bg-k-bg-sidebar text-white px-5 py-2.5 text-sm font-bold hover:bg-obsidian transition"
        >
          {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Guardado" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

