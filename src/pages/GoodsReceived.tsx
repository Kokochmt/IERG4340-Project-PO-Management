import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RecordTable from "@/components/RecordTable";
import { useGoodsReceived } from "@/hooks/useProcurementData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GoodsReceived = () => {
  const { data = [], isLoading } = useGoodsReceived();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const columns = [
    { key: "grn_number", label: "GRN #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "received_date", label: "Received Date" },
    { key: "received_by", label: "Received By" },
    { key: "status", label: "Status" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = `GRN-${String(data.length + 1).padStart(4, "0")}`;

    const { error } = await supabase.from("goods_received").insert({
      grn_number: num,
      vendor_name: fd.get("vendor_name") as string,
      received_date: (fd.get("received_date") as string) || null,
      received_by: fd.get("received_by") as string,
      notes: fd.get("notes") as string,
      status: "pending",
    });

    if (error) { toast.error("Failed to create GRN"); return; }
    toast.success("Goods Received Note created");
    queryClient.invalidateQueries({ queryKey: ["goods_received"] });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Goods Received</h1>
          <p className="text-muted-foreground mt-1">Track received goods and deliveries</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New GRN</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Goods Received Note</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Vendor Name</Label><Input name="vendor_name" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Received Date</Label><Input name="received_date" type="date" /></div>
                <div><Label>Received By</Label><Input name="received_by" /></div>
              </div>
              <div><Label>Notes</Label><Textarea name="notes" /></div>
              <Button type="submit" className="w-full">Create GRN</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <RecordTable columns={columns} data={data} loading={isLoading} />
    </div>
  );
};

export default GoodsReceived;
