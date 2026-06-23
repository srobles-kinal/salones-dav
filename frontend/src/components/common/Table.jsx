export default function Table({ columns, data, emptyMessage = 'Sin datos' }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-12 text-slate-500">{emptyMessage}</div>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b">
          <tr>
            {columns.map(c => (
              <th key={c.key} className="px-4 py-3 text-left font-medium text-slate-700">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i} className="border-b last:border-0 hover:bg-slate-50">
              {columns.map(c => (
                <td key={c.key} className="px-4 py-3">
                  {c.render ? c.render(row) : row[c.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
