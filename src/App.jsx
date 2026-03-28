import React, { lazy, Suspense, useState, useEffect } from "react";
import { AppProviders } from "./context/AppProviders";
import Navbar from "./components/layout/Navbar";
import { Routes, Route, Link, useLocation } from "react-router-dom";

// ========================================
// ✅ WEB PÚBLICA - Carga inmediata
// ========================================
import Hero from "./components/sections/Hero";
import Products from "./components/sections/Products";
import Team from "./components/sections/Team";
import About from "./components/sections/About";
import Services from "./components/sections/Services";
import Partners from "./components/sections/Partners";
import Contact from "./components/sections/Contact";
import ProductDetail from "./pages/products/ProductDetail";
import InvestigationLanding from "./pages/investigation/investigationLanding.jsx";
import InvestigationDetail from "./pages/investigation/investigationDetail.jsx";
import Footer from "./components/layout/Footer";
import WhatsAppButton from "./components/common/WhatsAppButton";
import GridOverlay from "./components/GridOverlay";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import FAQChatbot from "./components/faqChatbot/index.jsx";
import LeadCapturePopup from "./components/leads/LeadCapturePopup";
import Unsubscribe from "./pages/verify/Unsubscribe";


// ========================================
// 🔐 CMS - Carga bajo demanda (lazy)
// ========================================
const AdminApp = lazy(() => import("./pages/admin/AdminApp"));

// Loading screen mientras carga el CMS
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
      <p className="text-gray-600 font-medium">Cargando panel de administración...</p>
    </div>
  </div>
);

const App = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.includes('adminx');

  // Lógica del Pop-up: Se muestra después de 8 segundos si no lo ha visto.
  const [isLeadPopupOpen, setIsLeadPopupOpen] = useState(false);
  useEffect(() => {
    if (isAdminRoute) return;
    const hasSeenPopup = sessionStorage.getItem('hasSeenLeadPopup');
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsLeadPopupOpen(true);
        sessionStorage.setItem('hasSeenLeadPopup', 'true');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isAdminRoute]);

  return (
    <ErrorBoundary>
      <AppProviders>
        <div className="min-h-screen bg-white transition-colors duration-300">
          <Navbar />
          <ScrollToTop />
          <GridOverlay />
          <LeadCapturePopup isOpen={isLeadPopupOpen} onClose={() => setIsLeadPopupOpen(false)} />
          <Routes >
            <Route
              path="/"
              element={
                <>
                  <main className="w-full max-w-[1110px] mx-auto px-4 pt-20">
                    <Hero />
                    <About resume />
                    <Products limit={3} />
                    <Services limit={3} />
                    <Team />
                    <Partners />
                  </main>
                </>
              }
            />
            <Route
              path="/productos"
              element={
                <>
                  <main className="w-full max-w-[1110px] mx-auto px-4 pt-20">
                    <Products />
                  </main>
                </>
              }
            />
            <Route
              path="/servicios"
              element={
                <>
                  <main className="w-full max-w-[1110px] mx-auto px-4 pt-20">
                    <Services />
                  </main>
                </>
              }
            />
            <Route
              path="/nosotros"
              element={
                <>
                  <main className="w-full max-w-[1110px] mx-auto px-4 pt-20">
                    <About />
                  </main>
                </>
              }
            />
            <Route
              path="/contacto"
              element={
                <>
                  <main className="w-full max-w-[1110px] mx-auto px-4 pt-20">
                    <Contact />
                  </main>
                </>
              }
            />
            <Route
              path="/productos/:productSlug"
              element={
                <>
                  <main className="pt-16">
                    <ProductDetail />
                  </main>
                </>
              }
            />
            <Route
              path="/investigacion"
              element={
                <>
                  <main className="w-full max-w-[1110px] mx-auto px-4 pt-20">
                    <InvestigationLanding />
                  </main>
                </>
              }
            />
            <Route
              path="/investigacion/:slug"
              element={
                <>
                  <main className="pt-16">
                    <InvestigationDetail />
                  </main>
                </>
              }
            />

            <Route
              path="/desuscribirse"
              element={
                <>
                  <main className="w-full max-w-[1110px] mx-auto px-4 pt-20">
                    <Unsubscribe />
                  </main>
                </>
              }
            />

            {/* ========================================
                      🔐 CMS - ADMIN ONLY (lazy loading)
                      ======================================== */}
            <Route
              path="/adminx"
              element={
                <Suspense fallback={<LoadingScreen />}>
                  <main className="pt-16">
                    <AdminApp />
                  </main>
                </Suspense>
              }
            />
            {/* Allow section-prefixed admin path, e.g., /contacto/adminx */}
            <Route
              path="/:prefix/adminx"
              element={
                <Suspense fallback={<LoadingScreen />}>
                  <main className="pt-16">
                    <AdminApp />
                  </main>
                </Suspense>
              }
            />
          </Routes>
          <Footer />
          {!isAdminRoute && (
            <div className="fixed bottom-5 right-5 z-40 flex flex-row gap-4 items-end">
              <WhatsAppButton />
              <FAQChatbot />
            </div>
          )}
        </div>
      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
