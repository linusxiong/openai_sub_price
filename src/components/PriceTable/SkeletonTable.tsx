import { Skeleton } from "@heroui/react";

const COL_WIDTHS = ["w-6", "w-28", "w-10", "w-14", "w-14", "w-16", "w-14", "w-14", "w-16", "w-20"];

export function SkeletonTable() {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
            {COL_WIDTHS.map((w, i) => (
              <th key={i} className="px-3 py-3">
                <Skeleton animationType="shimmer" className={`h-3 ${w} rounded`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 14 }).map((_, rowIdx) => (
            <tr
              key={rowIdx}
              className={`border-b border-zinc-100 dark:border-zinc-800/50 ${
                rowIdx % 2 === 1 ? "bg-zinc-50/60 dark:bg-zinc-900/40" : ""
              }`}
            >
              {COL_WIDTHS.map((w, colIdx) => (
                <td key={colIdx} className="px-3 py-3">
                  {colIdx >= 3 ? (
                    <div className="flex flex-col gap-1.5">
                      <Skeleton animationType="shimmer" className="h-3 w-14 rounded" />
                      <Skeleton animationType="shimmer" className="h-2.5 w-10 rounded" />
                    </div>
                  ) : (
                    <Skeleton animationType="shimmer" className={`h-3 ${w} rounded`} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
