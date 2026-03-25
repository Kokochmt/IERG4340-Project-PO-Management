import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type RecordStatus = Database["public"]["Enums"]["record_status"];

export const usePurchaseRequests = () =>
  useQuery({
    queryKey: ["purchase_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useQuotations = () =>
  useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const usePurchaseOrders = () =>
  useQuery({
    queryKey: ["purchase_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useInvoices = () =>
  useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

export const useGoodsReceived = () =>
  useQuery({
    queryKey: ["goods_received"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goods_received")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
