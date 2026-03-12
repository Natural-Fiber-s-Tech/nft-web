import React, { useMemo } from "react";
import { Eye, Pencil, Archive, RotateCcw, Columns, Trash2 } from "lucide-react";
import { useResponsiveColumns } from "../common/useResponsiveColumns";
import { Badge } from "../../../../components/ui/Badge";
import { Button } from "../../../../components/ui/Button";

export default function ResearchTable({
  research,
  onView,
  onEdit,
  onArchiveToggle,
  onDelete,
}) {
  const articles = Array.isArray(research) ? research : [];
  const columns = useMemo(
    () => [
      { key: "id", label: "ID", priority: "always" },
      { key: "order", label: "Orden", priority: "always" },
      { key: "image", label: "Imagen", priority: "always" },
      { key: "title", label: "Título", priority: "always" },
      {
        key: "journal",
        label: "Revista",
        priority: "optional",
        optionalOrder: 1,
      },
      { key: "date", label: "Fecha", priority: "optional", optionalOrder: 2 },
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
    if (key === "actions") return { position: 'sticky', right: 0, zIndex: 20, boxShadow: '-4px 0 8px -4px rgba(0,0,0,0.1)' };
    return {};
  };

  const getStickyClass = (key) => {
    if (isMobile || showAllColumns) return "";
    if (key === "actions") return "sticky-actions-cell";
    return "";
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
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
          <tbody className="[&_tr:last-child]:border-0">
            {articles.map((article, index) => (
              <tr
                key={article.slug || `article-${index}`}
                className="border-b border-gray-100 transition-colors hover:bg-gray-50/50"
              >
                <td
                  className={`p-4 align-middle whitespace-nowrap overflow-hidden text-ellipsis ${!isColumnVisible("id") ? "hidden" : ""}`}
                  title={article.slug}
                  style={{ width: columnWidths.id || "auto" }}
                >
                  <span className="font-mono text-xs text-gray-400">{article.slug}</span>
                </td>

                <td
                  className={`p-4 align-middle text-center ${!isColumnVisible("order") ? "hidden" : ""}`}
                  style={{ width: columnWidths.order || "auto" }}
                >
                  {article.archived ? <span className="text-gray-300">-</span> : article.order ?? "-"}
                </td>

                <td
                  className={`p-4 align-middle text-center ${!isColumnVisible("image") ? "hidden" : ""}`}
                  style={{ width: columnWidths.image || "auto" }}
                >
                  <div className="flex items-center justify-center">
                    {article.localImage ? (
                      <img
                        src={article.localImage}
                        alt={article.title?.es || "Artículo"}
                        className="w-10 h-10 object-cover rounded border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-[10px]">
                        N/A
                      </div>
                    )}
                  </div>
                </td>

                <td
                  className={`p-4 align-middle whitespace-nowrap overflow-hidden text-ellipsis font-medium text-gray-900 ${!isColumnVisible("title") ? "hidden" : ""
                    }`}
                  title={typeof article.title === "string" ? article.title : article.title?.es}
                  style={{ width: columnWidths.title || "auto" }}
                >
                  {typeof article.title === "string" ? article.title : article.title?.es || article.title?.en}
                </td>

                <td
                  className={`p-4 align-middle whitespace-nowrap overflow-hidden text-ellipsis text-gray-500 ${!isColumnVisible("journal") ? "hidden" : ""
                    }`}
                  title={article.journal}
                  style={{ width: columnWidths.journal || "auto" }}
                >
                  {article.journal}
                </td>

                <td
                  className={`p-4 align-middle whitespace-nowrap text-gray-500 ${!isColumnVisible("date") ? "hidden" : ""}`}
                  style={{ width: columnWidths.date || "auto" }}
                >
                  {formatDate(article.date)}
                </td>

                <td
                  className={`p-4 align-middle text-center ${!isColumnVisible("status") ? "hidden" : ""}`}
                  style={{ width: columnWidths.status || "auto", ...getStickyStyle("status") }}
                >
                  <Badge variant={article.archived ? "warning" : "success"}>
                    {article.archived ? "Archivado" : "Activo"}
                  </Badge>
                </td>

                <td
                  className={`p-4 align-middle text-center ${getStickyClass("actions")} ${!isColumnVisible("actions") ? "hidden" : ""}`}
                  style={{ width: columnWidths.actions || "auto", ...getStickyStyle("actions") }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(article)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onEdit(article)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${article.archived ? "text-green-600 hover:bg-green-50" : "text-amber-600 hover:bg-amber-50"}`}
                      onClick={() => onArchiveToggle(article)}
                      title={article.archived ? "Restaurar" : "Archivar"}
                    >
                      {article.archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                      onClick={() => onDelete(article)}
                      title="Eliminar permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
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
