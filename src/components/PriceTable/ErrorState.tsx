import { Button } from "@heroui/react";
import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

interface ErrorStateProps {
  onRetry: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24">
      <div className="flex flex-col items-center gap-2">
        <WarningCircle size={32} className="text-zinc-400 dark:text-zinc-500" weight="light" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("ui.error")}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onPress={onRetry}
        aria-label={t("ui.retry")}
      >
        <ArrowClockwise size={15} />
        {t("ui.retry")}
      </Button>
    </div>
  );
}
