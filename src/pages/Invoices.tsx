import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RecordTable from "@/components/RecordTable";
import { useInvoices } from "@/hooks/useProcurementData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Invoices = () => {
  const { data = [], isLoading } = useInvoices();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const columns = [
    { key: "invoice_number", label: "Invoice #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "total_amount", label: "Amount", render: (v: number) => `$${Number(v || 0).toLocaleString()}` },
    { key: "tax_amount", label: "Tax", render: (v: number) => `$${Number(v || 0).toLocaleString()}` },
    { key: "invoice_date", label: "Invoice Date" },
    { key: "due_date", label: "Due Date" },
    { key: "status", label: "Status" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = `INV-${String(data.length + 1).padStart(4, "0")}`;

    const { error } = await supabase.from("invoices").insert({
      invoice_number: num,
      vendor_name: fd.get("vendor_name") as string,
      total_amount: Number(fd.get("total_amount")) || 0,
      tax_amount: Number(fd.get("tax_amount")) || 0,
      invoice_date: (fd.get("invoice_date") as string) || null,
      due_date: (fd.get("due_date") as string) || null,
      notes: fd.get("notes") as string,
      status: "draft",
    });

    if (error) { toast.error("Failed to create invoice"); return; }
    toast.success("Invoice created");
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage vendor invoices</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Vendor Name</Label><Input name="vendor_name" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount</Label><Input name="total_amount" type="number" step="0.01" /></div>
                <div><Label>Tax Amount</Label><Input name="tax_amount" type="number" step="0.01" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Invoice Date</Label><Input name="invoice_date" type="date" /></div>
                <div><Label>Due Date</Label><Input name="due_date" type="date" /></div>
              </div>
              <div><Label>Notes</Label><Textarea name="notes" /></div>
              <Button type="submit" className="w-full">Create Invoice</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <RecordTable columns={columns} data={data} loading={isLoading} />
    </div>
  );
};

export default Invoices;
