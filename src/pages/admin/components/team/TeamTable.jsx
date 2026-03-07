import React, { useMemo } from "react";
import { Eye, Pencil, Archive, RotateCcw, Columns, Trash2 } from "lucide-react";
import { useResponsiveColumns } from "../common/useResponsiveColumns";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";

export default function TeamTable({ team, onView, onEdit, onArchiveToggle, onDelete, onOrderChange }) {
  const columns = useMemo(
    () => [
      { key: "id", label: "ID", priority: "always" },
      { key: "order", label: "Orden", priority: "always" },
      { key: "photo", label: "Foto", priority: "always" },
      { key: "name", label: "Nombre", priority: "always" },
      { key: "role", label: "Cargo", priority: "optional", optionalOrder: 1 },
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

  const getStickyStyle = (key) => {
    if (isMobile || showAllColumns) return {};
    if (key === "actions") return { position: 'sticky', right: 0, zIndex: 20, background: 'white', boxShadow: '-4px 0 8px -4px rgba(0,0,0,0.1)' };
    return {};
  };

  // Determine the top 3 items for highlighting (only active non-archived items contribute to rank)
  // Team is already sorted by order, we just need to count active items
  let activeRank = 0;

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
            {team.map((m) => {
              const isActive = !m.archived;
              let isTop3 = false;
              if (isActive) {
                activeRank++;
                isTop3 = activeRank <= 3;
              }

              return (
                <tr
                  key={m.id}
                  className={`border-b transition-colors hover:bg-gray-50/75 ${isTop3 ? "bg-amber-50/40 border-amber-100" : "border-gray-100"
                    }`}
                >
                  <td
                    className={`p-4 align-middle whitespace-nowrap overflow-hidden text-ellipsis ${!isColumnVisible("id") ? "hidden" : ""}`}
                    title={m.id}
                    style={{ width: columnWidths.id || "auto" }}
                  >
                    <span className="font-mono text-xs text-gray-400">{m.id}</span>
                  </td>

                  <td
                    className={`p-4 align-middle text-center ${!isColumnVisible("order") ? "hidden" : ""}`}
                    style={{ width: columnWidths.order || "auto" }}
                  >
                    {m.archived ? (
                      <span className="text-gray-300">-</span>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={m.order || ""}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val > 0) {
                              onOrderChange?.(m, val);
                            }
                          }}
                          className="w-16 h-8 text-center border border-gray-200 rounded text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        />
                        {isTop3 && (
                          <span className="text-[10px] font-bold text-amber-600 tracking-wider">
                            ★ INICIO
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td
                    className={`p-4 align-middle text-center ${!isColumnVisible("photo") ? "hidden" : ""}`}
                    style={{ width: columnWidths.photo || "auto" }}
                  >
                    <div className="flex items-center justify-center">
                      {m.photo || m.image ? (
                        <img
                          src={m.photo || m.image}
                          alt={m.name?.es || m.name || "Miembro"}
                          className="w-10 h-10 object-cover rounded-full border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-[10px]">
                          ?
                        </div>
                      )}
                    </div>
                  </td>

                  <td
                    className={`p-4 align-middle whitespace-nowrap overflow-hidden text-ellipsis font-medium text-gray-900 ${!isColumnVisible("name") ? "hidden" : ""
                      }`}
                    title={m.name?.es || m.name}
                    style={{ width: columnWidths.name || "auto" }}
                  >
                    {m.name?.es || m.name}
                  </td>

                  <td
                    className={`p-4 align-middle whitespace-nowrap overflow-hidden text-ellipsis text-gray-500 ${!isColumnVisible("role") ? "hidden" : ""
                      }`}
                    title={m.role?.es || m.role}
                    style={{ width: columnWidths.role || "auto" }}
                  >
                    {m.role?.es || m.role || "-"}
                  </td>

                  <td
                    className={`p-4 align-middle text-center ${!isColumnVisible("status") ? "hidden" : ""}`}
                    style={{ width: columnWidths.status || "auto", ...getStickyStyle("status") }}
                  >
                    <Badge variant={m.archived ? "warning" : "success"}>
                      {m.archived ? "Archivado" : "Activo"}
                    </Badge>
                  </td>

                  <td
                    className={`p-4 align-middle text-center ${!isColumnVisible("actions") ? "hidden" : ""}`}
                    style={{ width: columnWidths.actions || "auto", ...getStickyStyle("actions") }}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(m)} title="Ver Detalle">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onEdit(m)} title="Editar Miembro">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${m.archived ? "text-green-600 hover:bg-green-50" : "text-amber-600 hover:bg-amber-50"}`}
                        onClick={() => onArchiveToggle(m)}
                        title={m.archived ? "Restaurar Miembro" : "Archivar Miembro"}
                      >
                        {m.archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDelete?.(m)}
                        title="Eliminar Permanentemente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
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
