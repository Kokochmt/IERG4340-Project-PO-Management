import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Navigate, useBlocker } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, User, Eye, Save, Trash2, Search, MoreVertical, ArrowUpAZ, ArrowDownAZ } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "observer", label: "Observer", icon: Eye },
  { value: "casual_buyer", label: "Casual Buyer", icon: User },
  { value: "admin", label: "Admin", icon: Shield },
] as const;

type SortDir = "asc" | "desc" | null;

const UserManagement = () => {
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; username: string } | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const hasChanges = Object.keys(pendingChanges).length > 0;
  const blocker = useBlocker(hasChanges);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id, email, full_name, username, created_at")
        .order("created_at", { ascending: true });
      if (pErr) throw pErr;

      const { data: roles, error: rErr } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rErr) throw rErr;

      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) ?? []);
      return (profiles ?? []).map((p) => ({
        ...p,
        role: roleMap.get(p.id) ?? "observer",
        isDefaultAdmin: p.username === "Admin",
      }));
    },
    enabled: isAdmin,
  });

  const handleSort = (key: string, dir: SortDir) => {
    if (sortKey === key && sortDir === dir) { setSortKey(null); setSortDir(null); }
    else { setSortKey(key); setSortDir(dir); }
  };

  const filteredUsers = useMemo(() => {
    let result = users ?? [];
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((u) =>
        (u.username || "").toLowerCase().includes(term) ||
        (u.full_name || "").toLowerCase().includes(term) ||
        (u.role || "").toLowerCase().includes(term)
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
  }, [users, search, sortKey, sortDir]);

  const saveChanges = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(pendingChanges);
      for (const [userId, newRole] of entries) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole as any })
          .eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      setPendingChanges({});
      toast.success(`${Object.keys(pendingChanges).length} role(s) updated`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      setDeleteTarget(null);
      toast.success("User removed successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleRoleChange = (userId: string, currentRole: string, newRole: string) => {
    if (newRole === currentRole) {
      setPendingChanges((prev) => { const next = { ...prev }; delete next[userId]; return next; });
    } else {
      setPendingChanges((prev) => ({ ...prev, [userId]: newRole }));
    }
  };

  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage user accounts and their roles</p>
        </div>
        {hasChanges && (
          <Button onClick={() => saveChanges.mutate()} disabled={saveChanges.isPending} className="shrink-0">
            <Save className="h-4 w-4 mr-2" />Save Changes ({Object.keys(pendingChanges).length})
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader label="Username" colKey="username" /></TableHead>
                <TableHead className="hidden sm:table-cell"><SortHeader label="Full Name" colKey="full_name" /></TableHead>
                <TableHead><SortHeader label="Role" colKey="role" /></TableHead>
                <TableHead className="hidden sm:table-cell"><SortHeader label="Joined" colKey="created_at" /></TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {search ? "No matching users" : "No users found"}
                  </TableCell>
                </TableRow>
              ) : filteredUsers.map((u) => {
                const displayRole = pendingChanges[u.id] ?? u.role;
                const isChanged = u.id in pendingChanges;
                return (
                  <TableRow key={u.id} className={isChanged ? "bg-accent/30" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2 flex-wrap">
                        {u.username || "—"}
                        {u.isDefaultAdmin && <Badge variant="outline" className="text-[10px]">Default</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground sm:hidden mt-0.5">{u.full_name || "—"}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{u.full_name || "—"}</TableCell>
                    <TableCell>
                      {u.isDefaultAdmin ? (
                        <div className="flex items-center gap-2">
                          <RoleBadge role="admin" />
                          <span className="text-[10px] text-muted-foreground">Protected</span>
                        </div>
                      ) : (
                        <Select value={displayRole} onValueChange={(val) => handleRoleChange(u.id, u.role, val)}>
                          <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((r) => (
                              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {!u.isDefaultAdmin && (
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget({ id: u.id, username: u.username || "this user" })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.username}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteUser.mutate(deleteTarget.id)}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "Removing..." : "Remove User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={blocker.state === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>You have unsaved role changes. Do you want to leave without saving?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>Stay on Page</AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>Leave Without Saving</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const RoleBadge = ({ role }: { role: string }) => {
  const config = {
    admin: { label: "Admin", className: "bg-destructive/10 text-destructive border-destructive/20" },
    casual_buyer: { label: "Casual Buyer", className: "bg-primary/10 text-primary border-primary/20" },
    observer: { label: "Observer", className: "bg-muted text-muted-foreground border-border" },
  }[role] ?? { label: role, className: "" };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};

export default UserManagement;
