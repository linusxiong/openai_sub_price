import { useTranslation } from "react-i18next";
import { Chip } from "@heroui/react";

interface StatusBadgeProps {
  rank: number;
}

export function StatusBadge({ rank }: StatusBadgeProps) {
  const { t } = useTranslation();
  if (rank !== 1) return null;
  return (
    <Chip color="success" variant="soft" size="sm">
      {t("ui.lowest")}
    </Chip>
  );
}
