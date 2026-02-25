import React from "react";

const variants = {
    primary: "bg-red-600 text-white hover:bg-red-700 shadow-md",
    secondary: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 shadow-sm",
    destructive: "bg-red-100 text-red-700 hover:bg-red-200 border border-red-200",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700",
    ghost: "hover:bg-gray-100 text-gray-700",
    link: "text-red-600 underline-offset-4 hover:underline",
};

const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2",
    lg: "h-12 px-8 text-lg",
    icon: "h-10 w-10",
};

export const Button = React.forwardRef(
    ({ className = "", variant = "primary", size = "md", asChild = false, ...props }, ref) => {
        const Comp = asChild ? "span" : "button";
        return (
            <Comp
                ref={ref}
                className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";
