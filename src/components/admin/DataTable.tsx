import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type Column<T> = {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
  getKey: (row: T) => string;
};

export function DataTable<T>({ columns, rows, emptyMessage = "No records found.", getKey }: Props<T>) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-x-auto">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow className="bg-gray-50">
            {columns.map((col) => (
              <TableHead key={col.key} className={`text-xs font-semibold text-gray-500 uppercase tracking-wide ${col.className ?? ""}`}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-12 text-gray-400 text-sm">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={getKey(row)} className="hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <TableCell key={col.key} className={`text-sm ${col.className ?? ""}`}>
                    {col.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
