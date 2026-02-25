import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { ServiceCard } from "../../../../components/sections/Services";

export default function ArchiveConfirmModal({
  open,
  service,
  activeCount = 0,
  onClose,
  onConfirm,
}) {
  const [restoreAt, setRestoreAt] = useState(1);

  useEffect(() => {
    if (open) setRestoreAt(Math.max(1, Number(activeCount) + 1 || 1));
  }, [open, activeCount]);

  const isArchiving = !!service && !service.archived;
  const card = useMemo(() => {
    if (!service) return null;
    const toCardProps = (s) => ({
      icon: s.icon,
      title: s.title?.es || "Título del Servicio",
      description: s.description?.es || "Descripción del servicio",
      features: (s.features?.es || []).filter(Boolean).length
        ? s.features.es
        : ["Característica de ejemplo"],
      whatsapp: s.whatsapp || "51988496839",
    });
    return <ServiceCard service={toCardProps(service)} />;
  }, [service]);

  if (!open || !service) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {isArchiving ? "Archivar servicio" : "Restaurar servicio"}
          </h3>
          <button
            className="p-2 text-gray-500"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="max-w-md mx-auto">{card}</div>

          {isArchiving ? (
            <p className="text-sm text-gray-700">
              ¿Seguro que deseas archivar este servicio? Podrás restaurarlo más
              adelante.
            </p>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="restore-order">
                Restaurar en la posición
              </label>
              <input
                id="restore-order"
                type="number"
                min={1}
                max={Math.max(1, Number(activeCount) + 1)}
                value={restoreAt}
                onChange={(e) => setRestoreAt(e.target.value)}
                className={`w-28 border rounded px-3 py-2 ${
                  restoreAt === "" ||
                  Number(restoreAt) < 1 ||
                  Number(restoreAt) > Number(activeCount) + 1
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300"
                }`}
              />
              <p className="text-xs text-gray-500">
                Se insertará desplazando hacia abajo a los existentes.
                {(restoreAt === "" ||
                  Number(restoreAt) < 1 ||
                  Number(restoreAt) > Number(activeCount) + 1) && (
                  <span className="text-red-600 block mt-1">
                    Ingresa un número entre 1 y {Number(activeCount) + 1}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-3 justify-end">
          <button className="px-4 py-2 border rounded" onClick={onClose}>
            Cancelar
          </button>
          <button
            className={`px-4 py-2 rounded text-white ${
              isArchiving
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-green-600 hover:bg-green-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={
              !isArchiving &&
              (restoreAt === "" ||
                Number(restoreAt) < 1 ||
                Number(restoreAt) > Number(activeCount) + 1)
            }
            onClick={() =>
              onConfirm(isArchiving ? undefined : Number(restoreAt))
            }
          >
            {isArchiving ? "Archivar" : "Restaurar"}
          </button>
        </div>
      </div>
    </div>
  );
}
