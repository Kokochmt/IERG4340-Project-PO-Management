import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RecordTable from "@/components/RecordTable";
import { useQuotations } from "@/hooks/useProcurementData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Quotations = () => {
  const { data = [], isLoading } = useQuotations();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const columns = [
    { key: "quotation_number", label: "Quotation #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "vendor_contact", label: "Contact" },
    { key: "total_amount", label: "Amount", render: (v: number) => `$${Number(v || 0).toLocaleString()}` },
    { key: "valid_until", label: "Valid Until" },
    { key: "status", label: "Status" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = `QUO-${String(data.length + 1).padStart(4, "0")}`;

    const { error } = await supabase.from("quotations").insert({
      quotation_number: num,
      vendor_name: fd.get("vendor_name") as string,
      vendor_contact: fd.get("vendor_contact") as string,
      total_amount: Number(fd.get("total_amount")) || 0,
      valid_until: (fd.get("valid_until") as string) || null,
      notes: fd.get("notes") as string,
      status: "draft",
    });

    if (error) { toast.error("Failed to create quotation"); return; }
    toast.success("Quotation created");
    queryClient.invalidateQueries({ queryKey: ["quotations"] });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotations</h1>
          <p className="text-muted-foreground mt-1">Track vendor quotations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Quotation</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Quotation</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Vendor Name</Label><Input name="vendor_name" required /></div>
              <div><Label>Vendor Contact</Label><Input name="vendor_contact" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Amount</Label><Input name="total_amount" type="number" step="0.01" /></div>
                <div><Label>Valid Until</Label><Input name="valid_until" type="date" /></div>
              </div>
              <div><Label>Notes</Label><Textarea name="notes" /></div>
              <Button type="submit" className="w-full">Create Quotation</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <RecordTable columns={columns} data={data} loading={isLoading} />
    </div>
  );
};

export default Quotations;
