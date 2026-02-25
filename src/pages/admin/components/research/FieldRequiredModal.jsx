import React from "react";
import { AlertTriangle } from "lucide-react";

export default function FieldRequiredModal({
  open,
  missingFields,
  viewName,
  onAccept,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-white">
            Campos Obligatorios Faltantes
          </h3>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-300 text-sm">
            La vista{" "}
            <span className="font-semibold text-white">{viewName}</span> tiene
            campos obligatorios sin completar:
          </p>

          <ul className="space-y-2 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            {missingFields.map((field, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 text-gray-300 text-sm"
              >
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                {field}
              </li>
            ))}
          </ul>

          <p className="text-gray-400 text-xs">
            Por favor, complete estos campos antes de guardar.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
