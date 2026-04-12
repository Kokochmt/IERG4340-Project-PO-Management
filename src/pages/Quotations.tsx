import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RecordTable from "@/components/RecordTable";
import RecordDetailDialog from "@/components/RecordDetailDialog";
import FileUpload from "@/components/FileUpload";
import CompanySelect from "@/components/CompanySelect";
import CurrencySelect from "@/components/CurrencySelect";
import { useQuotations } from "@/hooks/useProcurementData";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { quotationSchema, extractFormData } from "@/lib/validation";

const getQuotationStatus = (validUntil: string | null): string => {
  if (!validUntil) return "valid";
  return new Date(validUntil) >= new Date(new Date().toDateString()) ? "valid" : "invalid";
};

const Quotations = () => {
  const { data: rawData = [], isLoading } = useQuotations();
  const queryClient = useQueryClient();
  const { canEdit, isAdmin, fullName, username } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [detailRecord, setDetailRecord] = useState<any>(null);

  const createdBy = fullName || username || "";

  // Compute status dynamically
  const data = useMemo(() =>
    rawData.map((q) => ({ ...q, status: getQuotationStatus(q.valid_until) })),
    [rawData]
  );

  // Auto-open record from navigation state
  useEffect(() => {
    if (location.state?.openRecordId && data.length > 0) {
      const record = data.find((r) => r.id === location.state.openRecordId);
      if (record) setDetailRecord(record);
      window.history.replaceState({}, "");
    }
  }, [location.state, data]);

  const columns = [
    { key: "quotation_number", label: "Quotation #" },
    { key: "title", label: "Title" },
    { key: "vendor_name", label: "Vendor Company" },
    { key: "total_amount", label: "Amount", hideOnMobile: true, render: (v: number, row: any) => `${row.currency || "HKD"} ${Number(v || 0).toLocaleString()}` },
    { key: "valid_until", label: "Valid Until", hideOnMobile: true },
    { key: "created_by", label: "Created By", hideOnMobile: true },
    { key: "status", label: "Status" },
  ];

  const detailFields = [
    { key: "quotation_number", label: "Quotation #" },
    { key: "title", label: "Title" },
    { key: "vendor_name", label: "Vendor Company" },
    { key: "total_amount", label: "Amount", render: (v: number, row: any) => `${row.currency || "HKD"} ${Number(v || 0).toLocaleString()}` },
    { key: "valid_until", label: "Valid Until" },
    { key: "notes", label: "Notes" },
    { key: "remarks", label: "Remarks" },
    { key: "status", label: "Status" },
    { key: "created_by", label: "Created By" },
    { key: "created_at", label: "Created At", render: (v: string) => v ? new Date(v).toLocaleDateString() : "—" },
    { key: "file_url", label: "Attachment", render: (v: string) => v ? <a href={v} target="_blank" rel="noopener noreferrer" className="text-primary underline">View File</a> : "—" },
  ];

  const handleDelete = async (row: any) => {
    const { error } = await supabase.from("quotations").delete().eq("id", row.id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Quotation deleted");
    queryClient.invalidateQueries({ queryKey: ["quotations"] });
  };

  const canDeleteRow = (row: any) => isAdmin || (canEdit && row.created_by === createdBy);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = extractFormData(e.currentTarget);
    raw.total_amount = Number(raw.total_amount) || 0;

    const result = quotationSchema.safeParse(raw);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || "Validation failed");
      return;
    }

    const seq = String(rawData.length + 1).padStart(5, "0");
    const num = `2${seq}`;
    const { error } = await supabase.from("quotations").insert({
      quotation_number: num,
      title: result.data.title || null,
      vendor_name: result.data.vendor_name,
      total_amount: result.data.total_amount,
      currency: result.data.currency,
      valid_until: result.data.valid_until || null,
      notes: result.data.notes || null,
      remarks: result.data.remarks || null,
      file_url: fileUrl || null,
      status: "pending",
      created_by: fullName || username || "Unknown",
    });

    if (error) { toast.error("Failed to create quotation"); return; }
    toast.success("Quotation created");
    queryClient.invalidateQueries({ queryKey: ["quotations"] });
    setOpen(false);
    setFileUrl("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Quotations</h1>
          <p className="text-muted-foreground text-sm mt-1">Track vendor quotations</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0"><Plus className="h-4 w-4 mr-2" />New Quotation</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
              <DialogHeader><DialogTitle>New Quotation</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Title</Label><Input name="title" maxLength={200} /></div>
                <div><Label>Vendor Company</Label><CompanySelect /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Amount</Label><Input name="total_amount" type="number" step="0.01" min="0" /></div>
                  <div><Label>Currency</Label><CurrencySelect /></div>
                </div>
                <div><Label>Valid Until</Label><Input name="valid_until" type="date" /></div>
                <div><Label>Notes</Label><Textarea name="notes" maxLength={2000} /></div>
                <div><Label>Remarks</Label><Textarea name="remarks" maxLength={2000} placeholder="Additional remarks..." /></div>
                <div><Label>Attachments</Label><FileUpload onUploaded={setFileUrl} /></div>
                <Button type="submit" className="w-full">Create Quotation</Button>
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
        title="Quotation Detail"
        fields={detailFields}
      />
    </div>
  );
};

export default Quotations;
