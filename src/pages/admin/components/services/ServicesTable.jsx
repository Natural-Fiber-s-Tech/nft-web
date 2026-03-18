import React, { useMemo } from "react";
import { RenderIcon } from "../common/IconUtils";
import { Eye, Pencil, Archive, RotateCcw, Columns, Trash2 } from "lucide-react";
import { useResponsiveColumns } from "../common/useResponsiveColumns";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableRowWrapper, DragHandle } from "../common/SortableTable";

export default function ServicesTable({
  services,
  onView,
  onEdit,
  onArchiveToggle,
  onReorder,
  onDelete,
  isDragEnabled = true,
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

  // Revised sticky logic: Only sticky 'actions' col for simplicity, or hardcode status width if fixed.
  // Actions is usually fixed width.
  const getStickyStyle = (key) => {
    if (!isSticky(key) || isMobile || showAllColumns) return {};
    if (key === "actions") return { position: 'sticky', right: 0, zIndex: 20, boxShadow: '-4px 0 8px -4px rgba(0,0,0,0.1)' };
    return {};
  };

  const getStickyClass = (key) => {
    if (!isSticky(key) || isMobile || showAllColumns) return "";
    if (key === "actions") return "sticky-actions-cell";
    return "";
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = services.findIndex((x) => x.id === active.id);
      const newIndex = services.findIndex((x) => x.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newArray = arrayMove(services, oldIndex, newIndex);
        const sorted = newArray.map((item, index) => {
            return { ...item, order: index + 1 };
        });
        onReorder?.(sorted);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
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
                  className={`h-10 px-4 align-middle font-medium text-gray-500 text-xs uppercase tracking-wider relative group ${getStickyClass(col.key)} ${!isColumnVisible(col.key) ? "hidden" : ""}`}
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
          <SortableContext items={services.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <tbody className="[&_tr:last-child]:border-0">
              {(() => {
                let activeRank = 0;
                return services.map((s) => {
                  const isActive = !s.archived;
                  let isTop3 = false;
                  if (isActive) {
                    activeRank++;
                    isTop3 = activeRank <= 3;
                  }

                  return (
                    <SortableRowWrapper
                      key={s.id}
                      id={s.id}
                      isTop3={isTop3}
                    >
                    {/* ID */}
                    <td
                      className={`p-4 align-middle whitespace-nowrap overflow-hidden text-ellipsis ${!isColumnVisible("id") ? "hidden" : ""}`}
                      title={s.id}
                      style={{ width: columnWidths.id || "auto" }}
                    >
                      <span className="font-mono text-xs text-gray-400">{s.id}</span>
                    </td>

                    <td
                      className={`p-4 align-middle text-center ${!isColumnVisible("order") ? "hidden" : ""}`}
                      style={{ width: columnWidths.order || "auto" }}
                    >
                      {s.archived ? (
                        <span className="text-gray-300">-</span>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1">
                          {isDragEnabled ? (
                            <div className="flex items-center gap-2">
                              <DragHandle />
                              <span className="text-gray-500 font-medium text-xs">{s.order}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500 font-medium text-xs">{s.order}</span>
                          )}
                          {isTop3 && (
                            <span className="text-[10px] font-bold text-amber-600 tracking-wider">
                              ★ INICIO
                            </span>
                          )}
                        </div>
                      )}
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

                    <td
                      className={`p-4 align-middle text-center ${getStickyClass("actions")} ${!isColumnVisible("actions") ? "hidden" : ""}`}
                      style={{ width: columnWidths.actions || "auto", ...getStickyStyle("actions") }}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(s)} title="Ver Detalle">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onEdit(s)} title="Editar Servicio">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${s.archived ? "text-green-600 hover:bg-green-50" : "text-amber-600 hover:bg-amber-50"}`}
                          onClick={() => onArchiveToggle(s)}
                          title={s.archived ? "Restaurar Servicio" : "Archivar Servicio"}
                        >
                          {s.archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onDelete?.(s)}
                          title="Eliminar Permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </SortableRowWrapper>
                );
              });
            })()}
          </tbody>
          </SortableContext>
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
    </DndContext>
  );
}
