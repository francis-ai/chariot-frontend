import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COMPANY_NAME = "CHARIOT LINK TECH. & IND. PRODUCTS LTD.";
const COMPANY_LINES = [
  "Head Office: 30, Osolo Way Opp. Wakanow, Off",
  "Airport Road by 7/8 bus stop, Ajao Estate, Lagos, Nigeria.",
  "Branch Office: 14, Sofuye Street, Opposite Shark Filling Station, Ilasmaja, Lagos, Nigeria",
  "Phone: +234803399228, +2348184415556",
  "E-mail: info@chariotlink.com.ng, chariot_tech@yahoo.com",
];

const NAIRA = "NGN";

const formatNumber = (value) => {
  const numericValue = Number(value || 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const fixed = safeValue.toFixed(2);
  const [integerPart, decimalPart] = fixed.split(".");
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  // Keep integers clean as 112,000 (without trailing .00)
  return decimalPart === "00" ? groupedInteger : `${groupedInteger}.${decimalPart}`;
};

const money = (value) => `${NAIRA}${formatNumber(value)}`;

const getNumeric = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveTaxVat = (record = {}, subtotalInput = 0) => {
  const subtotal = Math.max(0, getNumeric(subtotalInput));
  const taxRate = getNumeric(record.tax_rate ?? record.vat_rate);
  const vatRate = getNumeric(record.vat_rate ?? record.tax_rate);

  const taxAmountInput = getNumeric(record.tax_amount);
  const vatAmountInput = getNumeric(record.vat_amount);

  const hasTaxAmount = taxAmountInput > 0;
  const hasVatAmount = vatAmountInput > 0;

  const computedTaxAmount = taxRate > 0 ? (subtotal * taxRate) / 100 : 0;
  const computedVatAmount = vatRate > 0 ? (subtotal * vatRate) / 100 : 0;

  const taxAmount = hasTaxAmount ? taxAmountInput : computedTaxAmount;
  const vatAmount = hasVatAmount ? vatAmountInput : computedVatAmount;

  return {
    subtotal,
    taxRate,
    taxAmount,
    vatRate,
    vatAmount,
  };
};

const parseAmountText = (value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d.-]/g, "");
  return getNumeric(normalized);
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const addCompanyHeader = async (doc, title, numberLabel, numberValue, metaLines = []) => {
  try {
    const logo = await loadImage("/logo.jpg");
    doc.addImage(logo, "JPEG", 162, 12, 28, 28);
  } catch (error) {
    // Logo is optional in case the asset is unavailable.
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(COMPANY_NAME, 14, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  let cursorY = 24;
  COMPANY_LINES.forEach((line) => {
    doc.text(line, 14, cursorY);
    cursorY += 4;
  });

  doc.setDrawColor(30);
  doc.line(14, 47, 196, 47);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 14, 56);
  doc.setFontSize(10);
  doc.text(`${numberLabel}: ${numberValue}`, 14, 63);

  let metaY = 56;
  metaLines.forEach((line) => {
    doc.setFont("helvetica", "normal");
    doc.text(line, 126, metaY);
    metaY += 5;
  });
};

export const downloadInvoicePdf = async (invoice) => {
  const doc = new jsPDF();
  const unitPrice = getNumeric(invoice.price);
  const quantity = getNumeric(invoice.quantity);
  const lineTotal = getNumeric(invoice.total || quantity * unitPrice);
  const discount = getNumeric(invoice.discount);
  const subtotal = Math.max(0, quantity * unitPrice - discount);
  const tax = resolveTaxVat(invoice, subtotal);
  const grandTotal = getNumeric(invoice.total || subtotal + tax.taxAmount + tax.vatAmount);

  const items = [
    {
      item: invoice.item || "",
      description: invoice.description || "",
      quantity,
      price: unitPrice,
      total: lineTotal,
    },
  ];

  await addCompanyHeader(doc, "INVOICE", "Invoice No", invoice.invoice_number || invoice.id, [
    `Customer: ${invoice.customer || ""}`,
    `Invoice Date: ${invoice.invoice_date || ""}`,
    `Due Date: ${invoice.due_date || ""}`,
  ]);

  autoTable(doc, {
    startY: 72,
    head: [["Item", "Description", "Qty", "Unit Price", "Total"]],
    body: items.map((row) => [row.item, row.description, row.quantity, money(row.price), money(row.total)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  const finalY = doc.lastAutoTable?.finalY || 90;
  doc.setFont("helvetica", "bold");
  doc.text(`Subtotal: ${money(tax.subtotal)}`, 14, finalY + 12);
  doc.text(`Discount: ${money(discount)}`, 14, finalY + 18);
  doc.text(`Tax (${tax.taxRate.toFixed(2)}%): ${money(tax.taxAmount)}`, 14, finalY + 24);
  doc.text(`VAT (${tax.vatRate.toFixed(2)}%): ${money(tax.vatAmount)}`, 14, finalY + 30);
  doc.text(`Total: ${money(grandTotal)}`, 14, finalY + 36);
  doc.text(`Status: ${invoice.status || "Unpaid"}`, 14, finalY + 42);
  doc.setFont("helvetica", "normal");

  let signatureY = finalY + 52;
  if (invoice.signature_image) {
    try {
      doc.addImage(invoice.signature_image, "PNG", 14, signatureY - 10, 40, 16);
      signatureY += 12;
    } catch (error) {
      // Keep PDF generation resilient if image format cannot be parsed.
    }
  }

  doc.text(`Signature: ${invoice.signature_name || "________________"}`, 14, signatureY);

  doc.save(`invoice-${invoice.invoice_number || invoice.id}.pdf`);
};

export const downloadQuotationPdf = async (quotation) => {
  const doc = new jsPDF();
  const items = Array.isArray(quotation.items)
    ? quotation.items
    : (() => {
        if (typeof quotation.items_json === "string" && quotation.items_json.trim()) {
          try {
            const parsed = JSON.parse(quotation.items_json);
            return Array.isArray(parsed) ? parsed : [];
          } catch (error) {
            return [];
          }
        }
        return [];
      })();

  const fallbackSubtotal = getNumeric(quotation.subtotal || quotation.amount);
  const tax = resolveTaxVat(quotation, fallbackSubtotal);
  const total = getNumeric(quotation.amount || tax.subtotal + tax.taxAmount + tax.vatAmount);

  await addCompanyHeader(doc, "QUOTATION", "Quotation No", quotation.quotation_number || quotation.id, [
    `Customer: ${quotation.customer || ""}`,
    `Quotation Date: ${quotation.quotation_date || ""}`,
    `Valid Until: ${quotation.valid_until || ""}`,
  ]);

  autoTable(doc, {
    startY: 72,
    head: [["Item", "Description", "Qty", "Unit Price", "Total"]],
    body: items.length
      ? items.map((row) => [row.name || row.item || "", row.description || "", row.quantity || row.qty || 0, money(row.price), money((row.quantity || row.qty || 0) * (row.price || 0))])
      : [[quotation.customer || "", quotation.notes || "Quotation summary", 1, money(quotation.subtotal || quotation.amount || 0), money(quotation.amount || 0)]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  const finalY = doc.lastAutoTable?.finalY || 90;
  doc.setFont("helvetica", "bold");
  doc.text(`Subtotal: ${money(tax.subtotal)}`, 14, finalY + 12);
  doc.text(`Tax (${tax.taxRate.toFixed(2)}%): ${money(tax.taxAmount)}`, 14, finalY + 18);
  doc.text(`VAT (${tax.vatRate.toFixed(2)}%): ${money(tax.vatAmount)}`, 14, finalY + 24);
  doc.text(`Total: ${money(total)}`, 14, finalY + 30);
  doc.setFont("helvetica", "normal");

  if (quotation.terms) {
    const wrapped = doc.splitTextToSize(`Terms & Conditions: ${quotation.terms}`, 180);
    doc.text(wrapped, 14, finalY + 44);
  }

  doc.text(`Signature: ${quotation.signature_name || "________________"}`, 14, finalY + 64);

  doc.save(`quotation-${quotation.quotation_number || quotation.id}.pdf`);
};

export const downloadWaybillPdf = async (waybill) => {
  const doc = new jsPDF();
  const subtotal = getNumeric(waybill.subtotal || waybill.amount || waybill.total_amount || 0);
  const tax = resolveTaxVat(waybill, subtotal);
  const total = getNumeric(waybill.total_amount || waybill.amount || subtotal + tax.taxAmount + tax.vatAmount);

  await addCompanyHeader(doc, "WAYBILL", "Waybill No", waybill.waybill_number || waybill.id, [
    `Customer: ${waybill.customer || ""}`,
    `Date: ${waybill.waybill_date || ""}`,
    `Status: ${waybill.status || "Pending"}`,
  ]);

  const products = String(waybill.product_list || "").trim();

  autoTable(doc, {
    startY: 72,
    head: [["Pickup", "Delivery", "Driver", "Vehicle", "Products Conveyed"]],
    body: [[
      waybill.pickup_location || "",
      waybill.delivery_location || "",
      waybill.driver || "",
      waybill.vehicle || "",
      products || "-",
    ]],
    styles: { fontSize: 9, cellPadding: 2.5, valign: "top" },
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 32 },
      2: { cellWidth: 26 },
      3: { cellWidth: 26 },
      4: { cellWidth: 66 },
    },
  });

  // const finalY = doc.lastAutoTable?.finalY || 100;
  // doc.setFont("helvetica", "bold");
  // doc.text(`Subtotal: ${money(tax.subtotal)}`, 14, finalY + 12);
  // doc.text(`Tax (${tax.taxRate.toFixed(2)}%): ${money(tax.taxAmount)}`, 14, finalY + 18);
  // doc.text(`VAT (${tax.vatRate.toFixed(2)}%): ${money(tax.vatAmount)}`, 14, finalY + 24);
  // doc.text(`Total: ${money(total)}`, 14, finalY + 30);
  // doc.setFont("helvetica", "normal");

  if (waybill.notes) {
    const wrapped = doc.splitTextToSize(`Notes: ${waybill.notes}`, 180);
    doc.text(wrapped, 14, finalY + 42);
  }

  doc.save(`waybill-${waybill.waybill_number || waybill.id}.pdf`);
};

export const downloadPurchaseOrderPdf = async (purchaseOrder) => {
  const doc = new jsPDF();
  const subtotal = getNumeric(purchaseOrder.subtotal || purchaseOrder.total_amount || purchaseOrder.amount || parseAmountText(purchaseOrder.amount));
  const tax = resolveTaxVat(purchaseOrder, subtotal);
  const total = getNumeric(purchaseOrder.total_amount || purchaseOrder.amount || subtotal + tax.taxAmount + tax.vatAmount);

  await addCompanyHeader(doc, "PURCHASE ORDER", "PO No", purchaseOrder.po_number || purchaseOrder.id, [
    `Supplier: ${purchaseOrder.supplier_name || purchaseOrder.entity || ""}`,
    `Order Date: ${purchaseOrder.order_date || purchaseOrder.date || ""}`,
    `Delivery Date: ${purchaseOrder.delivery_date || purchaseOrder.secondaryDate || ""}`,
  ]);

  autoTable(doc, {
    startY: 72,
    head: [["Supplier", "Order Date", "Delivery Date", "Status", "Amount"]],
    body: [[
      purchaseOrder.supplier_name || purchaseOrder.entity || "",
      purchaseOrder.order_date || purchaseOrder.date || "",
      purchaseOrder.delivery_date || purchaseOrder.secondaryDate || "",
      purchaseOrder.status || "Pending",
      money(subtotal),
    ]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [8, 145, 178] },
  });

  const finalY = doc.lastAutoTable?.finalY || 95;
  doc.setFont("helvetica", "bold");
  doc.text(`Subtotal: ${money(tax.subtotal)}`, 14, finalY + 12);
  doc.text(`Tax (${tax.taxRate.toFixed(2)}%): ${money(tax.taxAmount)}`, 14, finalY + 18);
  doc.text(`VAT (${tax.vatRate.toFixed(2)}%): ${money(tax.vatAmount)}`, 14, finalY + 24);
  doc.text(`Total: ${money(total)}`, 14, finalY + 30);
  doc.setFont("helvetica", "normal");

  if (purchaseOrder.notes) {
    const wrapped = doc.splitTextToSize(`Notes: ${purchaseOrder.notes}`, 180);
    doc.text(wrapped, 14, finalY + 42);
  }

  doc.save(`purchase-order-${purchaseOrder.po_number || purchaseOrder.id}.pdf`);
};
