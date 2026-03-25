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
import { usePurchaseOrders } from "@/hooks/useProcurementData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PurchaseOrders = () => {
  const { data = [], isLoading } = usePurchaseOrders();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const columns = [
    { key: "po_number", label: "PO #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "total_amount", label: "Amount", render: (v: number) => `$${Number(v || 0).toLocaleString()}` },
    { key: "order_date", label: "Order Date" },
    { key: "expected_delivery", label: "Expected Delivery" },
    { key: "status", label: "Status" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = `PO-${String(data.length + 1).padStart(4, "0")}`;

    const { error } = await supabase.from("purchase_orders").insert({
      po_number: num,
      vendor_name: fd.get("vendor_name") as string,
      total_amount: Number(fd.get("total_amount")) || 0,
      order_date: (fd.get("order_date") as string) || null,
      expected_delivery: (fd.get("expected_delivery") as string) || null,
      status: (fd.get("status") as any) || "draft",
      notes: fd.get("notes") as string,
    });

    if (error) { toast.error("Failed to create PO"); return; }
    toast.success("Purchase Order created");
    queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Track and manage purchase orders</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New PO</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Vendor Name</Label><Input name="vendor_name" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount</Label><Input name="total_amount" type="number" step="0.01" /></div>
                <div>
                  <Label>Status</Label>
                  <Select name="status" defaultValue="draft">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Order Date</Label><Input name="order_date" type="date" /></div>
                <div><Label>Expected Delivery</Label><Input name="expected_delivery" type="date" /></div>
              </div>
              <div><Label>Notes</Label><Textarea name="notes" /></div>
              <Button type="submit" className="w-full">Create PO</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <RecordTable columns={columns} data={data} loading={isLoading} />
    </div>
  );
};

export default PurchaseOrders;
