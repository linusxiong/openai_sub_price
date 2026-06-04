import { useTranslation } from "react-i18next";
import { usePreferences } from "../store/preferences";

const LANGUAGES = [
  { key: "en", label: "English" },
  { key: "zh", label: "中文" },
  { key: "ja", label: "日本語" },
  { key: "de", label: "Deutsch" },
  { key: "fr", label: "Français" },
  { key: "es", label: "Español" },
];

export function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const { setLanguage } = usePreferences();

  return (
    <select
      aria-label={t("ui.languageLabel")}
      value={i18n.language}
      onChange={(e) => {
        i18n.changeLanguage(e.target.value);
        setLanguage(e.target.value);
      }}
      className="h-8 min-w-0 flex-1 sm:flex-none sm:w-auto px-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.key} value={lang.key}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
