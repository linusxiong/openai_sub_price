export function SkeletonTable() {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
            {Array.from({ length: 10 }).map((_, i) => (
              <th key={i} className="px-3 py-3">
                <div className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 12 }).map((_, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-zinc-100 dark:border-zinc-800/50"
            >
              {Array.from({ length: 10 }).map((_, colIdx) => (
                <td key={colIdx} className="px-3 py-3">
                  <div
                    className="h-4 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse"
                    style={{ width: colIdx === 1 ? "6rem" : "4rem" }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
