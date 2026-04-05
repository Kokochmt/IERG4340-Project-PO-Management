import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Search, MoreVertical, ArrowUpAZ, ArrowDownAZ } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCompanies } from "@/hooks/useProcurementData";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SortDir = "asc" | "desc" | null;

const CompanyList = () => {
  const { data: companies = [], isLoading } = useCompanies();
  const queryClient = useQueryClient();
  const { canEdit } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (key: string, dir: SortDir) => {
    if (sortKey === key && sortDir === dir) { setSortKey(null); setSortDir(null); }
    else { setSortKey(key); setSortDir(dir); }
  };

  const filtered = useMemo(() => {
    let result = companies;
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((c) =>
        (c.company_name || "").toLowerCase().includes(term) ||
        (c.contact_person || "").toLowerCase().includes(term) ||
        (c.contact_email || "").toLowerCase().includes(term)
      );
    }
    if (sortKey && sortDir) {
      result = [...result].sort((a, b) => {
        const aVal = String((a as any)[sortKey] ?? "").toLowerCase();
        const bVal = String((b as any)[sortKey] ?? "").toLowerCase();
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return result;
  }, [companies, search, sortKey, sortDir]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const company_name = (fd.get("company_name") as string)?.trim();
    const contact_person = (fd.get("contact_person") as string)?.trim() || null;
    const contact_email = (fd.get("contact_email") as string)?.trim() || null;
    if (!company_name) { toast.error("Company name is required"); return; }
    const { error } = await supabase.from("companies").insert({ company_name, contact_person, contact_email });
    if (error) { toast.error("Failed to add company"); return; }
    toast.success("Company added");
    queryClient.invalidateQueries({ queryKey: ["companies"] });
    setOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("companies").delete().eq("id", id);
    if (error) { toast.error("Failed to delete company"); return; }
    toast.success("Company removed");
    queryClient.invalidateQueries({ queryKey: ["companies"] });
  };

  const SortHeader = ({ label, colKey }: { label: string; colKey: string }) => (
    <div className="flex items-center gap-1">
      <span>{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => handleSort(colKey, "asc")}>
            <ArrowUpAZ className="h-4 w-4 mr-2" />Sort A → Z
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSort(colKey, "desc")}>
            <ArrowDownAZ className="h-4 w-4 mr-2" />Sort Z → A
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Company List</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage company information</p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0"><Plus className="h-4 w-4 mr-2" />Add Company</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Add Company</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Company Name</Label><Input name="company_name" required maxLength={200} /></div>
                <div><Label>Contact Person</Label><Input name="contact_person" maxLength={200} /></div>
                <div><Label>Contact Email</Label><Input name="contact_email" type="email" maxLength={200} /></div>
                <Button type="submit" className="w-full">Add Company</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead><SortHeader label="Company Name" colKey="company_name" /></TableHead>
              <TableHead className="hidden sm:table-cell"><SortHeader label="Contact Person" colKey="contact_person" /></TableHead>
              <TableHead className="hidden sm:table-cell"><SortHeader label="Email" colKey="contact_email" /></TableHead>
              {canEdit && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{search ? "No matching companies" : "No companies added yet"}</TableCell></TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.company_name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{c.contact_person || "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell">{c.contact_email || "—"}</TableCell>
                  {canEdit && (
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Company</AlertDialogTitle>
                            <AlertDialogDescription>Remove "{c.company_name}" from the company list?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CompanyList;
