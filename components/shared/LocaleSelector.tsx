"use client";

import { SupportedLocale } from "@/constants/locales";

interface LocaleSelectorProps {
  value: SupportedLocale;
  onChange: (locale: SupportedLocale) => void;
}

export function LocaleSelector({ value, onChange }: LocaleSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SupportedLocale)}
      aria-label="Select display language"
      className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-zinc-300 font-medium cursor-pointer"
    >
      <option value="en">🌐 English (EN)</option>
      <option value="es">Español (ES)</option>
      <option value="fr">Français (FR)</option>
      <option value="ar">العربية (AR)</option>
      <option value="zh">繁體中文 (ZH)</option>
    </select>
  );
}
