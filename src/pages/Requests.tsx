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
import { usePurchaseRequests } from "@/hooks/useProcurementData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Requests = () => {
  const { data = [], isLoading } = usePurchaseRequests();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const columns = [
    { key: "request_number", label: "Request #" },
    { key: "title", label: "Title" },
    { key: "requester_name", label: "Requester" },
    { key: "department", label: "Department" },
    { key: "priority", label: "Priority" },
    {
      key: "total_amount",
      label: "Amount",
      render: (v: number) => `$${Number(v || 0).toLocaleString()}`,
    },
    { key: "status", label: "Status" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const reqNum = `REQ-${String(data.length + 1).padStart(4, "0")}`;

    const { error } = await supabase.from("purchase_requests").insert({
      request_number: reqNum,
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      requester_name: fd.get("requester_name") as string,
      department: fd.get("department") as string,
      priority: fd.get("priority") as string || "medium",
      total_amount: Number(fd.get("total_amount")) || 0,
      status: "draft",
    });

    if (error) {
      toast.error("Failed to create request");
      return;
    }
    toast.success("Request created");
    queryClient.invalidateQueries({ queryKey: ["purchase_requests"] });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Requests</h1>
          <p className="text-muted-foreground mt-1">Manage purchase requests from your organization</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Purchase Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Title</Label><Input name="title" required /></div>
              <div><Label>Requester Name</Label><Input name="requester_name" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Department</Label><Input name="department" /></div>
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
              <div><Label>Amount</Label><Input name="total_amount" type="number" step="0.01" /></div>
              <div><Label>Description</Label><Textarea name="description" /></div>
              <Button type="submit" className="w-full">Create Request</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <RecordTable columns={columns} data={data} loading={isLoading} />
    </div>
  );
};

export default Requests;
