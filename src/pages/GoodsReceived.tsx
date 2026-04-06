import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RecordTable from "@/components/RecordTable";
import FileUpload from "@/components/FileUpload";
import CompanySelect from "@/components/CompanySelect";
import { useGoodsReceived, usePurchaseOrders, useInvoices } from "@/hooks/useProcurementData";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { goodsReceivedSchema, extractFormData } from "@/lib/validation";

const GoodsReceived = () => {
  const { data = [], isLoading } = useGoodsReceived();
  const { data: orders = [] } = usePurchaseOrders();
  const { data: invoices = [] } = useInvoices();
  const queryClient = useQueryClient();
  const { canEdit, fullName, username } = useAuth();
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const columns = [
    { key: "grn_number", label: "GRN #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "received_date", label: "Received Date", hideOnMobile: true },
    { key: "received_by", label: "Received By", hideOnMobile: true },
    { key: "quantity_received", label: "Qty", hideOnMobile: true },
    { key: "created_by", label: "Created By", hideOnMobile: true },
    { key: "status", label: "Status" },
    {
      key: "id",
      label: "PDF",
      render: (_: any, row: any) => (
        <Button variant="ghost" size="sm" onClick={() => generatePdf(row.id)}>
          <FileDown className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const generatePdf = async (grnId: string) => {
    toast.info("Generating PDF...");
    try {
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: { type: "grn", id: grnId },
      });
      if (error) throw error;
      const blob = new Blob([data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `GRN-${grnId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = extractFormData(e.currentTarget);
    raw.quantity_received = raw.quantity_received ? Number(raw.quantity_received) : undefined;

    const result = goodsReceivedSchema.safeParse(raw);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || "Validation failed");
      return;
    }

    const seq = String(data.length + 1).padStart(5, "0");
    const num = `5${seq}`;
    const { error } = await supabase.from("goods_received").insert({
      grn_number: num,
      vendor_name: result.data.vendor_name,
      received_date: result.data.received_date || null,
      received_by: result.data.received_by || null,
      quantity_received: result.data.quantity_received ?? null,
      notes: result.data.notes || null,
      remarks: result.data.remarks || null,
      file_url: fileUrl || null,
      po_id: result.data.po_id || null,
      invoice_id: result.data.invoice_id || null,
      status: "pending",
    });

    if (error) { toast.error("Failed to create GRN"); return; }
    toast.success("Goods Received Note created");
    queryClient.invalidateQueries({ queryKey: ["goods_received"] });
    setOpen(false);
    setFileUrl("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Goods Received</h1>
          <p className="text-muted-foreground text-sm mt-1">Track received goods and deliveries</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0"><Plus className="h-4 w-4 mr-2" />New GRN</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
              <DialogHeader><DialogTitle>New Goods Received Note</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Vendor Name</Label><CompanySelect /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Linked PO</Label>
                    <Select name="po_id">
                      <SelectTrigger><SelectValue placeholder="Select PO..." /></SelectTrigger>
                      <SelectContent>
                        {orders.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.po_number} - {o.vendor_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Linked Invoice</Label>
                    <Select name="invoice_id">
                      <SelectTrigger><SelectValue placeholder="Select invoice..." /></SelectTrigger>
                      <SelectContent>
                        {invoices.map((inv) => (
                          <SelectItem key={inv.id} value={inv.id}>{inv.invoice_number} - {inv.vendor_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Received Date</Label><Input name="received_date" type="date" /></div>
                  <div><Label>Received By</Label><Input name="received_by" maxLength={100} /></div>
                </div>
                <div><Label>Quantity Received</Label><Input name="quantity_received" type="number" min="0" /></div>
                <div><Label>Notes</Label><Textarea name="notes" maxLength={2000} /></div>
                <div><Label>Remarks</Label><Textarea name="remarks" maxLength={2000} placeholder="Additional remarks..." /></div>
                <div><Label>Attachments</Label><FileUpload onUploaded={setFileUrl} /></div>
                <Button type="submit" className="w-full">Create GRN</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <RecordTable columns={columns} data={data} loading={isLoading} />
    </div>
  );
};

export default GoodsReceived;
