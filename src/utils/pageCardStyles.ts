export const EMPLOYEE_PAGE_CONTAINER = "space-y-4 pb-8";

export function getPageCardStyle(theme: string): string {
  return theme === "neon-green"
    ? "neon-card rounded-2xl"
    : "bg-white shadow-sm border border-gray-100 rounded-2xl";
}

export function getListItemCardClass(theme: string): string {
  return `${getPageCardStyle(theme)} p-4 cursor-pointer hover:shadow-md transition-shadow`;
}

export function getDarkPageCardStyle(isDark: boolean): string {
  return isDark
    ? "bg-gray-800 border border-gray-700 rounded-2xl"
    : "bg-white shadow-sm border border-gray-100 rounded-2xl";
}
