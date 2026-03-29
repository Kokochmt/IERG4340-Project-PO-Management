import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Navigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, User, Eye } from "lucide-react";

const ROLE_OPTIONS = [
  { value: "observer", label: "Observer", icon: Eye },
  { value: "casual_buyer", label: "Casual Buyer", icon: User },
  { value: "admin", label: "Admin", icon: Shield },
] as const;

const UserManagement = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

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

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole as any })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      toast.success("Role updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage user accounts and their roles
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.username || "—"}
                    {u.isDefaultAdmin && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Default
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{u.full_name || "—"}</TableCell>
                  <TableCell>
                    <RoleBadge role={u.role} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {u.isDefaultAdmin ? (
                      <span className="text-xs text-muted-foreground">Protected</span>
                    ) : (
                      <Select
                        defaultValue={u.role}
                        onValueChange={(val) =>
                          updateRole.mutate({ userId: u.id, newRole: val })
                        }
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
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
