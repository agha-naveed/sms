// Page-by-page lists, so a school with hundreds of students never has to draw
// every row at once (which is what makes the screen freeze).
//
//   const pg = usePagination(rows, resetKey);   // rows: the full list
//   pg.pageItems                                 // only the rows to draw now
//   <Pagination pg={pg} />                       // the page controls
//
// Going to page 1 happens by itself when resetKey changes (for example when
// a filter changes). A list that is just reloaded keeps its current page.
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SIZES = [25, 50, 100];

export function usePagination(rows, resetKey, initialSize) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialSize || 25);

  const total = rows ? rows.length : 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  // New filters mean a new list: start from the first page.
  useEffect(function () { setPage(1); }, [resetKey, pageSize]);

  // If the list gets shorter (for example after a delete), stay in range.
  const current = Math.min(page, pages);

  const start = (current - 1) * pageSize;
  const pageItems = rows ? rows.slice(start, start + pageSize) : [];

  return {
    page: current, pages: pages, pageSize: pageSize, total: total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
    pageItems: pageItems,
    setPage: setPage,
    setPageSize: setPageSize,
  };
}

// 1 ... 4 5 [6] 7 8 ... 20
function pageNumbers(current, pages) {
  if (pages <= 7) return Array.from({ length: pages }, function (_, i) { return i + 1; });

  const out = [1];
  const lo = Math.max(2, current - 1);
  const hi = Math.min(pages - 1, current + 1);

  if (lo > 2) out.push("...");
  for (let i = lo; i <= hi; i++) out.push(i);
  if (hi < pages - 1) out.push("...");
  out.push(pages);
  return out;
}

export function Pagination({ pg }) {
  // Nothing to page through: a single short page needs no controls.
  if (pg.total <= SIZES[0]) return null;

  const btn =
    "min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ";

  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-100">
      <p className="text-sm text-slate-500">
        Showing <strong className="text-ink">{pg.from}-{pg.to}</strong> of <strong className="text-ink">{pg.total}</strong>
      </p>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          className={btn + "text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"}
          disabled={pg.page <= 1}
          onClick={function () { pg.setPage(pg.page - 1); }}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pageNumbers(pg.page, pg.pages).map(function (n, i) {
          if (n === "...") return <span key={"gap" + i} className="px-1 text-slate-400">...</span>;
          return (
            <button
              key={n}
              type="button"
              onClick={function () { pg.setPage(n); }}
              aria-current={n === pg.page ? "page" : undefined}
              className={btn + (n === pg.page ? "bg-teal text-white" : "text-slate-600 hover:bg-slate-100")}
            >
              {n}
            </button>
          );
        })}

        <button
          type="button"
          className={btn + "text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"}
          disabled={pg.page >= pg.pages}
          onClick={function () { pg.setPage(pg.page + 1); }}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-500">
        Rows per page
        <select
          value={pg.pageSize}
          onChange={function (e) { pg.setPageSize(Number(e.target.value)); }}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-ink"
        >
          {SIZES.map(function (n) { return <option key={n} value={n}>{n}</option>; })}
        </select>
      </label>
    </div>
  );
}
