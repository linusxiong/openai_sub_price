import { useTranslation } from "react-i18next";
import { ArrowClockwise } from "@phosphor-icons/react";

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-zinc-500 dark:text-zinc-400">
      <p className="text-sm">{t("ui.error")}</p>
      <button
        onClick={onRetry}
        aria-label={t("ui.retry")}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <ArrowClockwise size={16} />
        {t("ui.retry")}
      </button>
    </div>
  );
}
