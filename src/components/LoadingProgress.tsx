import { useTranslation } from "react-i18next";

interface LoadingProgressProps {
  completed: number;
  total: number;
}

export function LoadingProgress({ completed, total }: LoadingProgressProps) {
  const { t } = useTranslation();
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2 py-8 px-4 max-w-md mx-auto">
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
        {total > 0
          ? t("ui.fetching", { completed, total })
          : t("ui.loading")}
      </p>
      <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t("ui.loading")}
        />
      </div>
    </div>
  );
}
