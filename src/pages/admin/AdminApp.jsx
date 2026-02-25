import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import AdminLayout from "./components/AdminLayout";
import LoginView from "./views/LoginView";
import ServicesView from "./views/ServicesView";
import ProductsView from "./views/ProductsView";
import TeamView from "./views/TeamView";
import ResearchView from "./views/ResearchView";

export default function AdminApp() {
  const auth = useAuth();
  const [section, setSection] = useState("services");

  if (auth.loading) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }

  if (!auth.ok) {
    return <LoginView />;
  }

  return (
    <AdminLayout section={section} setSection={setSection}>
      {section === "services" && <ServicesView />}
      {section === "products" && <ProductsView />}
      {section === "team" && <TeamView />}
      {section === "research" && <ResearchView />}
    </AdminLayout>
  );
}
