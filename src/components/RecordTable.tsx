import { useState, useMemo } from "react";
import { Search, MoreVertical, ArrowUpAZ, ArrowDownAZ, ArrowUp01, ArrowDown01, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import StatusBadge from "./StatusBadge";

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  hideOnMobile?: boolean;
  sortable?: boolean;
}

interface RecordTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
  onDelete?: (row: any) => void;
  canDeleteRow?: (row: any) => boolean;
}

type SortDir = "asc" | "desc" | null;

const RecordTable = ({ columns, data, loading, emptyMessage = "No records found", onRowClick, onDelete, canDeleteRow }: RecordTableProps) => {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [deleteRow, setDeleteRow] = useState<any>(null);

  const handleSort = (key: string, dir: SortDir) => {
    if (sortKey === key && sortDir === dir) {
      setSortKey(null);
      setSortDir(null);
    } else {
      setSortKey(key);
      setSortDir(dir);
    }
  };

  const processedData = useMemo(() => {
    let result = data;

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const val = row[col.key];
          if (val == null) return false;
          return String(val).toLowerCase().includes(term);
        })
      );
    }

    if (sortKey && sortDir) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        const aNum = Number(aVal);
        const bNum = Number(bVal);

        if (!isNaN(aNum) && !isNaN(bNum) && aVal !== "" && bVal !== "") {
          return sortDir === "asc" ? aNum - bNum : bNum - aNum;
        }

        if (sortDir === "asc") return aStr.localeCompare(bStr);
        return bStr.localeCompare(aStr);
      });
    }

    return result;
  }, [data, search, sortKey, sortDir, columns]);

  const showDeleteCol = !!onDelete;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`font-semibold ${col.hideOnMobile ? "hidden sm:table-cell" : ""}`}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable !== false && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => handleSort(col.key, "asc")}>
                            <ArrowUpAZ className="h-4 w-4 mr-2" />Sort A → Z
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort(col.key, "desc")}>
                            <ArrowDownAZ className="h-4 w-4 mr-2" />Sort Z → A
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort(col.key, "asc")}>
                            <ArrowUp01 className="h-4 w-4 mr-2" />Sort Low → High
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort(col.key, "desc")}>
                            <ArrowDown01 className="h-4 w-4 mr-2" />Sort High → Low
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableHead>
              ))}
              {showDeleteCol && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (showDeleteCol ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                  {search ? "No matching records found" : emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              processedData.map((row, i) => (
                <TableRow key={row.id || i} className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""} onClick={() => onRowClick?.(row)}>
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
                  {showDeleteCol && (
                    <TableCell>
                      {canDeleteRow?.(row) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); setDeleteRow(row); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteRow} onOpenChange={(open) => !open && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this record? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteRow) onDelete?.(deleteRow);
                setDeleteRow(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RecordTable;
