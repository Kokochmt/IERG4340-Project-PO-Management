import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RecordTable from "@/components/RecordTable";
import RecordDetailDialog from "@/components/RecordDetailDialog";
import FileUpload from "@/components/FileUpload";
import { usePurchaseRequests } from "@/hooks/useProcurementData";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { requestSchema, extractFormData } from "@/lib/validation";

const Requests = () => {
  const { data = [], isLoading } = usePurchaseRequests();
  const queryClient = useQueryClient();
  const { canEdit, isAdmin, fullName, username } = useAuth();
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [detailRecord, setDetailRecord] = useState<any>(null);

  const createdBy = fullName || username || "";

  const columns = [
    { key: "request_number", label: "Request #" },
    { key: "title", label: "Title" },
    { key: "requester_name", label: "Requester", hideOnMobile: true },
    { key: "department", label: "Department", hideOnMobile: true },
    { key: "created_by", label: "Created By", hideOnMobile: true },
  ];

  const detailFields = [
    { key: "request_number", label: "Request #" },
    { key: "title", label: "Title" },
    { key: "requester_name", label: "Requester" },
    { key: "department", label: "Department" },
    { key: "description", label: "Description" },
    { key: "remarks", label: "Remarks" },
    { key: "created_by", label: "Created By" },
    { key: "created_at", label: "Created At", render: (v: string) => v ? new Date(v).toLocaleString() : "—" },
    { key: "file_url", label: "Attachment", render: (v: string) => v ? <a href={v} target="_blank" rel="noopener noreferrer" className="text-primary underline">View File</a> : "—" },
  ];

  const handleDelete = async (row: any) => {
    const { error } = await supabase.from("purchase_requests").delete().eq("id", row.id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Request deleted");
    queryClient.invalidateQueries({ queryKey: ["purchase_requests"] });
  };

  const canDeleteRow = (row: any) => isAdmin || (canEdit && row.created_by === createdBy);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = extractFormData(e.currentTarget);

    const result = requestSchema.safeParse(raw);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || "Validation failed");
      return;
    }

    const seq = String(data.length + 1).padStart(5, "0");
    const reqNum = `1${seq}`;
    const { error } = await supabase.from("purchase_requests").insert({
      request_number: reqNum,
      title: result.data.title,
      description: result.data.description || null,
      requester_name: result.data.requester_name,
      department: result.data.department || null,
      currency: result.data.currency,
      remarks: result.data.remarks || null,
      file_url: fileUrl || null,
      status: "pending",
      created_by: fullName || username || "Unknown",
    });

    if (error) { toast.error("Failed to create request"); return; }
    toast.success("Request created");
    queryClient.invalidateQueries({ queryKey: ["purchase_requests"] });
    setOpen(false);
    setFileUrl("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Purchase Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage purchase requests from your organization</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0"><Plus className="h-4 w-4 mr-2" />New Request</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
              <DialogHeader><DialogTitle>New Purchase Request</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Title</Label><Input name="title" required maxLength={200} /></div>
                <div><Label>Requester Name</Label><Input name="requester_name" required maxLength={100} /></div>
                <div><Label>Department</Label><Input name="department" maxLength={100} /></div>
                <div><Label>Description</Label><Textarea name="description" maxLength={2000} /></div>
                <div><Label>Remarks</Label><Textarea name="remarks" maxLength={2000} placeholder="Additional remarks..." /></div>
                <div><Label>Attachments</Label><FileUpload onUploaded={setFileUrl} /></div>
                <Button type="submit" className="w-full">Create Request</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <RecordTable columns={columns} data={data} loading={isLoading} onRowClick={setDetailRecord} onDelete={canEdit ? handleDelete : undefined} canDeleteRow={canDeleteRow} />
      <RecordDetailDialog
        open={!!detailRecord}
        onOpenChange={(open) => !open && setDetailRecord(null)}
        record={detailRecord}
        title="Purchase Request Detail"
        fields={detailFields}
      />
    </div>
  );
};

export default Requests;
