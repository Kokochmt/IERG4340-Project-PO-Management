import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, FileDown, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RecordTable from "@/components/RecordTable";
import FileUpload from "@/components/FileUpload";
import CompanySelect from "@/components/CompanySelect";
import CurrencySelect from "@/components/CurrencySelect";
import { usePurchaseOrders, useQuotations } from "@/hooks/useProcurementData";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { purchaseOrderSchema, extractFormData } from "@/lib/validation";

// Approximate exchange rates to HKD
const TO_HKD: Record<string, number> = { HKD: 1, USD: 7.8, CNY: 1.08 };

const needsApproval = (amount: number, currency: string) => {
  const hkdEquiv = amount * (TO_HKD[currency] || 1);
  return hkdEquiv > 10000;
};

const PurchaseOrders = () => {
  const { data = [], isLoading } = usePurchaseOrders();
  const { data: quotations = [] } = useQuotations();
  const queryClient = useQueryClient();
  const { canEdit, canApprove, fullName, username } = useAuth();
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewPO, setReviewPO] = useState<any>(null);
  const [reviewComment, setReviewComment] = useState("");

  const columns = [
    { key: "po_number", label: "PO #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "total_amount", label: "Total Amount", hideOnMobile: true, render: (v: number, row: any) => `${row.currency || "HKD"} ${Number(v || 0).toLocaleString()}` },
    { key: "order_date", label: "Order Date", hideOnMobile: true },
    { key: "expected_delivery", label: "Expected Delivery", hideOnMobile: true },
    { key: "created_by", label: "Created By", hideOnMobile: true },
    {
      key: "status",
      label: "Status",
      render: (v: string, row: any) => {
        const isPending = v === "pending";
        return (
          <span
            className={isPending && canApprove ? "cursor-pointer underline text-yellow-600 font-medium" : ""}
            onClick={() => {
              if (isPending && canApprove && !row.reviewed_at) {
                setReviewPO(row);
                setReviewComment("");
                setReviewOpen(true);
              }
            }}
          >
            {v === "pending" ? "Pending Approval" : v}
          </span>
        );
      },
    },
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

  const handleReview = async (decision: "approved" | "rejected") => {
    if (!reviewPO) return;
    const reviewer = fullName || username || "Unknown";
    const { error } = await supabase
      .from("purchase_orders")
      .update({
        status: decision,
        reviewed_by: reviewer,
        review_comment: reviewComment || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reviewPO.id);
    if (error) {
      toast.error("Failed to update PO");
      return;
    }
    toast.success(`PO ${decision}`);
    queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
    setReviewOpen(false);
    setReviewPO(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = extractFormData(e.currentTarget);
    raw.total_amount = Number(raw.total_amount) || 0;

    const result = purchaseOrderSchema.safeParse(raw);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || "Validation failed");
      return;
    }

    const amount = result.data.total_amount;
    const currency = result.data.currency;
    // If creator is buying_manager or admin, auto-approve; otherwise check threshold
    let status: string;
    if (canApprove) {
      status = "approved";
    } else if (needsApproval(amount, currency)) {
      status = "pending";
    } else {
      status = "approved";
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
      status: status as any,
      delivery_location: result.data.delivery_location || null,
      goods_description: result.data.goods_description || null,
      notes: result.data.notes || null,
      remarks: result.data.remarks || null,
      file_url: fileUrl || null,
      quotation_id: result.data.quotation_id || null,
      created_by: fullName || username || "Unknown",
    });

    if (error) { toast.error("Failed to create PO"); return; }
    toast.success(status === "pending" ? "PO created — pending approval" : "Purchase Order created");
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Total Amount</Label><Input name="total_amount" type="number" step="0.01" min="0" /></div>
                  <div><Label>Currency</Label><CurrencySelect /></div>
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

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Review Purchase Order</DialogTitle></DialogHeader>
          {reviewPO && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="font-medium">PO #:</span> {reviewPO.po_number}</div>
                <div><span className="font-medium">Vendor:</span> {reviewPO.vendor_name}</div>
                <div><span className="font-medium">Amount:</span> {reviewPO.currency} {Number(reviewPO.total_amount || 0).toLocaleString()}</div>
                <div><span className="font-medium">Created By:</span> {reviewPO.created_by}</div>
                {reviewPO.goods_description && (
                  <div className="col-span-2"><span className="font-medium">Description:</span> {reviewPO.goods_description}</div>
                )}
                {reviewPO.notes && (
                  <div className="col-span-2"><span className="font-medium">Notes:</span> {reviewPO.notes}</div>
                )}
              </div>
              {reviewPO.reviewed_at ? (
                <p className="text-sm text-muted-foreground">This PO has already been reviewed by {reviewPO.reviewed_by}.</p>
              ) : (
                <>
                  <div>
                    <Label>Comment</Label>
                    <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Optional comment..." maxLength={2000} />
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="destructive" onClick={() => handleReview("rejected")}>
                      <XCircle className="h-4 w-4 mr-2" />Reject
                    </Button>
                    <Button onClick={() => handleReview("approved")}>
                      <CheckCircle className="h-4 w-4 mr-2" />Approve
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrders;
