import React, { useEffect } from "react";
import { useGrid } from "../context/hooks/useGrid";

// Exportamos el botón como componente separado para usarlo en el Navbar
export const GridToggleButton = () => {
  const { visible, toggleGrid } = useGrid();

  // Solo mostrar el botón en entorno de desarrollo
  if (!import.meta.env?.DEV) {
    return null;
  }

  return (
    <button
      onClick={toggleGrid}
      aria-pressed={visible}
      aria-label={`${visible ? "Ocultar" : "Mostrar"} grid`}
      className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      title="Toggle Grid Overlay (Ctrl+G)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-gray-700"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    </button>
  );
};

const GridOverlay = () => {
  const { visible, toggleGrid } = useGrid();

  // Keyboard shortcut effect
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.key.toLowerCase() === "g") {
        event.preventDefault();
        toggleGrid();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [toggleGrid]);

  return visible ? (
    <div className="fixed inset-0 z-[1] pointer-events-none">
      <div className="container-app h-full relative">
        <div className="grid-overlay-bg" />
      </div>
    </div>
  ) : null;
};

export default GridOverlay;
