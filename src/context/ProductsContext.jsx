import React, { useState, useEffect, useCallback, useMemo, createContext } from "react";

export const ProductsContext = createContext();

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch("/content/products.json");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
      setLoading(false);
    } catch (err) {
      console.warn("Failed to load products:", err);
      setProducts([]);
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Function to refresh products (called from admin after save)
  const refreshProducts = useCallback(() => {
    console.log("🔄 Refreshing products...");
    loadProducts();
  }, [loadProducts]);

  const value = useMemo(() => ({ products, loading, refreshProducts }), [products, loading, refreshProducts]);

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};

// Hook moved to src/context/hooks/useProducts.js to satisfy Fast Refresh lint rule.
