import { z } from "zod";

// Sanitize text to prevent injection patterns
const sanitize = (val: string) =>
  val
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/%[0-9a-fA-F]{2}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const safeText = (max: number) =>
  z.string().trim().max(max).transform(sanitize);

const safeTextRequired = (max: number) =>
  z.string().trim().min(1, "Required").max(max).transform(sanitize);

const vendorName = safeTextRequired(200).refine((v) => v !== "-", { message: "Please select a company" });

const positiveAmount = z
  .number({ coerce: true })
  .min(0, "Must be non-negative")
  .max(999_999_999, "Amount too large");

const optionalDate = z.string().optional().or(z.literal(""));

export const requestSchema = z.object({
  title: safeTextRequired(200),
  requester_name: safeTextRequired(100),
  department: safeText(100).optional(),
  currency: z.enum(["HKD", "USD", "CNY"]).default("HKD"),
  description: safeText(2000).optional(),
  remarks: safeText(2000).optional(),
});

export const quotationSchema = z.object({
  title: safeText(200).optional(),
  vendor_name: vendorName,
  total_amount: positiveAmount.default(0),
  currency: z.enum(["HKD", "USD", "CNY"]).default("HKD"),
  valid_until: optionalDate,
  notes: safeText(2000).optional(),
  remarks: safeText(2000).optional(),
});

export const purchaseOrderSchema = z.object({
  vendor_name: vendorName,
  total_amount: positiveAmount.default(0),
  currency: z.enum(["HKD", "USD", "CNY"]).default("HKD"),
  order_date: optionalDate,
  expected_delivery: optionalDate,
  delivery_location: safeText(500).optional(),
  goods_description: safeText(2000).optional(),
  notes: safeText(2000).optional(),
  remarks: safeText(2000).optional(),
  quotation_id: z.string().uuid().optional().or(z.literal("")),
});

export const invoiceSchema = z.object({
  vendor_name: vendorName,
  total_amount: positiveAmount.default(0),
  currency: z.enum(["HKD", "USD", "CNY"]).default("HKD"),
  invoice_date: optionalDate,
  due_date: optionalDate,
  notes: safeText(2000).optional(),
  remarks: safeText(2000).optional(),
  po_id: z.string().uuid().optional().or(z.literal("")),
});

export const goodsReceivedSchema = z.object({
  vendor_name: vendorName,
  total_amount: positiveAmount.default(0),
  currency: z.enum(["HKD", "USD", "CNY"]).default("HKD"),
  received_date: optionalDate,
  received_by: safeText(100).optional(),
  notes: safeText(2000).optional(),
  remarks: safeText(2000).optional(),
  po_id: z.string().uuid().optional().or(z.literal("")),
});

export const extractFormData = (form: HTMLFormElement) => {
  const fd = new FormData(form);
  const obj: Record<string, any> = {};
  fd.forEach((val, key) => {
    const strVal = val as string;
    obj[key] = strVal;
  });
  return obj;
};
