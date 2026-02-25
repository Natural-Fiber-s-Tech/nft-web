import React, { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Pencil, Archive, RotateCcw } from "lucide-react";
import "../common/admin-table.css";

export default function TeamTable({ team, onView, onEdit, onArchiveToggle }) {
  const WIDTHS_KEY = "admin_team_col_widths_v1";
  const columns = useMemo(
    () => [
      { key: "id", label: "ID", min: 60 },
      { key: "order", label: "Orden", min: 80 },
      { key: "photo", label: "Foto", min: 96 },
      { key: "name", label: "Nombre", min: 180, flexWeight: 0.45 },
      { key: "role", label: "Cargo", min: 160, flexWeight: 0.4 },
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
  const [totalWidth, setTotalWidth] = useState(0);
  const [needScroll, setNeedScroll] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(WIDTHS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          setWidths(parsed);
          setMeasured(true);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (measured) return;
    const next = {};
    columns.forEach((c) => {
      const el = headerRefs.current[c.key];
      if (!el) return;
      const pad = 24;
      const base = Math.ceil(el.scrollWidth) + pad;
      next[c.key] = Math.max(c.min || 80, base);
    });
    if (Object.keys(next).length) {
      setWidths((prev) => ({ ...prev, ...next }));
      setMeasured(true);
    }
  }, [columns, measured]);

  useEffect(() => {
    try {
      sessionStorage.setItem(WIDTHS_KEY, JSON.stringify(widths));
    } catch {}
    recomputeOverflow(widths);
  }, [widths]);

  useEffect(() => {
    const onResize = () => recomputeOverflow();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function recomputeOverflow(nextWidths = widths) {
    const cont = containerRef.current;
    const tableEl = tableRef.current;
    if (!cont) return;
    let total = 0;
    if (tableEl) total = tableEl.scrollWidth;
    else {
      const sep = (columns.length - 1) * 1;
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
    const onMove = (ev) => {
      setWidths((prev) => {
        const c = columns.find((x) => x.key === key);
        const dx = ev.clientX - startX;
        const w = Math.max(c?.min || 80, startW + dx);
        return { ...prev, [key]: w };
      });
      requestAnimationFrame(() => recomputeOverflow());
    };
    const onUp = () => {
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
    setTimeout(() => recomputeOverflow(), 0);
  }

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
            {columns.map((c) => (
              <th
                key={c.key}
                ref={(el) => (headerRefs.current[c.key] = el)}
                className={"th cell-sep"}
                style={{ width: widths[c.key] || c.min, zIndex: 4 }}
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
          {team.map((m) => (
            <tr key={m.id} className="row hoverable">
              <td
                className="td cell-sep whitespace-nowrap truncate"
                style={{ width: widths.id }}
                title={m.id}
              >
                <span
                  className="truncate inline-block max-w-full tt"
                  data-tip={m.id}
                >
                  {m.id}
                </span>
              </td>
              <td className="td cell-sep" style={{ width: widths.order }}>
                {m.archived ? "-" : m.order ?? "-"}
              </td>
              <td className="td cell-sep" style={{ width: widths.photo }}>
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10 overflow-hidden">
                  {m.photo || m.image ? (
                    <img
                      src={m.photo || m.image}
                      alt={typeof m.name === "object" ? m.name.es || m.name.en || "" : m.name}
                      className="w-10 h-10 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded" />
                  )}
                </div>
              </td>
              <td
                className="td cell-sep whitespace-nowrap truncate"
                style={{ width: widths.name }}
                title={
                  typeof m.name === "object"
                    ? m.name.es || m.name.en || ""
                    : m.name
                }
              >
                {typeof m.name === "object"
                  ? m.name.es || m.name.en || ""
                  : m.name}
              </td>
              <td
                className="td cell-sep whitespace-nowrap truncate"
                style={{ width: widths.role }}
                title={
                  typeof m.role === "object"
                    ? m.role.es || m.role.en || ""
                    : m.role || m.position
                }
              >
                {typeof m.role === "object"
                  ? m.role.es || m.role.en || ""
                  : m.role || m.position}
              </td>
              <td className="td cell-sep" style={{ width: widths.status }}>
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-block ${
                    m.archived
                      ? "bg-yellow-500/15 text-yellow-300"
                      : "bg-green-500/15 text-green-300"
                  }`}
                >
                  {m.archived ? "Archivado" : "Activo"}
                </span>
              </td>
              <td className="td cell-sep" style={{ width: widths.actions }}>
                <div className="flex items-center gap-2 justify-start pl-1 min-w-[126px]">
                  <button
                    className="icon-btn tt icon-view"
                    data-tip="Ver"
                    onClick={() => onView?.(m)}
                    aria-label="Ver"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    className="icon-btn tt icon-edit"
                    data-tip="Editar"
                    onClick={() => onEdit?.(m)}
                    aria-label="Editar"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    className={`icon-btn tt ${
                      m.archived ? "icon-restore" : "icon-archive"
                    }`}
                    data-tip={m.archived ? "Restaurar" : "Archivar"}
                    onClick={() => onArchiveToggle?.(m)}
                    aria-label={m.archived ? "Restaurar" : "Archivar"}
                  >
                    {m.archived ? (
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
