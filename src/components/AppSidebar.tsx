import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  FileSearch,
  ShoppingCart,
  Receipt,
  PackageCheck,
} from "lucide-react";

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
    </aside>
  );
};

export default AppSidebar;
