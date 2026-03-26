import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RecordTable from "@/components/RecordTable";
import FileUpload from "@/components/FileUpload";
import CurrencySelect from "@/components/CurrencySelect";
import { useQuotations } from "@/hooks/useProcurementData";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { quotationSchema, extractFormData } from "@/lib/validation";

const Quotations = () => {
  const { data = [], isLoading } = useQuotations();
  const queryClient = useQueryClient();
  const { isCasualBuyer } = useAuth();
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const columns = [
    { key: "quotation_number", label: "Quotation #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "vendor_contact", label: "Contact" },
    { key: "total_amount", label: "Amount", render: (v: number, row: any) => `${row.currency || "HKD"} ${Number(v || 0).toLocaleString()}` },
    { key: "valid_until", label: "Valid Until" },
    { key: "status", label: "Status" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = extractFormData(e.currentTarget);
    raw.total_amount = Number(raw.total_amount) || 0;

    const result = quotationSchema.safeParse(raw);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || "Validation failed");
      return;
    }

    const num = `QUO-${String(data.length + 1).padStart(4, "0")}`;
    const { error } = await supabase.from("quotations").insert({
      quotation_number: num,
      vendor_name: result.data.vendor_name,
      vendor_contact: result.data.vendor_contact || null,
      total_amount: result.data.total_amount,
      currency: result.data.currency,
      valid_until: result.data.valid_until || null,
      notes: result.data.notes || null,
      remarks: result.data.remarks || null,
      file_url: fileUrl || null,
      status: "draft",
    });

    if (error) { toast.error("Failed to create quotation"); return; }
    toast.success("Quotation created");
    queryClient.invalidateQueries({ queryKey: ["quotations"] });
    setOpen(false);
    setFileUrl("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quotations</h1>
          <p className="text-muted-foreground mt-1">Track vendor quotations</p>
        </div>
        {isCasualBuyer && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Quotation</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New Quotation</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Vendor Name</Label><Input name="vendor_name" required maxLength={200} /></div>
                <div><Label>Vendor Contact</Label><Input name="vendor_contact" maxLength={200} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Amount</Label><Input name="total_amount" type="number" step="0.01" min="0" /></div>
                  <div><Label>Currency</Label><CurrencySelect /></div>
                </div>
                <div><Label>Valid Until</Label><Input name="valid_until" type="date" /></div>
                <div><Label>Notes</Label><Textarea name="notes" maxLength={2000} /></div>
                <div><Label>Remarks</Label><Textarea name="remarks" maxLength={2000} placeholder="Additional remarks..." /></div>
                <div><Label>Attachment</Label><FileUpload onUploaded={setFileUrl} /></div>
                <Button type="submit" className="w-full">Create Quotation</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <RecordTable columns={columns} data={data} loading={isLoading} />
    </div>
  );
};

export default Quotations;
