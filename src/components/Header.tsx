import { Button } from "@heroui/react";
import { ArrowClockwise } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { CurrencySelector } from "./CurrencySelector";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function Header({ isRefreshing, onRefresh }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3 min-w-0">
          <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 shrink-0">
            {t("app.title")}
          </h1>
          <span className="hidden sm:block text-xs text-zinc-400 dark:text-zinc-500 truncate">
            {t("app.tagline")}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            isDisabled={isRefreshing}
            onPress={onRefresh}
            aria-label={isRefreshing ? t("ui.refreshing") : t("ui.refresh")}
          >
            <ArrowClockwise
              size={17}
              className={isRefreshing ? "animate-spin" : undefined}
            />
          </Button>
          <LanguageSelector />
          <CurrencySelector />
          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-0.5" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
