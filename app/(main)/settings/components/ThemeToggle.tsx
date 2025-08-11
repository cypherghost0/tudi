import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center justify-between py-2">
      <span>Theme</span>
      <select
        value={theme}
        onChange={e => setTheme(e.target.value)}
        className="rounded border px-2 py-1 bg-background"
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
} 