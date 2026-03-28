import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function cancelSubscription() {
      if (!email) {
        setStatus('invalid');
        return;
      }

      try {
        const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/unsubscribe-lead`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Ocurrió un error al procesar tu solicitud de desuscripción.");
        }

        setStatus('success');
      } catch (error) {
        console.error("Error al anular la suscripción:", error);
        setStatus('error');
        setErrorMessage(error.message);
      }
    }

    cancelSubscription();
  }, [email]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 px-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center shadow-lg">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-12 w-12 text-zinc-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Procesando...</h2>
            <p className="text-zinc-500 dark:text-zinc-400">Cancelando suscripción de manera segura.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animation-fade-in">
            <div className="mb-6 h-16 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">Suscripción Anulada</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
              Te has desuscrito con éxito. Ya no enviaremos más correos asociados a la cuenta <b>{email}</b>.
            </p>
            <Link 
              to="/" 
              className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-medium py-3 px-4 rounded-xl transition-colors block"
            >
              Volver al Inicio
            </Link>
          </div>
        )}

        {status === 'invalid' && (
          <div className="flex flex-col items-center animation-fade-in">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Enlace Inválido</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
              El correo indicado en el enlace está vacío o ha sido alterado de forma manual.
            </p>
            <Link 
              to="/" 
              className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium py-3 px-4 rounded-xl transition-colors block"
            >
              Volver al Inicio
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animation-fade-in">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Ocurrió un error</h2>
            <p className="text-red-500 dark:text-red-400 mb-6">{errorMessage}</p>
            <Link 
              to="/" 
              className="w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-medium py-3 px-4 rounded-xl transition-colors block"
            >
              Volver al Inicio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
