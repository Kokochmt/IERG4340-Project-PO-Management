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
import CurrencySelect from "@/components/CurrencySelect";
import { usePurchaseOrders, usePurchaseRequests, useQuotations } from "@/hooks/useProcurementData";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { purchaseOrderSchema, extractFormData } from "@/lib/validation";

const PurchaseOrders = () => {
  const { data = [], isLoading } = usePurchaseOrders();
  const { data: requests = [] } = usePurchaseRequests();
  const { data: quotations = [] } = useQuotations();
  const queryClient = useQueryClient();
  const { canEdit, fullName, username } = useAuth();
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  const columns = [
    { key: "po_number", label: "PO #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "total_amount", label: "Amount", hideOnMobile: true, render: (v: number, row: any) => `${row.currency || "HKD"} ${Number(v || 0).toLocaleString()}` },
    { key: "order_date", label: "Order Date", hideOnMobile: true },
    { key: "expected_delivery", label: "Expected Delivery", hideOnMobile: true },
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

  const generatePdf = async (poId: string) => {
    toast.info("Generating PDF...");
    try {
      const { data, error } = await supabase.functions.invoke("generate-pdf", {
        body: { type: "po", id: poId },
      });
      if (error) throw error;
      const blob = new Blob([data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PO-${poId.slice(0, 8)}.pdf`;
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
    raw.total_amount = Number(raw.total_amount) || 0;
    raw.quantity = raw.quantity ? Number(raw.quantity) : undefined;

    const result = purchaseOrderSchema.safeParse(raw);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || "Validation failed");
      return;
    }

    const seq = String(data.length + 1).padStart(5, "0");
    const num = `3${seq}`;
    const { error } = await supabase.from("purchase_orders").insert({
      po_number: num,
      vendor_name: result.data.vendor_name,
      total_amount: result.data.total_amount,
      currency: result.data.currency,
      order_date: result.data.order_date || null,
      expected_delivery: result.data.expected_delivery || null,
      status: result.data.status,
      delivery_location: result.data.delivery_location || null,
      goods_description: result.data.goods_description || null,
      quantity: result.data.quantity ?? null,
      notes: result.data.notes || null,
      remarks: result.data.remarks || null,
      file_url: fileUrl || null,
      request_id: result.data.request_id || null,
      quotation_id: result.data.quotation_id || null,
    });

    if (error) { toast.error("Failed to create PO"); return; }
    toast.success("Purchase Order created");
    queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
    setOpen(false);
    setFileUrl("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage purchase orders</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0"><Plus className="h-4 w-4 mr-2" />New PO</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
              <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
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
                  <div><Label>Currency</Label><CurrencySelect /></div>
                  <div><Label>Quantity</Label><Input name="quantity" type="number" min="0" /></div>
                </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Order Date</Label><Input name="order_date" type="date" /></div>
                  <div><Label>Expected Delivery</Label><Input name="expected_delivery" type="date" /></div>
                </div>
                <div><Label>Delivery Location</Label><Input name="delivery_location" maxLength={500} /></div>
                <div><Label>Goods Description</Label><Textarea name="goods_description" maxLength={2000} /></div>
                <div><Label>Notes</Label><Textarea name="notes" maxLength={2000} /></div>
                <div><Label>Remarks</Label><Textarea name="remarks" maxLength={2000} placeholder="Additional remarks..." /></div>
                <div><Label>Attachments</Label><FileUpload onUploaded={setFileUrl} /></div>
                <Button type="submit" className="w-full">Create PO</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <RecordTable columns={columns} data={data} loading={isLoading} />
    </div>
  );
};

export default PurchaseOrders;
