import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COMPANY_NAME = "CHARIOT LINK TECH. & IND. PRODUCTS LTD.";
const HEAD_OFFICE_LINES = [
  "30, Osolo Way Opp. Wakanow, Off",
  "Airport Road by 7/8 bus stop, Ajao Estate, Lagos, Nigeria.",
];
const BRANCH_OFFICE_LINES = [
  "14, Sofuye Street, Opposite Shark Filling",
  "Station, Ilasmaja, Lagos, Nigeria",
];
const CONTACT_LINES = [
  "Phone: +2348033039229, +2348184415556",
  "E-mail: info@chariotlink.com.ng,",
  "chariot_tech@yahoo.com",
];

const MANAGER_NAME = "CHINEDU O. ORJI";
const MANAGER_TITLE = "SALES DIRECTOR";

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

const NUMBER_WORDS = {
  ones: ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"],
  teens: ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"],
  tens: ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"],
};

const toWordsBelowThousand = (value) => {
  const amount = Math.floor(Number(value || 0));
  if (!amount) return "";

  const hundred = Math.floor(amount / 100);
  const rest = amount % 100;

  const hundredPart = hundred ? `${NUMBER_WORDS.ones[hundred]} Hundred` : "";

  let restPart = "";
  if (rest >= 10 && rest <= 19) {
    restPart = NUMBER_WORDS.teens[rest - 10];
  } else {
    const ten = Math.floor(rest / 10);
    const one = rest % 10;
    restPart = [NUMBER_WORDS.tens[ten], NUMBER_WORDS.ones[one]].filter(Boolean).join(" ");
  }

  return [hundredPart, restPart].filter(Boolean).join(" ").trim();
};

