import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  FileSearch,
  ShoppingCart,
  Receipt,
  PackageCheck,
  LogOut,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/requests", label: "Requests", icon: FileText },
  { to: "/quotations", label: "Quotations", icon: FileSearch },
  { to: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
  { to: "/invoices", label: "Invoices", icon: Receipt },
  { to: "/goods-received", label: "Goods Received", icon: PackageCheck },
];

const AppSidebar = () => {
  const location = useLocation();
  const { user, role, signOut } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-primary-foreground tracking-tight">
          ProcureFlow
        </h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">Purchase Management</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <div className="px-3 py-2">
          <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          <Badge variant="outline" className="mt-1 text-[10px] border-sidebar-border text-sidebar-foreground/70">
            {role === "casual_buyer" ? "Casual Buyer" : role === "observer" ? "Observer" : "—"}
          </Badge>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
