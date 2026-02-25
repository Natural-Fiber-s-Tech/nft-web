import React, { useMemo } from "react";
import { RenderIcon } from "../common/IconUtils";
import { Eye, Pencil, Archive, RotateCcw, Columns } from "lucide-react";
import { useResponsiveColumns } from "../common/useResponsiveColumns";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";

export default function ServicesTable({
  services,
  onView,
  onEdit,
  onArchiveToggle,
}) {
  const columns = useMemo(
    () => [
      { key: "id", label: "ID", priority: "always" },
      { key: "order", label: "Orden", priority: "always" },
      { key: "icon", label: "Icono", priority: "always" },
      { key: "title", label: "Título", priority: "always" },
      {
        key: "features",
        label: "Características",
        priority: "optional",
        optionalOrder: 1,
      },
      {
        key: "description",
        label: "Descripción",
        priority: "optional",
        optionalOrder: 2,
      },
      { key: "status", label: "Estado", priority: "always" },
      { key: "actions", label: "Acciones", priority: "always" },
    ],
    []
  );

  const {
    visibleColumns,
    hiddenColumns,
    showAllColumns,
    toggleShowAll,
    containerRef,
    tableRef,
    getHeaderRef,
    isMobile,
    columnWidths,
    startResize,
    autoFitColumn,
  } = useResponsiveColumns(columns, 480);

  const isColumnVisible = (key) => {
    if (key === "status" || key === "actions") return true;
    return visibleColumns.some((col) => col.key === key);
  };

  const isSticky = (key) => key === "status" || key === "actions";

  const getStickyClass = (key) => {
    if (!isSticky(key) || isMobile || showAllColumns) return "";
    if (key === "actions") return "sticky right-0 z-20 bg-white shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]";
    if (key === "status") return "sticky right-[80px] z-10 bg-white shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]"; // Approximation, JS doesn't calc 'right' value for us here seamlessly, might need dynamic style or just assume width.
    // Actually, sticky positioning with multiple columns requires knowing the width of the following sticky column.
    // 'actions' is last, so right-0. 'status' is before actions.
    // If 'actions' width is dynamic, pure CSS sticky 'right' for 'status' is hard without calc().
    // For simplicity, let's only stick 'actions' or manage 'status' with a fixed width or specific logic.
    // The previous CSS didn't seem to sticky 'status' properly unless it had a known right.
    return "";
  };

  // Revised sticky logic: Only sticky 'actions' col for simplicity, or hardcode status width if fixed.
  // Actions is usually fixed width.
  const getStickyStyle = (key) => {
    if (!isSticky(key) || isMobile || showAllColumns) return {};
    if (key === "actions") return { position: 'sticky', right: 0, zIndex: 20, background: 'white', boxShadow: '-4px 0 8px -4px rgba(0,0,0,0.1)' };
    // Status sticky is tricky without fixed widths. Let's stick only actions for now to avoid layout bugs.
    // If we really want status keys, we'd need to compute the width of actions column.
    return {};
  };


  return (
    <>
      <div
        ref={containerRef}
        className={`relative w-full rounded-xl border border-gray-200 shadow-sm bg-white ${isMobile || showAllColumns ? "overflow-x-auto" : "overflow-x-hidden"
          }`}
      >
        <table ref={tableRef} className="w-full caption-bottom text-sm text-left">
          <thead className="bg-gray-50/75 backdrop-blur border-b border-gray-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  ref={getHeaderRef(col.key)}
                  className={`h-10 px-4 align-middle font-medium text-gray-500 text-xs uppercase tracking-wider relative group ${!isColumnVisible(col.key) ? "hidden" : ""
                    }`}
                  style={{
                    width: columnWidths[col.key] || "auto",
                    ...getStickyStyle(col.key)
                  }}
                >
                  <div className="relative pr-2 select-none whitespace-nowrap flex items-center">
                    {col.label}
                    {col.key !== "actions" && (
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-red-400/50 opacity-0 group-hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => startResize(col.key, e)}
                        onDoubleClick={() => autoFitColumn(col.key)}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {services.map((s) => (
              <tr key={s.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/50">
                {/* ID */}
                <td
                  className={`p-4 align-middle whitespace-nowrap overflow-hidden text-ellipsis ${!isColumnVisible("id") ? "hidden" : ""}`}
                  title={s.id}
                  style={{ width: columnWidths.id || "auto" }}
                >
                  <span className="font-mono text-xs text-gray-400">{s.id}</span>
                </td>

                {/* Orden */}
                <td
                  className={`p-4 align-middle text-center ${!isColumnVisible("order") ? "hidden" : ""}`}
                  style={{ width: columnWidths.order || "auto" }}
                >
                  {s.archived ? <span className="text-gray-300">-</span> : s.order ?? "-"}
                </td>

                {/* Icono */}
                <td
                  className={`p-4 align-middle text-center ${!isColumnVisible("icon") ? "hidden" : ""}`}
                  style={{ width: columnWidths.icon || "auto" }}
                >
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600">
                    <RenderIcon iconName={s.icon} className="w-4 h-4" />
                  </div>
                </td>

                {/* Título */}
                <td
                  className={`p-4 align-middle whitespace-nowrap overflow-hidden text-ellipsis font-medium text-gray-900 ${!isColumnVisible("title") ? "hidden" : ""
                    }`}
                  title={s.title?.es}
                  style={{ width: columnWidths.title || "auto" }}
                >
                  {s.title?.es}
                </td>

                <td
                  className={`p-4 align-middle whitespace-nowrap overflow-hidden text-ellipsis text-gray-500 ${!isColumnVisible("features") ? "hidden" : ""
                    }`}
                  title={s.features?.es}
                  style={{ width: columnWidths.features || "auto" }}
                >
                  {s.features?.es || "-"}
                </td>

                <td
                  className={`p-4 align-middle whitespace-nowrap overflow-hidden text-ellipsis text-gray-500 ${!isColumnVisible("description") ? "hidden" : ""
                    }`}
                  title={s.description?.es}
                  style={{ width: columnWidths.description || "auto" }}
                >
                  {s.description?.es}
                </td>

                {/* Estado */}
                <td
                  className={`p-4 align-middle text-center ${!isColumnVisible("status") ? "hidden" : ""}`}
                  style={{ width: columnWidths.status || "auto", ...getStickyStyle("status") }}
                >
                  <Badge variant={s.archived ? "warning" : "success"}>
                    {s.archived ? "Archivado" : "Activo"}
                  </Badge>
                </td>

                {/* Acciones */}
                <td
                  className={`p-4 align-middle text-center ${!isColumnVisible("actions") ? "hidden" : ""}`}
                  style={{ width: columnWidths.actions || "auto", ...getStickyStyle("actions") }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(s)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onEdit(s)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${s.archived ? "text-green-600 hover:bg-green-50" : "text-red-600 hover:bg-red-50"}`}
                      onClick={() => onArchiveToggle(s)}
                    >
                      {s.archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isMobile && hiddenColumns.length > 0 && (
        <button
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-5 py-3 bg-red-600 text-white font-semibold rounded-full shadow-lg hover:bg-red-700 hover:-translate-y-0.5 transition-all text-sm"
          onClick={toggleShowAll}
        >
          <Columns className="w-4 h-4" />
          <span>
            {showAllColumns ? "Ocultar" : "Mostrar Ocultas"}
          </span>
          {!showAllColumns && (
            <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-white/20 text-xs">
              {hiddenColumns.length}
            </span>
          )}
        </button>
      )}
    </>
  );
}
