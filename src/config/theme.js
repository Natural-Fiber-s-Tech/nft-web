export const theme = {
  colors: {
    primary: {
      red: "#FF0000",
      white: "#FFFFFF",
      black: "#111827",
    },
    gray: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
    },
  },
  typography: {
    families: {
      sans: ["Inter", "system-ui", "sans-serif"],
    },
    sizes: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
    },
    weights: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
  },
  spacing: {
    container: {
      padding: "1rem",
      maxWidth: "80rem", // 1280px
    },
    section: {
      padding: "4rem 0",
    },
  },
  components: {
    buttons: {
      base: "font-medium rounded transition-colors duration-200",
      sizes: {
        sm: "px-4 py-1.5 text-xs",
        md: "px-6 py-2 text-sm",
        lg: "px-8 py-3 text-base",
      },
      variants: {
        primary: "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border border-red-600 text-red-600 hover:bg-red-600 hover:text-white",
        ghost: "text-red-600 hover:bg-red-50",
      },
    },
    cards: {
      base: "bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300",
      padding: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
  },
};
