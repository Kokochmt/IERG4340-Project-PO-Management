import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "./StatusBadge";

interface RecordDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: any;
  title?: string;
  fields: { key: string; label: string; render?: (value: any, row: any) => React.ReactNode }[];
}

const RecordDetailDialog = ({ open, onOpenChange, record, title = "Record Detail", fields }: RecordDetailDialogProps) => {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map((field) => {
            const value = record[field.key];
            return (
              <div key={field.key} className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{field.label}</span>
                <span className="text-sm">
                  {field.render
                    ? field.render(value, record)
                    : field.key === "status"
                    ? <StatusBadge status={value} />
                    : value ?? "—"}
                </span>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecordDetailDialog;
