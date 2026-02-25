import React, { useEffect, useMemo, useRef, useState } from "react";
import { Eye, Pencil, Archive, RotateCcw } from "lucide-react";
import { RenderIcon } from "../common/IconUtils";
import "../common/admin-table.css";

export default function ProductsTable({ products, onView, onEdit, onArchiveToggle }) {
  const WIDTHS_KEY = "admin_products_col_widths_v1";
  const columns = useMemo(
    () => [
      { key: "id", label: "ID", min: 80 },
      { key: "order", label: "Orden", min: 80 },
      { key: "image", label: "Imagen", min: 120 },
      { key: "name", label: "Nombre (ES)", min: 200, flexWeight: 0.5 },
      { key: "category", label: "Categoría", min: 160 },
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
  const [resizing, setResizing] = useState(null);
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
      total = columns.reduce((sum, c) => sum + (nextWidths[c.key] || c.min || 80), 0) + sep;
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
        return { ...prev, [key]: w };
      });
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
    setTimeout(() => recomputeOverflow(), 0);
  }

  return (
    <div ref={containerRef} className={`admin-table rounded-xl ${needScroll ? "overflow-x-auto" : "overflow-x-hidden"}`}>
      <table ref={tableRef} className="text-sm" style={{ width: needScroll ? totalWidth : "100%" }}>
        <thead>
          <tr className="text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                ref={(el) => (headerRefs.current[c.key] = el)}
                className="th cell-sep"
                style={{ width: widths[c.key] || c.min, zIndex: 4 }}
              >
                <div className="relative pr-2 select-none">
                  {c.label}
                  {c.key !== "actions" && (
                    <div className="col-resizer" onMouseDown={(e) => startResize(c.key, e)} onDoubleClick={() => autoFit(c.key)} aria-hidden />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="row hoverable">
              <td className="td cell-sep whitespace-nowrap truncate" style={{ width: widths.id }} title={p.id}>
                <span className="truncate inline-block max-w-full tt" data-tip={p.id}>{p.id}</span>
              </td>
              <td className="td cell-sep" style={{ width: widths.order }}>{p.archived ? "-" : p.order ?? "-"}</td>
              <td className="td cell-sep" style={{ width: widths.image }}>
                <img
                  src={
                    !p.image || String(p.image).startsWith("blob:")
                      ? "/assets/images/logo/logo_NFT.png"
                      : p.image
                  }
                  alt={p.name?.es || p.name}
                  className="w-16 h-12 object-cover rounded-md border"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/images/logo/logo_NFT.png";
                  }}
                />
              </td>
              <td className="td cell-sep whitespace-nowrap truncate" style={{ width: widths.name }} title={p.name?.es || p.name}>
                {p.name?.es || p.name}
              </td>
              <td className="td cell-sep whitespace-nowrap truncate" style={{ width: widths.category }} title={p.category}>
                {p.category}
              </td>
              <td className="td cell-sep" style={{ width: widths.status }}>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full inline-block ${p.archived ? "bg-yellow-500/15 text-yellow-300" : "bg-green-500/15 text-green-300"}`}>
                  {p.archived ? "Archivado" : "Activo"}
                </span>
              </td>
              <td className="td cell-sep" style={{ width: widths.actions }}>
                <div className="flex items-center gap-2 justify-start pl-1 min-w-[126px]">
                  <button className="icon-btn tt icon-view" data-tip="Ver" onClick={() => onView?.(p)} aria-label="Ver">
                    <Eye className="w-5 h-5" />
                  </button>
                  <button className="icon-btn tt icon-edit" data-tip="Editar" onClick={() => onEdit?.(p)} aria-label="Editar">
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button className={`icon-btn tt ${p.archived ? "icon-restore" : "icon-archive"}`} data-tip={p.archived ? "Restaurar" : "Archivar"} onClick={() => onArchiveToggle?.(p)} aria-label={p.archived ? "Restaurar" : "Archivar"}>
                    {p.archived ? <RotateCcw className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
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
