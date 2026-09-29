type MachineryInventoryRow = {
  slNo: number;
  machineName: string;
  brand: string | null;
  quantity: number;
};

type MachineryInventoryTableProps = {
  /** Unique id, used as the `aria-labelledby` target for the category `h3`. */
  id: string;
  name: string;
  rows: MachineryInventoryRow[];
  /** Summed from `rows` at render time, never stored. */
  total: number;
};

/**
 * One machinery category: its heading, its rows and the total for that
 * category.
 *
 * The same component renders every category, so a new one needs no new markup.
 * The two layouts below are the same data twice — a real `table` for pointer
 * users, and a stacked list for narrow screens where four columns would
 * otherwise force a horizontal scroll.
 */
export default function MachineryInventoryTable({
  id,
  name,
  rows,
  total,
}: MachineryInventoryTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h3
        id={id}
        className="bg-slate-900 px-5 py-4 font-heading text-lg font-bold text-white sm:text-xl"
      >
        {name}
      </h3>

      {/* Wide screens: the tabular view, with the column semantics intact. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">
            {name} inventory, {rows.length} machines, {total} units in total
          </caption>

          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th scope="col" className="px-5 py-3 font-semibold text-slate-700">
                SL No.
              </th>
              <th scope="col" className="px-5 py-3 font-semibold text-slate-700">
                Machine Name
              </th>
              <th scope="col" className="px-5 py-3 font-semibold text-slate-700">
                Brand
              </th>
              <th
                scope="col"
                className="px-5 py-3 text-right font-semibold text-slate-700"
              >
                Quantity
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.slNo}-${row.machineName}`}
                className="border-b border-slate-100 last:border-b-0"
              >
                <td className="px-5 py-3 text-slate-500">{row.slNo}</td>
                <td className="px-5 py-3 text-slate-900">{row.machineName}</td>
                <td className="px-5 py-3 text-slate-600">
                  {row.brand ?? "—"}
                </td>
                <td className="px-5 py-3 text-right font-medium text-slate-900">
                  {row.quantity}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <th scope="row" colSpan={3} className="px-5 py-3 text-left font-semibold text-slate-900">
                Total {name}
              </th>
              <td className="px-5 py-3 text-right font-bold text-slate-900">
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Narrow screens: the same rows stacked, with no sideways scrolling. */}
      <ul className="divide-y divide-slate-100 sm:hidden">
        {rows.map((row) => (
          <li
            key={`${row.slNo}-${row.machineName}`}
            className="px-4 py-3"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-slate-500">SL {row.slNo}</span>
              <span className="text-sm font-semibold text-slate-900">
                {row.quantity} {row.quantity === 1 ? "unit" : "units"}
              </span>
            </div>

            <p className="mt-1 text-sm font-medium text-slate-900">
              {row.machineName}
            </p>
            <p className="text-xs text-slate-500">{row.brand ?? "—"}</p>
          </li>
        ))}

        <li className="flex items-baseline justify-between gap-3 bg-slate-50 px-4 py-3">
          <span className="text-sm font-semibold text-slate-900">
            Total {name}
          </span>
          <span className="text-sm font-bold text-slate-900">{total}</span>
        </li>
      </ul>
    </div>
  );
}
