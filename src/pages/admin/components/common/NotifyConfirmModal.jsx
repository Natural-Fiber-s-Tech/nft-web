import React, { useState } from "react";
import { Button } from "../../../../components/ui/Button";
import { Send, AlertTriangle } from "lucide-react";

export default function NotifyConfirmModal({ open, item, itemType, onClose, onConfirm }) {
    const [isLoading, setIsLoading] = useState(false);

    if (!open || !item) return null;

    const itemName = item.name_es || item.name?.es || item.title?.es || item.title || "este elemento";
    
    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm(item, itemType);
        } finally {
            setIsLoading(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">Notificar Lanzamiento</h3>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-indigo-50 text-indigo-800 rounded-lg">
                        <Send className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-sm">¿Enviar notificación masiva?</p>
                            <p className="text-sm mt-1">
                                Estás a punto de enviar un correo a <strong>todos tus suscriptores</strong> 
                                sobre "{itemName}".
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <p className="text-xs">
                            Esta acción no se puede deshacer y los correos se enviarán inmediatamente. Asegúrate de que toda la información esté correcta en la web.
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 border-t flex items-center justify-end gap-2 bg-gray-50">
                    <Button 
                        variant="ghost" 
                        onClick={!isLoading ? onClose : undefined}
                        disabled={isLoading}
                        className="border border-gray-200"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {isLoading ? "Enviando..." : "Sí, Enviar Correos"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
