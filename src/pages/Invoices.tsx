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
import CompanySelect from "@/components/CompanySelect";
import CurrencySelect from "@/components/CurrencySelect";
import { useInvoices, usePurchaseRequests, useQuotations } from "@/hooks/useProcurementData";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { invoiceSchema, extractFormData } from "@/lib/validation";

const Invoices = () => {
  const { data = [], isLoading } = useInvoices();
  const { data: requests = [] } = usePurchaseRequests();
  const { data: quotations = [] } = useQuotations();
  const queryClient = useQueryClient();
  const { canEdit } = useAuth();
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const columns = [
    { key: "invoice_number", label: "Invoice #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "total_amount", label: "Amount", hideOnMobile: true, render: (v: number, row: any) => `${row.currency || "HKD"} ${Number(v || 0).toLocaleString()}` },
    { key: "tax_amount", label: "Tax", hideOnMobile: true, render: (v: number, row: any) => `${row.currency || "HKD"} ${Number(v || 0).toLocaleString()}` },
    { key: "invoice_date", label: "Invoice Date", hideOnMobile: true },
    { key: "due_date", label: "Due Date", hideOnMobile: true },
    { key: "status", label: "Status" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = extractFormData(e.currentTarget);
    raw.total_amount = Number(raw.total_amount) || 0;
    raw.tax_amount = Number(raw.tax_amount) || 0;

    const result = invoiceSchema.safeParse(raw);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || "Validation failed");
      return;
    }

    const num = `INV-${String(data.length + 1).padStart(4, "0")}`;
    const { error } = await supabase.from("invoices").insert({
      invoice_number: num,
      vendor_name: result.data.vendor_name,
      total_amount: result.data.total_amount,
      tax_amount: result.data.tax_amount,
      currency: result.data.currency,
      invoice_date: result.data.invoice_date || null,
      due_date: result.data.due_date || null,
      notes: result.data.notes || null,
      remarks: result.data.remarks || null,
      file_url: fileUrl || null,
      status: "draft",
    });

    if (error) { toast.error("Failed to create invoice"); return; }
    toast.success("Invoice created");
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    setOpen(false);
    setFileUrl("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage vendor invoices</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0"><Plus className="h-4 w-4 mr-2" />New Invoice</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
              <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Vendor Name</Label><CompanySelect /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Linked Request</Label>
                    <Select name="request_id">
                      <SelectTrigger><SelectValue placeholder="Select request..." /></SelectTrigger>
                      <SelectContent>
                        {requests.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.request_number} - {r.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Linked Quotation</Label>
                    <Select name="quotation_id">
                      <SelectTrigger><SelectValue placeholder="Select quotation..." /></SelectTrigger>
                      <SelectContent>
                        {quotations.map((q) => (
                          <SelectItem key={q.id} value={q.id}>{q.quotation_number} - {q.vendor_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div><Label>Amount</Label><Input name="total_amount" type="number" step="0.01" min="0" /></div>
                  <div><Label>Tax Amount</Label><Input name="tax_amount" type="number" step="0.01" min="0" /></div>
                  <div><Label>Currency</Label><CurrencySelect /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Invoice Date</Label><Input name="invoice_date" type="date" /></div>
                  <div><Label>Due Date</Label><Input name="due_date" type="date" /></div>
                </div>
                <div><Label>Notes</Label><Textarea name="notes" maxLength={2000} /></div>
                <div><Label>Remarks</Label><Textarea name="remarks" maxLength={2000} placeholder="Additional remarks..." /></div>
                <div><Label>Attachments</Label><FileUpload onUploaded={setFileUrl} /></div>
                <Button type="submit" className="w-full">Create Invoice</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <RecordTable columns={columns} data={data} loading={isLoading} />
    </div>
  );
};

export default Invoices;
