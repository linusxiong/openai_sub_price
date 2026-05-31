import { useTranslation } from "react-i18next";
import { CurrencySelector } from "./CurrencySelector";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {t("app.title")}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
            {t("app.tagline")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <CurrencySelector />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
