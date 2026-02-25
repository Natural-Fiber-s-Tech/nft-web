import React from "react";
import {
  Brain,
  Settings,
  BookOpen,
  Users,
  BarChart3,
  Lightbulb,
} from "lucide-react";

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
  const safeIconName = typeof iconName === "string" ? iconName : "";
  if (safeIconName && localIconMap[safeIconName]) {
    const Icon = localIconMap[safeIconName];
    return <Icon className={className} />;
  }
  if (safeIconName && safeIconName.includes(":")) {
    const [prefix, name] = safeIconName.split(":");
    const color = encodeURIComponent("#ef4444");
    const url = `https://api.iconify.design/${prefix}/${name}.svg?color=${color}`;
    return <img src={url} alt={safeIconName} className={className} />;
  }
  const Fallback = localIconMap[fallback] || Brain;
  return <Fallback className={className} />;
}

export const suggestedIconNames = [
  ...Object.keys(localIconMap),
  "lucide:database",
  "lucide:book-open",
  "lucide:bot",
  "mdi:robot-outline",
];
