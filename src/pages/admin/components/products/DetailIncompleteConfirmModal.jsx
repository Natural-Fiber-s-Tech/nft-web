import React from "react";

export default function DetailIncompleteConfirmModal({
  open,
  message,
  onAccept,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">
            Campos pendientes en Vista Detalle
          </h3>
        </div>
        <div className="p-6 space-y-3 text-sm dark:text-gray-50">
          <p>
            {message ||
              "La Vista Detalle tiene campos pendientes. ¿Deseas guardar solo la Vista Card por ahora?"}
          </p>
        </div>
        <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
          <button className="px-3 py-2 border rounded" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn-cta px-4 py-2" onClick={onAccept}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
