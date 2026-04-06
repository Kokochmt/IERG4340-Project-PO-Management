import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RecordTable from "@/components/RecordTable";
import FileUpload from "@/components/FileUpload";
import CurrencySelect from "@/components/CurrencySelect";
import { usePurchaseRequests } from "@/hooks/useProcurementData";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { requestSchema, extractFormData } from "@/lib/validation";

const Requests = () => {
  const { data = [], isLoading } = usePurchaseRequests();
  const queryClient = useQueryClient();
  const { canEdit } = useAuth();
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const columns = [
    { key: "request_number", label: "Request #" },
    { key: "title", label: "Title" },
    { key: "requester_name", label: "Requester", hideOnMobile: true },
    { key: "department", label: "Department", hideOnMobile: true },
    { key: "created_by", label: "Created By", hideOnMobile: true },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = extractFormData(e.currentTarget);
    raw.total_amount = Number(raw.total_amount) || 0;

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
      priority: result.data.priority,
      total_amount: result.data.total_amount,
      currency: result.data.currency,
      remarks: result.data.remarks || null,
      file_url: fileUrl || null,
      status: "draft",
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Department</Label><Input name="department" maxLength={100} /></div>
                  <div>
                    <Label>Priority</Label>
                    <Select name="priority" defaultValue="medium">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Amount</Label><Input name="total_amount" type="number" step="0.01" min="0" /></div>
                  <div><Label>Currency</Label><CurrencySelect /></div>
                </div>
                <div><Label>Description</Label><Textarea name="description" maxLength={2000} /></div>
                <div><Label>Remarks</Label><Textarea name="remarks" maxLength={2000} placeholder="Additional remarks..." /></div>
                <div><Label>Attachments</Label><FileUpload onUploaded={setFileUrl} /></div>
                <Button type="submit" className="w-full">Create Request</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <RecordTable columns={columns} data={data} loading={isLoading} />
    </div>
  );
};

export default Requests;
