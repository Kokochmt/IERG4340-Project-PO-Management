import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "pending" | "approved" | "rejected" | "completed" | "cancelled" | "valid" | "invalid" | "received";

const statusStyles: Record<Status, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  approved: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  completed: "bg-primary/15 text-primary border-primary/30",
  cancelled: "bg-muted text-muted-foreground",
  valid: "bg-success/15 text-success border-success/30",
  invalid: "bg-destructive/15 text-destructive border-destructive/30",
  received: "bg-primary/15 text-primary border-primary/30",
};

const statusLabels: Partial<Record<Status, string>> = {
  pending: "Pending Approval",
};

const StatusBadge = ({ status }: { status: string | null }) => {
  const s = (status || "pending") as Status;
  const style = statusStyles[s] || "bg-muted text-muted-foreground";
  const label = statusLabels[s] || s;
  return (
    <Badge variant="outline" className={cn("capitalize text-xs font-medium whitespace-nowrap", style)}>
      {label}
    </Badge>
  );
};

export default StatusBadge;
