import React from "react";
import {
  Brain,
  Settings,
  BookOpen,
  Users,
  BarChart3,
  Lightbulb,
} from "lucide-react";

// Local lucide-react icon map we already use in the project
export const localIconMap = {
  Brain,
  Settings,
  BookOpen,
  Users,
  BarChart3,
  Lightbulb,
};

export function RenderIcon({
  iconName,
  className = "w-6 h-6",
  fallback = "Brain",
}) {
  // Ensure iconName is a string to prevent runtime errors
  const safeIconName = typeof iconName === "string" ? iconName : "";

  // 1) Try local lucide icons first (e.g., "Brain", "Settings")
  if (safeIconName && localIconMap[safeIconName]) {
    const Icon = localIconMap[safeIconName];
    return <Icon className={className} />;
  }

  // 2) Support Iconify syntax: "prefix:name" (e.g., "lucide:database")
  if (safeIconName && safeIconName.includes(":")) {
    const [prefix, name] = safeIconName.split(":");
    const color = encodeURIComponent("#ef4444"); // Tailwind red-500
    const url = `https://api.iconify.design/${prefix}/${name}.svg?color=${color}`;
    return <img src={url} alt={safeIconName} className={className} />;
  }

  // 3) Fallback to a safe local icon
  const Fallback = localIconMap[fallback] || Brain;
  return <Fallback className={className} />;
}

// A small set of suggestions for the icon selector
export const suggestedIconNames = [
  ...Object.keys(localIconMap),
  "lucide:database",
  "lucide:book-open",
  "lucide:bot",
  "mdi:robot-outline",
];
