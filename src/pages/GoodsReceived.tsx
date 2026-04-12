import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, FileDown } from "lucide-react";
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
import { useGoodsReceived, usePurchaseOrders, useInvoices } from "@/hooks/useProcurementData";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { goodsReceivedSchema, extractFormData } from "@/lib/validation";

const GoodsReceived = () => {
  const { data: rawData = [], isLoading } = useGoodsReceived();
  const { data: orders = [] } = usePurchaseOrders();
  const { data: allInvoices = [] } = useInvoices();
  const queryClient = useQueryClient();
  const { canEdit, isAdmin, fullName, username } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [detailRecord, setDetailRecord] = useState<any>(null);

  const [selectedPoId, setSelectedPoId] = useState("");
  const [autoVendor, setAutoVendor] = useState("");
  const [autoCurrency, setAutoCurrency] = useState("HKD");
  const [maxAmount, setMaxAmount] = useState<number | null>(null);

  const createdBy = fullName || username || "";

  // Compute status dynamically
  const data = useMemo(() =>
    rawData.map((grn) => {
      if (grn.po_id) {
        const po = orders.find((o) => o.id === grn.po_id);
        if (po) {
          const poAmount = Number(po.total_amount || 0);
          const totalInvoiced = allInvoices
            .filter((i) => i.po_id === grn.po_id)
            .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);
          const totalGR = rawData
            .filter((g) => g.po_id === grn.po_id)
            .reduce((sum, g) => sum + Number((g as any).total_amount || 0), 0);
          if (poAmount > 0 && totalInvoiced >= poAmount && totalGR >= poAmount) {
            return { ...grn, status: "completed" as const };
          }
        }
      }
      return { ...grn, status: "received" as const };
    }),
    [rawData, orders, allInvoices]
  );

  useEffect(() => {
    if (selectedPoId) {
      const po = orders.find((o) => o.id === selectedPoId);
      if (po) {
        setAutoVendor(po.vendor_name);
        setAutoCurrency(po.currency || "HKD");
        const existingTotal = rawData
          .filter((g) => g.po_id === selectedPoId)
          .reduce((sum, g) => sum + Number((g as any).total_amount || 0), 0);
        const remaining = Number(po.total_amount || 0) - existingTotal;
        setMaxAmount(remaining);
      }
    } else {
      setAutoVendor("");
      setAutoCurrency("HKD");
      setMaxAmount(null);
    }
  }, [selectedPoId, orders, rawData]);

  useEffect(() => {
    if (!open) {
      setSelectedPoId("");
      setAutoVendor("");
      setAutoCurrency("HKD");
      setMaxAmount(null);
      setFileUrl("");
    }
  }, [open]);

  const getLinkedPO = (poId: string | null) => {
    if (!poId) return null;
    return orders.find((o) => o.id === poId);
  };

  const columns = [
    { key: "grn_number", label: "GRN #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "total_amount", label: "Amount", hideOnMobile: true, render: (v: any, row: any) => `${(row as any).currency || "HKD"} ${Number(v || 0).toLocaleString()}` },
    { key: "received_date", label: "Received Date", hideOnMobile: true },
    { key: "received_by", label: "Received By", hideOnMobile: true },
    { key: "created_by", label: "Created By", hideOnMobile: true },
    { key: "status", label: "Status" },
    {
      key: "id",
      label: "PDF",
      sortable: false,
      render: (_: any, row: any) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); generatePdf(row.id); }}>
          <FileDown className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const detailFields = [
    { key: "grn_number", label: "GRN #" },
    { key: "vendor_name", label: "Vendor" },
    { key: "total_amount", label: "Amount", render: (v: any, row: any) => `${(row as any).currency || "HKD"} ${Number(v || 0).toLocaleString()}` },
    { key: "received_date", label: "Received Date" },
    { key: "received_by", label: "Received By" },
    { key: "po_id", label: "Linked PO", render: (v: string) => {
      const po = getLinkedPO(v);
      if (!po) return "—";
      return <span className="text-primary underline cursor-pointer">{po.po_number} - {po.vendor_name}</span>;
    }},
    { key: "notes", label: "Notes" },
    { key: "remarks", label: "Remarks" },
    { key: "status", label: "Status" },
    { key: "created_by", label: "Created By" },
    { key: "created_at", label: "Created At", render: (v: string) => v ? new Date(v).toLocaleString() : "—" },
    { key: "file_url", label: "Attachment", render: (v: string) => v ? <a href={v} target="_blank" rel="noopener noreferrer" className="text-primary underline">View File</a> : "—" },
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

  const handleDelete = async (row: any) => {
    const { error } = await supabase.from("goods_received").delete().eq("id", row.id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("GRN deleted");
    queryClient.invalidateQueries({ queryKey: ["goods_received"] });
  };

  const canDeleteRow = (row: any) => isAdmin || (canEdit && row.created_by === createdBy);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = extractFormData(e.currentTarget);
    raw.total_amount = Number(raw.total_amount) || 0;
    if (autoVendor) raw.vendor_name = autoVendor;
    if (selectedPoId) raw.po_id = selectedPoId;

    const result = goodsReceivedSchema.safeParse(raw);
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
          toast.error("GRN amount cannot exceed the linked PO amount");
          return;
        }
        const existingTotal = rawData
          .filter((g) => g.po_id === selectedPoId)
          .reduce((sum, g) => sum + Number((g as any).total_amount || 0), 0);
        if (existingTotal + result.data.total_amount > poAmount) {
          toast.error(`Total GR amount (${(existingTotal + result.data.total_amount).toLocaleString()}) would exceed PO amount (${poAmount.toLocaleString()}). Entry rejected.`);
          return;
        }
        if (existingTotal >= poAmount) {
          toast.error("PO amount already fully received. Cannot create new GRN.");
          return;
        }
      }
    }

    const seq = String(rawData.length + 1).padStart(5, "0");
    const num = `5${seq}`;
    const { error } = await supabase.from("goods_received").insert({
      grn_number: num,
      vendor_name: result.data.vendor_name,
      total_amount: result.data.total_amount,
      currency: result.data.currency,
      received_date: result.data.received_date || null,
      received_by: result.data.received_by || null,
      notes: result.data.notes || null,
      remarks: result.data.remarks || null,
      file_url: fileUrl || null,
      po_id: result.data.po_id || null,
      created_by: fullName || username || "Unknown",
    } as any);

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
                  <div>
                    <Label>Currency</Label>
                    {selectedPoId ? (
                      <>
                        <Input value={autoCurrency} readOnly className="bg-muted" />
                        <input type="hidden" name="currency" value={autoCurrency} />
                      </>
                    ) : (
                      <CurrencySelect />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Received Date</Label><Input name="received_date" type="date" /></div>
                  <div><Label>Received By</Label><Input name="received_by" maxLength={100} /></div>
                </div>
                <div><Label>Notes</Label><Textarea name="notes" maxLength={2000} /></div>
                <div><Label>Remarks</Label><Textarea name="remarks" maxLength={2000} placeholder="Additional remarks..." /></div>
                <div><Label>Attachments</Label><FileUpload onUploaded={setFileUrl} /></div>
                <Button type="submit" className="w-full">Create GRN</Button>
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
        title="Goods Received Detail"
        fields={detailFields}
      />
    </div>
  );
};

export default GoodsReceived;
