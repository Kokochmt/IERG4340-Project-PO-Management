import { createClient } from "npm:@supabase/supabase-js@2.100.0";
import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const COMPANY_NAME = "Procurement Development Company";
const COMPANY_ADDRESS = "123 Business Street, City, Country";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, id } = await req.json();
    if (!type || !id) {
      return new Response(JSON.stringify({ error: "type and id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let pdfFilename = `${type}-${id}.pdf`;

    if (type === "po") {
      const { data: po, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !po) throw new Error("PO not found");

      pdfFilename = `${po.po_number}.pdf`;

      let quotation = null;
      if (po.quotation_id) {
        const { data } = await supabase.from("quotations").select("*").eq("id", po.quotation_id).single();
        quotation = data;
      }

      const page = pdfDoc.addPage([595, 842]);
      let y = 790;
      const left = 50;

      page.drawText("PURCHASE ORDER", { x: left, y, font: fontBold, size: 20, color: rgb(0.07, 0.47, 0.43) });
      const poNumText = `PO #: ${po.po_number}`;
      const poNumWidth = fontBold.widthOfTextAtSize(poNumText, 12);
      page.drawText(poNumText, { x: 545 - poNumWidth, y, font: fontBold, size: 12 });
      y -= 30;
      page.drawText(COMPANY_NAME, { x: left, y, font: fontBold, size: 12 });
      y -= 15;
      page.drawText(COMPANY_ADDRESS, { x: left, y, font, size: 9, color: rgb(0.4, 0.4, 0.4) });
      y -= 30;

      page.drawLine({ start: { x: left, y: y + 5 }, end: { x: 545, y: y + 5 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
      y -= 5;

      const addField = (label: string, value: string) => {
        page.drawText(label, { x: left, y, font: fontBold, size: 10 });
        page.drawText(value || "—", { x: 200, y, font, size: 10 });
        y -= 18;
      };

      if (po.title) addField("Title:", po.title);
      addField("Vendor:", po.vendor_name);
      addField("Amount:", `${po.currency || "HKD"} ${Number(po.total_amount || 0).toLocaleString()}`);
      addField("Order Date:", po.order_date || "—");
      addField("Expected Delivery:", po.expected_delivery || "—");
      const deliveryLoc = po.delivery_location || COMPANY_ADDRESS;
      addField("Delivery Location:", deliveryLoc);
      addField("Quantity:", po.quantity ? String(po.quantity) : "—");

      y -= 10;
      if (po.goods_description) {
        page.drawText("Goods Description:", { x: left, y, font: fontBold, size: 10 });
        y -= 16;
        const words = po.goods_description.split(" ");
        let line = "";
        for (const word of words) {
          if (font.widthOfTextAtSize(line + " " + word, 9) > 480) {
            page.drawText(line, { x: left, y, font, size: 9 });
            y -= 14;
            line = word;
          } else {
            line = line ? line + " " + word : word;
          }
        }
        if (line) { page.drawText(line, { x: left, y, font, size: 9 }); y -= 14; }
      }

      if (quotation) {
        y -= 15;
        page.drawLine({ start: { x: left, y: y + 5 }, end: { x: 545, y: y + 5 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
        y -= 5;
        page.drawText("Regarding to the following Quotation", { x: left, y, font: fontBold, size: 11, color: rgb(0.07, 0.47, 0.43) });
        y -= 18;
        addField("Quotation #:", quotation.quotation_number);
        if (quotation.title) addField("Title:", quotation.title);
        addField("Amount:", `${quotation.currency || "HKD"} ${Number(quotation.total_amount || 0).toLocaleString()}`);
        const qCreatedDate = quotation.created_at ? new Date(quotation.created_at).toLocaleDateString() : "—";
        addField("Date:", qCreatedDate);
      }

      if (po.remarks) {
        y -= 15;
        page.drawText("Remarks:", { x: left, y, font: fontBold, size: 10 });
        y -= 16;
        page.drawText(po.remarks.slice(0, 500), { x: left, y, font, size: 9 });
      }

    } else if (type === "grn") {
      const { data: grn, error } = await supabase
        .from("goods_received")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !grn) throw new Error("GRN not found");

      pdfFilename = `GRN${grn.grn_number}.pdf`;

      let po = null;
      let invoice = null;
      if (grn.po_id) {
        const { data } = await supabase.from("purchase_orders").select("*").eq("id", grn.po_id).single();
        po = data;
      }
      if (grn.invoice_id) {
        const { data } = await supabase.from("invoices").select("*").eq("id", grn.invoice_id).single();
        invoice = data;
      }

      const page = pdfDoc.addPage([595, 842]);
      let y = 790;
      const left = 50;

      page.drawText("GOODS RECEIVED NOTE", { x: left, y, font: fontBold, size: 20, color: rgb(0.07, 0.47, 0.43) });
      const grnNumText = `GRN #: ${grn.grn_number}`;
      const grnNumWidth = fontBold.widthOfTextAtSize(grnNumText, 12);
      page.drawText(grnNumText, { x: 545 - grnNumWidth, y, font: fontBold, size: 12 });
      y -= 30;
      page.drawText(COMPANY_NAME, { x: left, y, font: fontBold, size: 12 });
      y -= 15;
      page.drawText(COMPANY_ADDRESS, { x: left, y, font, size: 9, color: rgb(0.4, 0.4, 0.4) });
      y -= 30;

      page.drawLine({ start: { x: left, y: y + 5 }, end: { x: 545, y: y + 5 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
      y -= 5;

      const addField = (label: string, value: string) => {
        page.drawText(label, { x: left, y, font: fontBold, size: 10 });
        page.drawText(value || "—", { x: 200, y, font, size: 10 });
        y -= 18;
      };

      addField("Vendor:", grn.vendor_name);
      addField("Received Date:", grn.received_date || "—");
      addField("Received By:", grn.received_by || grn.created_by || "—");
      addField("Amount Received:", `${grn.currency || "HKD"} ${Number(grn.total_amount || 0).toLocaleString()}`);

      if (po) {
        y -= 15;
        page.drawLine({ start: { x: left, y: y + 5 }, end: { x: 545, y: y + 5 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
        y -= 5;
        page.drawText("Regarding to the following Purchase Order", { x: left, y, font: fontBold, size: 11, color: rgb(0.07, 0.47, 0.43) });
        y -= 18;
        addField("PO #:", po.po_number);
        if (po.title) addField("Title:", po.title);
        addField("Amount:", `${po.currency || "HKD"} ${Number(po.total_amount || 0).toLocaleString()}`);
        if (po.goods_description) addField("Goods:", po.goods_description);
      }

      if (invoice) {
        y -= 15;
        page.drawLine({ start: { x: left, y: y + 5 }, end: { x: 545, y: y + 5 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
        y -= 5;
        page.drawText("LINKED INVOICE", { x: left, y, font: fontBold, size: 11, color: rgb(0.07, 0.47, 0.43) });
        y -= 18;
        addField("Invoice #:", invoice.invoice_number);
        addField("Amount:", `${invoice.currency || "HKD"} ${Number(invoice.total_amount || 0).toLocaleString()}`);
      }

      if (grn.remarks) {
        y -= 15;
        page.drawText("Remarks:", { x: left, y, font: fontBold, size: 10 });
        y -= 16;
        page.drawText(grn.remarks.slice(0, 500), { x: left, y, font, size: 9 });
      }

    } else {
      return new Response(JSON.stringify({ error: "Invalid type. Use 'po' or 'grn'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pdfBytes = await pdfDoc.save();
    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFilename}"`,
      },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
