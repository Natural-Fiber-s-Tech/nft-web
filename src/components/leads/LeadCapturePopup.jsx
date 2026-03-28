import React, { useState } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export default function LeadCapturePopup({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, success, error
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/subscribe-lead`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No pudimos procesar tu solicitud. Intenta más tarde.');
      }

      setStatus('success');
      setEmail('');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div 
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#ffffff] dark:bg-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 transform transition-all border border-zinc-200 dark:border-zinc-800"
        role="dialog"
        aria-modal="true"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          aria-label="Cerrar modal"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {status === 'success' ? (
          <div className="text-center py-6 animation-fade-in">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
              <svg className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2">Suscripción confirmada</h3>
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
              Gracias por suscribirte. Hemos registrado tu correo electrónico y pronto recibirás nuestras próximas comunicaciones.
            </p>
            <button 
              onClick={onClose}
              className="w-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900 text-white font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="py-2">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mb-2 sm:mb-3">Suscríbete a nuestro boletín</h2>
              <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400">
                Recibe nuestras últimas investigaciones, actualizaciones de productos y noticias clave del sector directamente en tu bandeja de entrada.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="sr-only">Correo electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      className="block w-full pl-11 pr-4 py-3.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {status === 'error' && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 flex items-start gap-3">
                    <svg className="h-5 w-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="relative w-full flex justify-center py-3.5 px-4 rounded-xl text-white font-medium bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Suscribirse'
                  )}
                </button>
              </form>
            </div>
        )}
      </div>
    </div>
  );
}
