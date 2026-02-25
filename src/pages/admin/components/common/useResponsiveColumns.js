import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Hook personalizado para manejar columnas responsivas en tablas de admin.
 *
 * @param {Array} columns - Array de objetos con estructura:
 *   { key: string, label: string, priority: 'always'|'optional', optionalOrder?: number }
 * @param {number} mobileThreshold - Ancho mínimo para forzar scroll horizontal (default: 480px)
 *
 * @returns {Object} {
 *   visibleColumns: Array de columnas visibles,
 *   hiddenColumns: Array de columnas ocultas,
 *   showAllColumns: boolean,
 *   toggleShowAll: function,
 *   containerRef: ref para el contenedor,
 *   isMobile: boolean
 * }
 */
export function useResponsiveColumns(columns, mobileThreshold = 480) {
  const containerRef = useRef(null);
  const headerRefs = useRef({});
  const tableRef = useRef(null);
  const [visibleColumns, setVisibleColumns] = useState(columns);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [measured, setMeasured] = useState(false);
  const [columnWidths, setColumnWidths] = useState({});
  const [resizing, setResizing] = useState(null); // { key, startX, startW }

  // Medir anchos de headers una vez que se montan
  useEffect(() => {
    if (measured) return;

    const widths = {};
    columns.forEach((col) => {
      const el = headerRefs.current[col.key];
      if (el) {
        // Medir el ancho natural del contenido del header
        const tempSpan = document.createElement("span");
        tempSpan.style.visibility = "hidden";
        tempSpan.style.position = "absolute";
        tempSpan.style.whiteSpace = "nowrap";
        tempSpan.style.padding = "10px 12px";
        tempSpan.style.fontWeight = "600";
        tempSpan.textContent = col.label;
        document.body.appendChild(tempSpan);
        widths[col.key] = Math.ceil(tempSpan.offsetWidth) + 40; // +40px para padding y margen
        document.body.removeChild(tempSpan);
      }
    });

    setColumnWidths(widths);
    setMeasured(true);
  }, [columns, measured]);

  // Calcular qué columnas mostrar/ocultar basado en espacio disponible
  const calculateVisibleColumns = useCallback(() => {
    if (!containerRef.current || !measured || showAllColumns) return;

    const containerWidth = containerRef.current.offsetWidth;

    // Detectar si estamos en móvil
    if (containerWidth <= mobileThreshold) {
      setIsMobile(true);
      setVisibleColumns(columns); // En móvil, mostrar todas con scroll
      setHiddenColumns([]);
      return;
    }

    setIsMobile(false);

    // Separar columnas obligatorias y opcionales
    const alwaysVisible = columns.filter((col) => col.priority === "always");
    const optional = columns
      .filter((col) => col.priority === "optional")
      .sort((a, b) => (a.optionalOrder || 0) - (b.optionalOrder || 0));

    // Calcular espacio usado por columnas obligatorias
    const alwaysVisibleWidth = alwaysVisible.reduce(
      (sum, col) => sum + (columnWidths[col.key] || 100),
      0
    );

    // Espacio disponible para columnas opcionales
    const availableSpace = containerWidth - alwaysVisibleWidth - 32; // -32px margen

    // Determinar cuántas columnas opcionales caben
    let usedSpace = 0;
    const visible = [...alwaysVisible];
    const hidden = [];

    optional.forEach((col) => {
      const colWidth = columnWidths[col.key] || 100;
      if (usedSpace + colWidth <= availableSpace) {
        visible.push(col);
        usedSpace += colWidth;
      } else {
        hidden.push(col);
      }
    });

    // Ordenar columnas visibles según su posición original
    const orderedVisible = columns.filter((col) =>
      visible.some((v) => v.key === col.key)
    );

    setVisibleColumns(orderedVisible);
    setHiddenColumns(hidden);
  }, [columns, columnWidths, measured, showAllColumns, mobileThreshold]);

  // ResizeObserver para detectar cambios de tamaño
  useEffect(() => {
    if (!containerRef.current || !measured) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateVisibleColumns();
    });

    resizeObserver.observe(containerRef.current);

    // Calcular inicialmente
    calculateVisibleColumns();

    return () => {
      resizeObserver.disconnect();
    };
  }, [calculateVisibleColumns, measured]);

  // Toggle mostrar todas las columnas
  const toggleShowAll = useCallback(() => {
    setShowAllColumns((prev) => {
      const next = !prev;
      if (next) {
        setVisibleColumns(columns);
        setHiddenColumns([]);
      } else {
        // Recalcular al cerrar
        setTimeout(calculateVisibleColumns, 0);
      }
      return next;
    });
  }, [columns, calculateVisibleColumns]);

  // Función para obtener el ref de un header específico
  const getHeaderRef = useCallback((key) => {
    return (el) => {
      headerRefs.current[key] = el;
    };
  }, []);

  // Función para iniciar resize manual de columna
  const startResize = useCallback(
    (key, e) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = columnWidths[key] || 120;
      setResizing({ key, startX, startW });
      document.body.classList.add("admin-col-resizing");

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const newWidth = Math.max(80, startW + dx); // Mínimo 80px
        setColumnWidths((prev) => ({ ...prev, [key]: newWidth }));
      };

      const onUp = () => {
        setResizing(null);
        document.body.classList.remove("admin-col-resizing");
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        // Recalcular columnas visibles después del resize
        setTimeout(calculateVisibleColumns, 0);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [columnWidths, calculateVisibleColumns]
  );

  // Doble clic para auto-ajustar al contenido del header
  const autoFitColumn = useCallback(
    (key) => {
      const el = headerRefs.current[key];
      if (!el) return;

      const tempSpan = document.createElement("span");
      tempSpan.style.visibility = "hidden";
      tempSpan.style.position = "absolute";
      tempSpan.style.whiteSpace = "nowrap";
      tempSpan.style.padding = "10px 12px";
      tempSpan.style.fontWeight = "600";
      tempSpan.textContent = el.textContent;
      document.body.appendChild(tempSpan);
      const newWidth = Math.ceil(tempSpan.offsetWidth) + 40;
      document.body.removeChild(tempSpan);

      setColumnWidths((prev) => ({ ...prev, [key]: Math.max(80, newWidth) }));
      setTimeout(calculateVisibleColumns, 0);
    },
    [calculateVisibleColumns]
  );

  return {
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
    resizing,
  };
}
