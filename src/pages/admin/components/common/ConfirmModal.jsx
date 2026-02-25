import React from "react";

/**
 * Modal de confirmación reutilizable con soporte para tema claro/oscuro
 *
 * @param {boolean} open - Si el modal está abierto
 * @param {function} onClose - Callback al cerrar
 * @param {function} onConfirm - Callback al confirmar
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje principal
 * @param {string} type - Tipo: 'info', 'warning', 'error', 'success'
 * @param {string} confirmText - Texto del botón confirmar
 * @param {string} cancelText - Texto del botón cancelar
 * @param {boolean} showCancel - Mostrar botón cancelar (default: true)
 */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Confirmación",
  message = "",
  details = null,
  type = "info",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  showCancel = true,
}) {
  if (!open) return null;

  const typeStyles = {
    info: {
      icon: "ℹ️",
      headerBg: "bg-blue-500",
      confirmBg: "bg-blue-600 hover:bg-blue-700",
    },
    warning: {
      icon: "⚠️",
      headerBg: "bg-amber-500",
      confirmBg: "bg-amber-600 hover:bg-amber-700",
    },
    error: {
      icon: "❌",
      headerBg: "bg-red-500",
      confirmBg: "bg-red-600 hover:bg-red-700",
    },
    success: {
      icon: "✅",
      headerBg: "bg-green-500",
      confirmBg: "bg-green-600 hover:bg-green-700",
    },
  };

  const style = typeStyles[type] || typeStyles.info;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${style.headerBg} px-6 py-4 flex items-center gap-3`}>
          <span className="text-3xl">{style.icon}</span>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {message}
          </p>

          {/* Details (lista de items) */}
          {details && Array.isArray(details) && details.length > 0 && (
            <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {details.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Details (texto plano) */}
          {details && typeof details === "string" && (
            <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {details}
              </p>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex justify-end gap-3">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              onConfirm?.();
              onClose?.();
            }}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${style.confirmBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
