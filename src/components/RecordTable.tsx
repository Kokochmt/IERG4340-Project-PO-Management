import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "./StatusBadge";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  hideOnMobile?: boolean;
}

interface RecordTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
}

const RecordTable = ({ columns, data, loading, emptyMessage = "No records found" }: RecordTableProps) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={`font-semibold ${col.hideOnMobile ? "hidden sm:table-cell" : ""}`}
              >
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, i) => (
              <TableRow key={row.id || i}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={col.hideOnMobile ? "hidden sm:table-cell" : ""}
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : col.key === "status"
                      ? <StatusBadge status={row[col.key]} />
                      : row[col.key] ?? "—"}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RecordTable;
