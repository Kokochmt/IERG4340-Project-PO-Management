import { useNavigate } from "react-router-dom";
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
import { useMemo } from "react";

const Dashboard = () => {
  const { fullName, username } = useAuth();
  const { data: requests = [] } = usePurchaseRequests();
  const { data: quotations = [] } = useQuotations();
  const { data: orders = [] } = usePurchaseOrders();
  const { data: invoices = [] } = useInvoices();
  const { data: grns = [] } = useGoodsReceived();
  const navigate = useNavigate();

  const displayName = fullName || username || "User";
  const createdBy = fullName || username || "";

  const myRequests = useMemo(() => requests.filter((r) => r.created_by === createdBy), [requests, createdBy]);
  const myQuotations = useMemo(() => quotations.filter((q) => q.created_by === createdBy), [quotations, createdBy]);
  const myOrders = useMemo(() => orders.filter((o) => o.created_by === createdBy), [orders, createdBy]);
  const myInvoices = useMemo(() => invoices.filter((i) => i.created_by === createdBy), [invoices, createdBy]);
  const myGrns = useMemo(() => grns.filter((g) => g.created_by === createdBy), [grns, createdBy]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {displayName}</h1>
        <p className="text-muted-foreground mt-1">Overview of your procurement activity</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <StatsCard title="Requests" value={myRequests.length} icon={FileText} to="/requests" />
        <StatsCard title="Quotations" value={myQuotations.length} icon={FileSearch} to="/quotations" />
        <StatsCard title="Purchase Orders" value={myOrders.length} icon={ShoppingCart} to="/purchase-orders" />
        <StatsCard title="Invoices" value={myInvoices.length} icon={Receipt} to="/invoices" />
        <StatsCard title="Goods Received" value={myGrns.length} icon={PackageCheck} to="/goods-received" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Purchase Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {myOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No purchase orders yet</p>
            ) : (
              <div className="space-y-3">
                {myOrders.slice(0, 5).map((po) => (
                  <div
                    key={po.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2"
                    onClick={() => navigate("/purchase-orders")}
                  >
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
            <CardTitle className="text-lg">Recent Goods Received</CardTitle>
          </CardHeader>
          <CardContent>
            {myGrns.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No goods received yet</p>
            ) : (
              <div className="space-y-3">
                {myGrns.slice(0, 5).map((grn) => (
                  <div
                    key={grn.id}
                    className="flex items-center justify-between py-2 border-b last:border-0 gap-2 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2"
                    onClick={() => navigate("/goods-received")}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{grn.grn_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{grn.vendor_name}</p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={grn.status} />
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