const amountToWords = (value) => {
  let amount = Math.floor(getNumeric(value));
  if (amount <= 0) return "Zero";

  const scales = [
    { name: "Billion", value: 1000000000 },
    { name: "Million", value: 1000000 },
    { name: "Thousand", value: 1000 },
    { name: "", value: 1 },
  ];

  const parts = [];

  scales.forEach((scale) => {
    if (amount >= scale.value) {
      const chunk = Math.floor(amount / scale.value);
      amount %= scale.value;
      const chunkText = toWordsBelowThousand(chunk);
      if (chunkText) {
        parts.push([chunkText, scale.name].filter(Boolean).join(" "));
      }
    }
  });

  return parts.join(" ").trim();
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const drawSummaryOnRight = ({ doc, finalY, lines }) => {
  let y = finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  lines.forEach((line) => {
    doc.text(`${line.label}: ${line.value}`, 194, y, { align: "right" });
    y += 6;
  });

  doc.setFont("helvetica", "normal");
  return y;
};

const drawManagerBlock = async ({ doc, startY, signatureImage }) => {
  let cursorY = startY;

  const sources = [signatureImage, "/signature.jpg"].filter(Boolean);

  for (const src of sources) {
    try {
      const image = await loadImage(src);
      const format = src.toLowerCase().includes("png") ? "PNG" : "JPEG";
      doc.addImage(image, format, 14, cursorY, 40, 16);
      cursorY += 18;
      break;
    } catch (error) {
      // Continue to fallback image source.
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(MANAGER_NAME, 14, cursorY + 4);
  doc.text(MANAGER_TITLE, 14, cursorY + 10);
  doc.setFont("helvetica", "normal");

  return cursorY + 14;
};

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
  doc.setFont("helvetica", "bold");
  doc.text("HEAD OFFICE:", 14, cursorY);
  cursorY += 4;
  doc.setFont("helvetica", "normal");
  HEAD_OFFICE_LINES.forEach((line) => {
    doc.text(line, 14, cursorY);
    cursorY += 4;
  });

  cursorY += 2;

  doc.setFont("helvetica", "bold");
  doc.text("BRANCH OFFICE:", 14, cursorY);
  cursorY += 4;
  doc.setFont("helvetica", "normal");
  BRANCH_OFFICE_LINES.forEach((line) => {
    doc.text(line, 14, cursorY);
    cursorY += 4;
  });

  CONTACT_LINES.forEach((line) => {
    doc.text(line, 14, cursorY);
    cursorY += 4;
  });

  doc.setDrawColor(30);
  doc.line(14, cursorY + 1, 196, cursorY + 1);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 14, cursorY + 10);
  doc.setFontSize(10);
  doc.text(`${numberLabel}: ${numberValue}`, 14, cursorY + 17);

  let metaY = cursorY + 10;
  metaLines.forEach((line) => {
    doc.setFont("helvetica", "normal");
    doc.text(line, 126, metaY);
    metaY += 5;
  });

  return cursorY + 22;
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

  const headerEndY = await addCompanyHeader(doc, "INVOICE", "Invoice No", invoice.invoice_number || invoice.id, [
    `Customer: ${invoice.customer || ""}`,
    `Invoice Date: ${invoice.invoice_date || ""}`,
    `Due Date: ${invoice.due_date || ""}`,
  ]);

  autoTable(doc, {
    startY: headerEndY,
    head: [["Item", "Description", "Qty", "Unit Price", "Total"]],
    body: items.map((row) => [row.item, row.description, row.quantity, money(row.price), money(row.total)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  const finalY = doc.lastAutoTable?.finalY || 90;
  const summaryEndY = drawSummaryOnRight({
    doc,
    finalY,
    lines: [
      { label: "Subtotal", value: money(tax.subtotal) },
      { label: "Discount", value: money(discount) },
      { label: `Tax (${tax.taxRate.toFixed(2)}%)`, value: money(tax.taxAmount) },
      { label: `VAT (${tax.vatRate.toFixed(2)}%)`, value: money(tax.vatAmount) },
      { label: "Total", value: money(grandTotal) },
      { label: "Status", value: invoice.status || "Unpaid" },
    ],
  });

  doc.setFont("helvetica", "bold");
  doc.text(`NGN ${amountToWords(grandTotal)} Only`, 14, summaryEndY + 8);
  doc.setFont("helvetica", "normal");

  await drawManagerBlock({
    doc,
    startY: summaryEndY + 16,
    signatureImage: invoice.signature_image,
  });

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

  const headerEndY = await addCompanyHeader(doc, "QUOTATION", "Quote Ref. No", quotation.quotation_number || quotation.id, [
    `Customer: ${quotation.customer || ""}`,
    `Date: ${quotation.quotation_date || ""}`,
    `Valid Until: ${quotation.valid_until || ""}`,
  ]);

  autoTable(doc, {
    startY: headerEndY,
    head: [["No.", "Item Code", "Description", "Qty", "Unit Price(NGN)", "Total(NGN)"]],
    body: items.length
      ? items.map((row, index) => {
          const qty = Number(row.quantity || row.qty || 0);
          const price = Number(row.price || 0);
          return [
            index + 1,
            row.item_code || row.code || "",
            row.description || row.name || row.item || "",
            qty,
            formatNumber(price),
            formatNumber(qty * price),
          ];
        })
      : [[1, "", quotation.notes || "Quotation summary", 1, formatNumber(quotation.subtotal || quotation.amount || 0), formatNumber(quotation.amount || 0)]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [225, 225, 225], textColor: 30 },
  });

  const finalY = doc.lastAutoTable?.finalY || 90;
  const summaryEndY = drawSummaryOnRight({
    doc,
    finalY,
    lines: [
      { label: "Grand Total", value: `${formatNumber(tax.subtotal)} ${NAIRA}` },
      { label: `VAT(${tax.vatRate.toFixed(1)}%)`, value: `${formatNumber(tax.vatAmount)} ${NAIRA}` },
      { label: "Net Total", value: `${formatNumber(total)} ${NAIRA}` },
    ],
  });

  doc.setFont("helvetica", "bold");
  doc.text(`NGN ${amountToWords(total)} Only`, 14, summaryEndY + 8);
  doc.setFont("helvetica", "normal");

  if (quotation.terms) {
    const wrapped = doc.splitTextToSize(`Terms & Conditions: ${quotation.terms}`, 180);
    doc.text(wrapped, 14, summaryEndY + 20);
  }

  await drawManagerBlock({
    doc,
    startY: summaryEndY + 40,
    signatureImage: quotation.signature_image,
  });

  doc.save(`quotation-${quotation.quotation_number || quotation.id}.pdf`);
};

export const downloadWaybillPdf = async (waybill) => {
  const doc = new jsPDF();
  const subtotal = getNumeric(waybill.subtotal || waybill.amount || waybill.total_amount || 0);
  const tax = resolveTaxVat(waybill, subtotal);
  const total = getNumeric(waybill.total_amount || waybill.amount || subtotal + tax.taxAmount + tax.vatAmount);

  const headerEndY = await addCompanyHeader(doc, "WAYBILL", "Waybill No", waybill.waybill_number || waybill.id, [
    `Customer: ${waybill.customer || ""}`,
    `Date: ${waybill.waybill_date || ""}`,
    `Status: ${waybill.status || "Pending"}`,
  ]);

  const products = String(waybill.product_list || "").trim();

  autoTable(doc, {
    startY: headerEndY,
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

  const finalY = doc.lastAutoTable?.finalY || 100;

  if (waybill.notes) {
    const wrapped = doc.splitTextToSize(`Notes: ${waybill.notes}`, 180);
    doc.text(wrapped, 14, finalY + 42);
  }

  await drawManagerBlock({
    doc,
    startY: finalY + 56,
    signatureImage: waybill.signature_image,
  });

  doc.save(`waybill-${waybill.waybill_number || waybill.id}.pdf`);
};

export const downloadPurchaseOrderPdf = async (purchaseOrder) => {
  const doc = new jsPDF();
  const subtotal = getNumeric(purchaseOrder.subtotal || purchaseOrder.total_amount || purchaseOrder.amount || parseAmountText(purchaseOrder.amount));
  const tax = resolveTaxVat(purchaseOrder, subtotal);
  const total = getNumeric(purchaseOrder.total_amount || purchaseOrder.amount || subtotal + tax.taxAmount + tax.vatAmount);

  const headerEndY = await addCompanyHeader(doc, "PURCHASE ORDER", "PO No", purchaseOrder.po_number || purchaseOrder.id, [
    `Supplier: ${purchaseOrder.supplier_name || purchaseOrder.entity || ""}`,
    `Order Date: ${purchaseOrder.order_date || purchaseOrder.date || ""}`,
    `Delivery Date: ${purchaseOrder.delivery_date || purchaseOrder.secondaryDate || ""}`,
  ]);

  autoTable(doc, {
    startY: headerEndY,
    head: [["Supplier", "Item", "Address", "Order Date", "Delivery Date", "Status", "Amount"]],
    body: [[
      purchaseOrder.supplier_name || purchaseOrder.entity || "",
      purchaseOrder.item || "",
      purchaseOrder.address || "",
      purchaseOrder.order_date || purchaseOrder.date || "",
      purchaseOrder.delivery_date || purchaseOrder.secondaryDate || "",
      purchaseOrder.status || "Pending",
      money(subtotal),
    ]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [8, 145, 178] },
  });

  const finalY = doc.lastAutoTable?.finalY || 95;
  const summaryEndY = drawSummaryOnRight({
    doc,
    finalY,
    lines: [
      { label: "Subtotal", value: money(tax.subtotal) },
      { label: `Tax (${tax.taxRate.toFixed(2)}%)`, value: money(tax.taxAmount) },
      { label: `VAT (${tax.vatRate.toFixed(2)}%)`, value: money(tax.vatAmount) },
      { label: "Total", value: money(total) },
    ],
  });

  doc.setFont("helvetica", "bold");
  doc.text(`NGN ${amountToWords(total)} Only`, 14, summaryEndY + 8);
  doc.setFont("helvetica", "normal");

  if (purchaseOrder.notes) {
    const wrapped = doc.splitTextToSize(`Notes: ${purchaseOrder.notes}`, 180);
    doc.text(wrapped, 14, summaryEndY + 20);
  }

  await drawManagerBlock({
    doc,
    startY: summaryEndY + 40,
    signatureImage: purchaseOrder.signature_image,
  });

  doc.save(`purchase-order-${purchaseOrder.po_number || purchaseOrder.id}.pdf`);
};
