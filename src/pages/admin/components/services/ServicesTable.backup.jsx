import React, { useEffect, useMemo, useRef, useState } from "react";
import { RenderIcon } from "../common/IconUtils";
import { Eye, Pencil, Archive, RotateCcw } from "lucide-react";
import "../common/admin-table.css";

export default function ServicesTable({
  services,
  onView,
  onEdit,
  onArchiveToggle,
}) {
  const WIDTHS_KEY = "admin_services_col_widths_v2";
  // Column model
  // Column definitions. Ajustables, permitiendo scroll horizontal si se excede el ancho del contenedor.
  const columns = useMemo(
    () => [
      { key: "id", label: "ID", min: 60 },
      { key: "order", label: "Orden", min: 80 },
      { key: "icon", label: "Icono", min: 96 },
      { key: "title", label: "Título (ES)", min: 180, flexWeight: 0.45 },
      {
        key: "description",
        label: "Descripción (ES)",
        min: 240,
        flexWeight: 0.55,
      },
      { key: "status", label: "Estado", min: 110 },
      { key: "actions", label: "Acciones", min: 126 },
    ],
    []
  );

  const headerRefs = useRef({});
  const containerRef = useRef(null);
  const tableRef = useRef(null);
  const [widths, setWidths] = useState({});
  const [measured, setMeasured] = useState(false);
  const [resizing, setResizing] = useState(null); // { key, startX, startW }
  const [totalWidth, setTotalWidth] = useState(0);
  const [needScroll, setNeedScroll] = useState(false);

  // Load widths from sessionStorage (if any) before measuring
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(WIDTHS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setWidths(parsed);
          setMeasured(true); // trust persisted sizes
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Measure header natural widths; set initial widths basados en header (no contenido)
  useEffect(() => {
    if (measured) return;
    const next = {};
    columns.forEach((c) => {
      const el = headerRefs.current[c.key];
      if (!el) return;
      const pad = 24; // px padding allowance
      const base = Math.ceil(el.scrollWidth) + pad;
      next[c.key] = Math.max(c.min || 80, base);
    });
    if (Object.keys(next).length) {
      setWidths((prev) => ({ ...prev, ...next }));
      setMeasured(true);
    }
  }, [columns, measured]);

  // Persist widths on change
  useEffect(() => {
    try {
      sessionStorage.setItem(WIDTHS_KEY, JSON.stringify(widths));
    } catch {}
    // Each time widths changes, recompute overflow
    recomputeOverflow(widths);
  }, [widths]);

  // Recompute total width and overflow need on resize
  useEffect(() => {
    const onResize = () => recomputeOverflow();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  // Calculate total width and toggle overflow class
  function recomputeOverflow(nextWidths = widths) {
    const cont = containerRef.current;
    const tableEl = tableRef.current;
    if (!cont) return;
    // Preferir scrollWidth real de la tabla si existe
    let total = 0;
    if (tableEl) {
      total = tableEl.scrollWidth;
    } else {
      const sep = (columns.length - 1) * 1; // 1px separators estimados
      total =
        columns.reduce(
          (sum, c) => sum + (nextWidths[c.key] || c.min || 80),
          0
        ) + sep;
    }
    setTotalWidth(total);
    const cw = cont.clientWidth - 2;
    setNeedScroll(total > cw + 1);
  }

  function startResize(key, e) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = widths[key] || 120;
    setResizing({ key, startX, startW });
    document.body.classList.add("admin-col-resizing");
    const onMove = (ev) => {
      setWidths((prev) => {
        const c = columns.find((x) => x.key === key);
        const dx = ev.clientX - startX;
        const w = Math.max(c?.min || 80, startW + dx);
        const tentative = { ...prev, [key]: w };
        // no ajuste automático al contenedor; permitimos overflow si total excede
        return tentative;
      });
      // recalc overflow after updating widths on next tick
      requestAnimationFrame(() => recomputeOverflow());
    };
    const onUp = () => {
      setResizing(null);
      document.body.classList.remove("admin-col-resizing");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      recomputeOverflow();
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function autoFit(key) {
    const el = headerRefs.current[key];
    const c = columns.find((x) => x.key === key);
    if (!el || !c) return;
    const pad = 24;
    const base = Math.ceil(el.scrollWidth) + pad;
    const w = Math.max(c.min || 80, base);
    setWidths((prev) => ({ ...prev, [key]: w }));
    // after state update, recompute overflow
    setTimeout(() => recomputeOverflow(), 0);
  }
  // No sticky offsets needed (no horizontal scroll)

  return (
    <div
      ref={containerRef}
      className={`admin-table rounded-xl ${
        needScroll ? "overflow-x-auto" : "overflow-x-hidden"
      }`}
    >
      <table
        ref={tableRef}
        className="text-sm"
        style={{ width: needScroll ? totalWidth : "100%" }}
      >
        <thead>
          <tr className="text-left">
            {columns.map((c, idx) => (
              <th
                key={c.key}
                ref={(el) => (headerRefs.current[c.key] = el)}
                className={"th cell-sep"}
                style={{
                  width: widths[c.key] || c.min,
                  zIndex: 4,
                }}
              >
                <div className="relative pr-2 select-none">
                  {c.label}
                  {c.key !== "actions" && (
                    <div
                      className="col-resizer"
                      onMouseDown={(e) => startResize(c.key, e)}
                      onDoubleClick={() => autoFit(c.key)}
                      aria-hidden
                    />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id} className="row hoverable">
              {/* ID */}
              <td
                className="td cell-sep whitespace-nowrap truncate"
                style={{ width: widths.id }}
                title={s.id}
              >
                <span
                  className="truncate inline-block max-w-full tt"
                  data-tip={s.id}
                >
                  {s.id}
                </span>
              </td>

              {/* Orden */}
              <td className="td cell-sep" style={{ width: widths.order }}>
                {s.archived ? "-" : s.order ?? "-"}
              </td>

              {/* Icono */}
              <td className="td cell-sep" style={{ width: widths.icon }}>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10">
                  <RenderIcon
                    iconName={s.icon}
                    className="w-6 h-6 text-red-400"
                  />
                </div>
              </td>

              {/* Título */}
              <td
                className="td cell-sep whitespace-nowrap truncate"
                style={{ width: widths.title }}
                title={s.title?.es}
              >
                {s.title?.es}
              </td>

              {/* Descripción */}
              <td
                className="td cell-sep whitespace-nowrap truncate"
                style={{ width: widths.description }}
                title={s.description?.es}
              >
                {s.description?.es}
              </td>

              {/* Estado */}
              <td className="td cell-sep" style={{ width: widths.status }}>
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-block ${
                    s.archived
                      ? "bg-yellow-500/15 text-yellow-300"
                      : "bg-green-500/15 text-green-300"
                  }`}
                >
                  {s.archived ? "Archivado" : "Activo"}
                </span>
              </td>

              {/* Acciones */}
              <td className="td cell-sep" style={{ width: widths.actions }}>
                <div className="flex items-center gap-2 justify-start pl-1 min-w-[126px]">
                  <button
                    className="icon-btn tt icon-view"
                    data-tip="Ver"
                    onClick={() => onView?.(s)}
                    aria-label="Ver"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    className="icon-btn tt icon-edit"
                    data-tip="Editar"
                    onClick={() => onEdit?.(s)}
                    aria-label="Editar"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    className={`icon-btn tt ${
                      s.archived ? "icon-restore" : "icon-archive"
                    }`}
                    data-tip={s.archived ? "Restaurar" : "Archivar"}
                    onClick={() => onArchiveToggle?.(s)}
                    aria-label={s.archived ? "Restaurar" : "Archivar"}
                  >
                    {s.archived ? (
                      <RotateCcw className="w-5 h-5" />
                    ) : (
                      <Archive className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
