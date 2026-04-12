import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RecordTable from "@/components/RecordTable";
import RecordDetailDialog from "@/components/RecordDetailDialog";
import FileUpload from "@/components/FileUpload";
import CurrencySelect from "@/components/CurrencySelect";
import { useInvoices, usePurchaseOrders, useGoodsReceived } from "@/hooks/useProcurementData";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { invoiceSchema, extractFormData } from "@/lib/validation";

const Invoices = () => {
  const { data: rawData = [], isLoading } = useInvoices();
  const { data: orders = [] } = usePurchaseOrders();
  const { data: allGrns = [] } = useGoodsReceived();
  const queryClient = useQueryClient();
  const { canEdit, isAdmin, fullName, username } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [detailRecord, setDetailRecord] = useState<any>(null);

  const [selectedPoId, setSelectedPoId] = useState("");
  const [autoVendor, setAutoVendor] = useState("");
  const [maxAmount, setMaxAmount] = useState<number | null>(null);

  const createdBy = fullName || username || "";

  // Compute status
  const data = useMemo(() =>
    rawData.map((inv) => {
      if (inv.po_id) {
        const po = orders.find((o) => o.id === inv.po_id);
        if (po) {
          const poAmount = Number(po.total_amount || 0);
          const totalInvoiced = rawData
            .filter((i) => i.po_id === inv.po_id)
            .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
          const totalGR = allGrns
            .filter((g) => g.po_id === inv.po_id)
            .reduce((sum, g) => sum + Number((g as any).total_amount || 0), 0);
          if (poAmount > 0 && totalInvoiced >= poAmount && totalGR >= poAmount) {
            return { ...inv, status: "completed" as const };
          }
        }
      }
      return { ...inv, status: "received" as const };
    }),
    [rawData, orders, allGrns]
  );

  // Auto-open record from navigation state
  useEffect(() => {
    if (location.state?.openRecordId && data.length > 0) {
      const record = data.find((r) => r.id === location.state.openRecordId);
      if (record) setDetailRecord(record);
      window.history.replaceState({}, "");
    }
  }, [location.state, data]);

  useEffect(() => {
    if (selectedPoId) {
      const po = orders.find((o) => o.id === selectedPoId);
      if (po) {
        setAutoVendor(po.vendor_name);
        const existingTotal = rawData
          .filter((inv) => inv.po_id === selectedPoId)
          .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
        setMaxAmount(Number(po.total_amount || 0) - existingTotal);
      }
    } else {
      setAutoVendor("");
      setMaxAmount(null);
    }
  }, [selectedPoId, orders, rawData]);

  useEffect(() => {
    if (!open) {
      setSelectedPoId("");
      setAutoVendor("");
      setMaxAmount(null);
      setFileUrl("");
    }
  }, [open]);

  const getLinkedPO = (poId: string | null) => {
    if (!poId) return null;
    return orders.find((o) => o.id === poId);
  };

  const columns = [
    { key: "invoice_number", label: "Invoice #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "total_amount", label: "Amount", hideOnMobile: true, render: (v: number, row: any) => `${row.currency || "HKD"} ${Number(v || 0).toLocaleString()}` },
    { key: "invoice_date", label: "Invoice Date", hideOnMobile: true },
    { key: "due_date", label: "Due Date", hideOnMobile: true },
    { key: "created_by", label: "Created By", hideOnMobile: true },
    { key: "status", label: "Status" },
  ];

  const detailFields = [
    { key: "invoice_number", label: "Invoice #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "total_amount", label: "Amount", render: (v: number, row: any) => `${row.currency || "HKD"} ${Number(v || 0).toLocaleString()}` },
    { key: "invoice_date", label: "Invoice Date" },
    { key: "due_date", label: "Due Date" },
    { key: "po_id", label: "Linked PO", render: (v: string) => {
      const po = getLinkedPO(v);
      if (!po) return "—";
      return <span className="text-primary underline cursor-pointer" onClick={() => { setDetailRecord(null); navigate("/purchase-orders", { state: { openRecordId: po.id } }); }}>{po.po_number} - {po.vendor_name}</span>;
    }},
    { key: "notes", label: "Notes" },
    { key: "remarks", label: "Remarks" },
    { key: "status", label: "Status" },
    { key: "created_by", label: "Created By" },
    { key: "created_at", label: "Created At", render: (v: string) => v ? new Date(v).toLocaleString() : "—" },
    { key: "file_url", label: "Attachment", render: (v: string) => v ? <a href={v} target="_blank" rel="noopener noreferrer" className="text-primary underline">View File</a> : "—" },
  ];

  const handleDelete = async (row: any) => {
    const { error } = await supabase.from("invoices").delete().eq("id", row.id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Invoice deleted");
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
  };

  const canDeleteRow = (row: any) => isAdmin || (canEdit && row.created_by === createdBy);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = extractFormData(e.currentTarget);
    raw.total_amount = Number(raw.total_amount) || 0;
    if (autoVendor) raw.vendor_name = autoVendor;
    if (selectedPoId) raw.po_id = selectedPoId;

    const result = invoiceSchema.safeParse(raw);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || "Validation failed");
      return;
    }

    // Validate amount against linked PO
    if (selectedPoId) {
      const po = orders.find((o) => o.id === selectedPoId);
      if (po) {
        const poAmount = Number(po.total_amount || 0);
        if (result.data.total_amount > poAmount) {
          toast.error("Invoice amount cannot exceed the linked PO amount");
          return;
        }
        const existingTotal = rawData
          .filter((inv) => inv.po_id === selectedPoId)
          .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
        if (existingTotal + result.data.total_amount > poAmount) {
          toast.warning(`Warning: Total invoice amount (${(existingTotal + result.data.total_amount).toLocaleString()}) exceeds PO amount (${poAmount.toLocaleString()}). Proceeding anyway.`);
        }
      }
    }

    const seq = String(rawData.length + 1).padStart(5, "0");
    const num = `4${seq}`;
    const { error } = await supabase.from("invoices").insert({
      invoice_number: num,
      vendor_name: result.data.vendor_name,
      total_amount: result.data.total_amount,
      currency: result.data.currency,
      invoice_date: result.data.invoice_date || null,
      due_date: result.data.due_date || null,
      notes: result.data.notes || null,
      remarks: result.data.remarks || null,
      file_url: fileUrl || null,
      po_id: result.data.po_id || null,
      status: "pending" as any,
      created_by: fullName || username || "Unknown",
    } as any);

    if (error) { toast.error("Failed to create invoice"); return; }
    toast.success("Invoice created");
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    setOpen(false);
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
                <div>
                  <Label>Linked PO</Label>
                  <Select name="po_id" value={selectedPoId} onValueChange={setSelectedPoId}>
                    <SelectTrigger><SelectValue placeholder="Select PO..." /></SelectTrigger>
                    <SelectContent>
                      {orders.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.po_number} - {o.vendor_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vendor Company</Label>
                  {selectedPoId ? (
                    <>
                      <Input value={autoVendor} readOnly className="bg-muted" />
                      <input type="hidden" name="vendor_name" value={autoVendor} />
                    </>
                  ) : (
                    <Input name="vendor_name" required maxLength={200} />
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Amount{maxAmount !== null && <span className="text-xs text-muted-foreground ml-1">(max: {maxAmount.toLocaleString()})</span>}</Label>
                    <Input name="total_amount" type="number" step="0.01" min="0" max={maxAmount !== null ? maxAmount : undefined} />
                  </div>
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
      <RecordTable columns={columns} data={data} loading={isLoading} onRowClick={setDetailRecord} onDelete={canEdit ? handleDelete : undefined} canDeleteRow={canDeleteRow} />
      <RecordDetailDialog
        open={!!detailRecord}
        onOpenChange={(open) => !open && setDetailRecord(null)}
        record={detailRecord}
        title="Invoice Detail"
        fields={detailFields}
      />
    </div>
  );
};

export default Invoices;
