import { FileText, FileSearch, ShoppingCart, Receipt, PackageCheck } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/AuthProvider";
import {
  usePurchaseRequests,
  useQuotations,
  usePurchaseOrders,
  useInvoices,
  useGoodsReceived,
} from "@/hooks/useProcurementData";

const Dashboard = () => {
  const { fullName, username } = useAuth();
  const { data: requests = [] } = usePurchaseRequests();
  const { data: quotations = [] } = useQuotations();
  const { data: orders = [] } = usePurchaseOrders();
  const { data: invoices = [] } = useInvoices();
  const { data: grns = [] } = useGoodsReceived();

  const displayName = fullName || username || "User";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {displayName}</h1>
        <p className="text-muted-foreground mt-1">Overview of your procurement activity</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <StatsCard title="Requests" value={requests.length} icon={FileText} />
        <StatsCard title="Quotations" value={quotations.length} icon={FileSearch} />
        <StatsCard title="Purchase Orders" value={orders.length} icon={ShoppingCart} />
        <StatsCard title="Invoices" value={invoices.length} icon={Receipt} />
        <StatsCard title="Goods Received" value={grns.length} icon={PackageCheck} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No purchase orders yet</p>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((po) => (
                  <div key={po.id} className="flex items-center justify-between py-2 border-b last:border-0 gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{po.po_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{po.vendor_name}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="text-sm font-medium hidden sm:inline">
                        ${Number(po.total_amount || 0).toLocaleString()}
                      </span>
                      <StatusBadge status={po.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No requests yet</p>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 5).map((req) => (
                  <div key={req.id} className="flex items-center justify-between py-2 border-b last:border-0 gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{req.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{req.request_number} · {req.department}</p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={req.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
