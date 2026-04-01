import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, User, Eye, Save } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "observer", label: "Observer", icon: Eye },
  { value: "casual_buyer", label: "Casual Buyer", icon: User },
  { value: "admin", label: "Admin", icon: Shield },
] as const;

const UserManagement = () => {
  const { isAdmin, loading } = useAuth();
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});

  const hasChanges = Object.keys(pendingChanges).length > 0;

  // Block navigation when there are unsaved changes
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

  const handleRoleChange = (userId: string, currentRole: string, newRole: string) => {
    if (newRole === currentRole) {
      setPendingChanges((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } else {
      setPendingChanges((prev) => ({ ...prev, [userId]: newRole }));
    }
  };

  // Warn on browser close/refresh
  useEffect(() => {
    if (!hasChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage user accounts and their roles
          </p>
        </div>
        {hasChanges && (
          <Button
            onClick={() => saveChanges.mutate()}
            disabled={saveChanges.isPending}
            className="shrink-0"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes ({Object.keys(pendingChanges).length})
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead className="hidden sm:table-cell">Full Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden sm:table-cell">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => {
                const displayRole = pendingChanges[u.id] ?? u.role;
                const isChanged = u.id in pendingChanges;
                return (
                  <TableRow key={u.id} className={isChanged ? "bg-accent/30" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2 flex-wrap">
                        {u.username || "—"}
                        {u.isDefaultAdmin && (
                          <Badge variant="outline" className="text-[10px]">Default</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground sm:hidden mt-0.5">
                        {u.full_name || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{u.full_name || "—"}</TableCell>
                    <TableCell>
                      {u.isDefaultAdmin ? (
                        <div className="flex items-center gap-2">
                          <RoleBadge role="admin" />
                          <span className="text-[10px] text-muted-foreground">Protected</span>
                        </div>
                      ) : (
                        <Select
                          value={displayRole}
                          onValueChange={(val) => handleRoleChange(u.id, u.role, val)}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Navigation blocker dialog */}
      <AlertDialog open={blocker.state === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved role changes. Do you want to leave without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Stay on Page
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()}>
              Leave Without Saving
            </AlertDialogAction>
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
