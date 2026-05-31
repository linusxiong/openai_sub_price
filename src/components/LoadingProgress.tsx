import { ProgressBar } from "@heroui/react";
import { useTranslation } from "react-i18next";

interface LoadingProgressProps {
  completed: number;
  total: number;
}

export function LoadingProgress({ completed, total }: LoadingProgressProps) {
  const { t } = useTranslation();
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2 py-4 px-4 max-w-sm mx-auto w-full">
      <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center tabular-nums">
        {total > 0 ? t("ui.fetching", { completed, total }) : t("ui.loading")}
      </p>
      <ProgressBar
        aria-label={t("ui.loading")}
        value={percent}
        minValue={0}
        maxValue={100}
        color="accent"
        size="sm"
      >
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
    </div>
  );
}
