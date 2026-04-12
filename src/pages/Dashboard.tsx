import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, FileSearch, ShoppingCart, Receipt, PackageCheck, Search, X } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const displayName = fullName || username || "User";
  const createdBy = fullName || username || "";

  const myRequests = useMemo(() => requests.filter((r) => r.created_by === createdBy), [requests, createdBy]);
  const myQuotations = useMemo(() => quotations.filter((q) => q.created_by === createdBy), [quotations, createdBy]);
  const myOrders = useMemo(() => orders.filter((o) => o.created_by === createdBy), [orders, createdBy]);
  const myInvoices = useMemo(() => invoices.filter((i) => i.created_by === createdBy), [invoices, createdBy]);
  const myGrns = useMemo(() => grns.filter((g) => g.created_by === createdBy), [grns, createdBy]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const term = search.toLowerCase();
    const results: { type: string; route: string; id: string; number: string; company: string }[] = [];

    requests.forEach((r) => {
      if (r.request_number?.toLowerCase().includes(term) || r.requester_name?.toLowerCase().includes(term))
        results.push({ type: "Request", route: "/requests", id: r.id, number: r.request_number, company: r.requester_name || "" });
    });
    quotations.forEach((q) => {
      if (q.quotation_number?.toLowerCase().includes(term) || q.vendor_name?.toLowerCase().includes(term))
        results.push({ type: "Quotation", route: "/quotations", id: q.id, number: q.quotation_number, company: q.vendor_name });
    });
    orders.forEach((o) => {
      if (o.po_number?.toLowerCase().includes(term) || o.vendor_name?.toLowerCase().includes(term))
        results.push({ type: "PO", route: "/purchase-orders", id: o.id, number: o.po_number, company: o.vendor_name });
    });
    invoices.forEach((i) => {
      if (i.invoice_number?.toLowerCase().includes(term) || i.vendor_name?.toLowerCase().includes(term))
        results.push({ type: "Invoice", route: "/invoices", id: i.id, number: i.invoice_number, company: i.vendor_name });
    });
    grns.forEach((g) => {
      if (g.grn_number?.toLowerCase().includes(term) || g.vendor_name?.toLowerCase().includes(term))
        results.push({ type: "GRN", route: "/goods-received", id: g.id, number: g.grn_number, company: g.vendor_name });
    });

    return results;
  }, [search, requests, quotations, orders, invoices, grns]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {displayName}</h1>
          <p className="text-muted-foreground mt-1">Overview of your procurement activity</p>
        </div>
        <div ref={searchRef} className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID or company name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            className="pl-9 pr-8"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
          {searchFocused && search.trim() && (
            <div className="absolute z-50 top-full mt-1 w-full bg-popover border rounded-lg shadow-lg">
              <ScrollArea className="max-h-72">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">No results found</p>
                ) : (
                  <div className="p-1">
                    {searchResults.map((r) => (
                      <div
                        key={`${r.type}-${r.id}`}
                        className="flex items-center justify-between px-3 py-2 rounded cursor-pointer hover:bg-muted text-sm"
                        onClick={() => { navigate(r.route); setSearch(""); setSearchFocused(false); }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">{r.type}</span>
                          <span className="font-medium truncate">{r.number}</span>
                        </div>
                        <span className="text-muted-foreground truncate ml-2">{r.company}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
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
                    onClick={() => navigate("/purchase-orders", { state: { openRecordId: po.id } })}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{po.po_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{po.vendor_name}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <span className="text-sm font-medium hidden sm:inline">
                        {po.currency || "HKD"} {Number(po.total_amount || 0).toLocaleString()}
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
                    onClick={() => navigate("/goods-received", { state: { openRecordId: grn.id } })}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{grn.grn_number}</p>
                      <p className="text-xs text-muted-foreground truncate">{grn.vendor_name}</p>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status="received" />
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
