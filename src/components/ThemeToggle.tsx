import { Button } from "@heroui/react";
import { Sun, Moon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { usePreferences } from "../store/preferences";
import { useEffect } from "react";

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, setTheme } = usePreferences();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <Button
      variant="ghost"
      size="sm"
      isIconOnly
      onPress={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? t("ui.lightMode") : t("ui.darkMode")}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </Button>
  );
}
