import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "draft" | "pending" | "approved" | "rejected" | "completed" | "cancelled";

const statusStyles: Record<Status, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-warning/15 text-warning border-warning/30",
  approved: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  completed: "bg-primary/15 text-primary border-primary/30",
  cancelled: "bg-muted text-muted-foreground",
};

const StatusBadge = ({ status }: { status: Status | null }) => {
  const s = status || "draft";
  return (
    <Badge variant="outline" className={cn("capitalize text-xs font-medium", statusStyles[s])}>
      {s}
    </Badge>
  );
};

export default StatusBadge;
