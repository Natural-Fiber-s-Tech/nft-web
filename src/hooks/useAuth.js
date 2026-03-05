import { useState, useEffect } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth as firebaseAuth } from "../config/firebase";

/**
 * 🔐 useAuth: Hook para manejar la autenticación con Firebase.
 */
export function useAuth() {
    const [auth, setAuth] = useState({ loading: true, ok: false, user: null });

    useEffect(() => {
        // Suscribirse a los cambios de estado de autenticación (sesión persistente)
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
            if (user) {
                setAuth({ loading: false, ok: true, user });
            } else {
                setAuth({ loading: false, ok: false, user: null });
            }
        });

        // Limpiar suscripción al desmontar
        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        try {
            // trim parameters
            const cleanEmail = (email || "").trim();
            const cleanPassword = (password || "").trim();

            await signInWithEmailAndPassword(firebaseAuth, cleanEmail, cleanPassword);
            // onAuthStateChanged se disparará automáticamente actualizando el estado
            return { success: true };
        } catch (error) {
            console.error("Login con Firebase fallido:", error);
            let errorMessage = "Credenciales inválidas";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Correo electrónico o contraseña incorrectos.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "El formato del correo electrónico es inválido.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Demasiados intentos. Inténtalo más tarde.";
            }
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        try {
            await signOut(firebaseAuth);
            // Redirigir o recargar si es necesario
        } catch (error) {
            console.warn("Error cerrando sesión en Firebase:", error);
        }
    };

    return { ...auth, login, logout };
}
