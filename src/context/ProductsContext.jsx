import React, { useState, useEffect, useCallback, useMemo, createContext } from "react";

export const ProductsContext = createContext();

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("../config/firebase");

      const querySnapshot = await getDocs(collection(db, "products"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(data);
    } catch (err) {
      console.warn("Failed to load products from Firestore:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Function to refresh products (called from admin after save)
  const refreshProducts = useCallback(() => {
    console.log("🔄 Refreshing products from Firestore...");
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
