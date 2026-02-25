import React from "react";
import { AlertTriangle, Archive, ArchiveRestore } from "lucide-react";

export default function ResearchArchiveConfirmModal({
  open,
  article,
  onConfirm,
  onCancel,
}) {
  if (!open || !article) return null;

  const isArchiving = !article.archived;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-700">
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            {isArchiving ? (
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Archive className="w-8 h-8 text-orange-500" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <ArchiveRestore className="w-8 h-8 text-green-500" />
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white text-center mb-2">
            {isArchiving ? "Archivar Artículo" : "Restaurar Artículo"}
          </h3>

          {/* Message */}
          <p className="text-gray-300 text-center mb-6">
            {isArchiving ? (
              <>
                ¿Estás seguro de que quieres archivar{" "}
                <span className="font-semibold text-white">
                  "{article.title?.es || article.title || "este artículo"}"
                </span>
                ?
                <br />
                <span className="text-sm text-gray-400 mt-2 block">
                  El artículo no se eliminará, pero dejará de aparecer en la
                  lista activa.
                </span>
              </>
            ) : (
              <>
                ¿Deseas restaurar{" "}
                <span className="font-semibold text-white">
                  "{article.title?.es || article.title || "este artículo"}"
                </span>
                ?
                <br />
                <span className="text-sm text-gray-400 mt-2 block">
                  El artículo volverá a aparecer en la lista activa.
                </span>
              </>
            )}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors font-medium ${
                isArchiving
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {isArchiving ? "Archivar" : "Restaurar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
