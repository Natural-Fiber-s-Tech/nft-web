import React from 'react';
import { ThemeProvider } from './ThemeContext';
import { LanguageProvider } from './LanguageContext';
import { GridProvider } from './GridContext';
import { ProductsProvider } from './ProductsContext';

export const AppProviders = ({ children }) => {
    return (
        <LanguageProvider>
            <ThemeProvider>
                <GridProvider>
                    <ProductsProvider>
                        {children}
                    </ProductsProvider>
                </GridProvider>
            </ThemeProvider>
        </LanguageProvider>
    );
};
