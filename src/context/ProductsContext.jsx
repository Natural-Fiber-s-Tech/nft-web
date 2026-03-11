import React, { useState, useEffect, useCallback, useMemo, createContext } from "react";

export const ProductsContext = createContext();

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        sessionStorage.removeItem("nft_products_cache");
        sessionStorage.removeItem("nft_products_cache_time");
      } else {
        const cached = sessionStorage.getItem("nft_products_cache");
        const cacheTime = sessionStorage.getItem("nft_products_cache_time");
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime, 10);
          // 24 horas = 24 * 60 * 60 * 1000 = 86400000 ms
          if (age < 86400000) {
            console.log("⚡ Products loaded from Session Storage");
            setProducts(JSON.parse(cached));
            setLoading(false);
            return;
          }
        }
      }

      setLoading(true);
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("../config/firebase");

      const querySnapshot = await getDocs(collection(db, "products"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      sessionStorage.setItem("nft_products_cache", JSON.stringify(data));
      sessionStorage.setItem("nft_products_cache_time", Date.now().toString());
      
      setProducts(data);
    } catch (err) {
      console.warn("Failed to load products from Firestore:", err);
      if (!products.length) setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [products.length]);

  // Load on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Function to refresh products (called from admin after save)
  const refreshProducts = useCallback(() => {
    console.log("🔄 Refreshing products from Firestore (Cache cleared)...");
    loadProducts(true);
  }, [loadProducts]);

  const value = useMemo(() => ({ products, loading, refreshProducts }), [products, loading, refreshProducts]);

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};

// Hook moved to src/context/hooks/useProducts.js to satisfy Fast Refresh lint rule.
