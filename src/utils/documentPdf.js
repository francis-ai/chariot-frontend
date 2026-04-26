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
  const vatAmount = hasVatAmount ? vatAmountInput : (hasTaxAmount ? taxAmountInput : computedVatAmount);

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

const parseWaybillProductList = (productList) => {
  const raw = String(productList || "").trim();
  if (!raw) return { productText: "", totalQuantity: 0 };

  const items = raw
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean);

  const parsedItems = items.map((item) => {
    const qtyMatch = item.match(/^(.*?)\s*\(Qty:\s*([0-9]+)\)\s*$/i)
      || item.match(/^(.*?)\s*\(x\s*([0-9]+)\)\s*$/i)
      || item.match(/^(.*?)\s*-\s*qty\s*[:]?\s*([0-9]+)\s*$/i);

    if (qtyMatch) {
      return { name: String(qtyMatch[1]).trim(), qty: Number(qtyMatch[2]) };
    }

    return { name: item, qty: 0 };
  });

  const productText = parsedItems.map((item) => item.name).filter(Boolean).join(", ");
  const totalQuantity = parsedItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

  return { productText: productText || raw, totalQuantity };
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
  const pageHeight = doc.internal.pageSize.getHeight();
  const fixedTopY = pageHeight - 52;
  let cursorY = typeof startY === "number" ? startY : fixedTopY;

  // Place signature immediately after the current section when space allows,
  // otherwise render near the bottom or on a new page.
  if (cursorY > fixedTopY - 20) {
    doc.addPage();
    cursorY = fixedTopY;
  }

  const sources = [signatureImage, "/IMG_7880.jpeg", "/signature.jpg"].filter(Boolean);

  for (const src of sources) {
    try {
      const image = await loadImage(src);
      const format = src.toLowerCase().includes("png") ? "PNG" : "JPEG";
      doc.addImage(image, format, 14, cursorY, 38, 14);
      cursorY += 16;
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
    const wrapped = doc.splitTextToSize(line, 60); // Limit width to prevent overflow
    doc.text(wrapped, 126, metaY);
    metaY += wrapped.length * 5;
  });

  return Math.max(cursorY + 22, metaY + 2);
};

export const downloadInvoicePdf = async (invoice) => {
  const doc = new jsPDF();
  const currency = invoice.currency || "NGN";
  const formatMoney = (value) => `${currency}${formatNumber(value)}`;
  const invoiceItems = Array.isArray(invoice.items)
    ? invoice.items
    : (() => {
        if (typeof invoice.items_json === "string" && invoice.items_json.trim()) {
          try {
            const parsed = JSON.parse(invoice.items_json);
            return Array.isArray(parsed) ? parsed : [];
          } catch (error) {
            return [];
          }
        }
        return [];
      })();

  const normalizedItems = invoiceItems.length
    ? invoiceItems
        .map((row) => ({
          item_code: row.item_code || row.code || row.sku || "",
          item: row.name || row.item || row.product_name || "",
          description: row.description || "",
          quantity: getNumeric(row.quantity || row.qty || 0),
          price: getNumeric(row.price || 0),
        }))
        .filter((row) => row.item && row.quantity > 0)
    : [
        {
          item_code: invoice.item_code || "",
          item: invoice.item || "",
          description: invoice.description || "",
          quantity: getNumeric(invoice.quantity),
          price: getNumeric(invoice.price),
        },
      ].filter((row) => row.item && row.quantity > 0);

  const discountRate = Math.max(0, Math.min(100, getNumeric(invoice.discount)));
  const subtotalBeforeDiscount = normalizedItems.reduce(
    (sum, row) => sum + row.quantity * row.price,
    0
  );
  const discountAmount = (subtotalBeforeDiscount * discountRate) / 100;
  const subtotal = Math.max(0, subtotalBeforeDiscount - discountAmount);
  const tax = resolveTaxVat(invoice, subtotal);
  const vatAmountValue = tax.vatAmount || tax.taxAmount || 0;
  const grandTotal = subtotal + vatAmountValue;

  const headerEndY = await addCompanyHeader(doc, "INVOICE", "Invoice No", invoice.invoice_number || invoice.id, [
    `Customer: ${invoice.customer || ""}`,
    `Invoice Date: ${invoice.invoice_date || ""}`,
    `Due Date: ${invoice.due_date || ""}`,
  ]);

  autoTable(doc, {
    startY: headerEndY,
    head: [["Item Code", "Item", "Description", "Qty", "Unit Price", "Total"]],
    body: normalizedItems.map((row) => [row.item_code || "", row.item, row.description, row.quantity, formatMoney(row.price), formatMoney(row.quantity * row.price)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 41, 59] },
  });

  const finalY = doc.lastAutoTable?.finalY || 90;
  const summaryEndY = drawSummaryOnRight({
    doc,
    finalY,
    lines: [
      { label: "Subtotal", value: formatMoney(tax.subtotal) },
      { label: "DISCOUNT", value: formatMoney(discountAmount) },
      { label: "VAT", value: formatMoney(vatAmountValue) },
      { label: "Total", value: formatMoney(grandTotal) },
      { label: "Status", value: invoice.status || "Unpaid" },
    ],
  });

  doc.setFont("helvetica", "bold");
  doc.text(`${currency} ${amountToWords(grandTotal)} Only`, 14, summaryEndY + 8);
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
  const currency = quotation.currency || "NGN";
  const formatMoney = (value) => `${currency}${formatNumber(value)}`;
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
    head: [["No.", "Item Code", "Description", "Qty", "Unit Price", "Total"]],
    body: items.length
      ? items.map((row, index) => {
          const qty = Number(row.quantity || row.qty || 0);
          const price = Number(row.price || 0);
          return [
            index + 1,
            row.item_code || row.code || "",
            row.description || row.name || row.item || "",
            qty,
            formatMoney(price),
            formatMoney(qty * price),
          ];
        })
      : [[1, "", quotation.notes || "Quotation summary", 1, formatMoney(quotation.subtotal || quotation.amount || 0), formatMoney(quotation.amount || 0)]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [225, 225, 225], textColor: 30 },
  });

  const finalY = doc.lastAutoTable?.finalY || 90;
  const summaryEndY = drawSummaryOnRight({
    doc,
    finalY,
    lines: [
      { label: "Grand Total", value: `${formatNumber(tax.subtotal)} ${currency}` },
      { label: `VAT(${tax.vatRate.toFixed(1)}%)`, value: `${formatNumber(tax.vatAmount)} ${currency}` },
      { label: "Net Total", value: `${formatNumber(total)} ${currency}` },
    ],
  });

  doc.setFont("helvetica", "bold");
  doc.text(`${currency} ${amountToWords(total)} Only`, 14, summaryEndY + 8);
  doc.setFont("helvetica", "normal");

  if (quotation.terms) {
    const wrapped = doc.splitTextToSize(`Terms & Conditions: ${quotation.terms}`, 180);
    doc.text(wrapped, 14, summaryEndY + 20);
  }

  await drawManagerBlock({
    doc,
    startY: summaryEndY + 18,
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

  const deliveredByName = waybill.driver || waybill.delivered_by || "";
  const modeOfDelivery = waybill.vehicle || waybill.mode_of_delivery || "";
  const { productText, totalQuantity } = parseWaybillProductList(waybill.product_list || waybill.items || "");

  autoTable(doc, {
    startY: headerEndY,
    head: [["Pickup Location", "Delivery Location", "Delivered By", "Mode of Delivery", "Item(s)", "Qty"]],
    body: [[
      waybill.pickup_location || "",
      waybill.delivery_location || "",
      deliveredByName,
      modeOfDelivery,
      productText || "-",
      totalQuantity > 0 ? String(totalQuantity) : (waybill.qty !== undefined ? String(waybill.qty) : ""),
    ]],
    styles: { fontSize: 9, cellPadding: 2.5, valign: "top" },
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 28 },
      2: { cellWidth: 24 },
      3: { cellWidth: 24 },
      4: { cellWidth: 50 },
      5: { cellWidth: 20 },
    },
  });

  const finalY = doc.lastAutoTable?.finalY || 100;

  if (waybill.notes) {
    const wrapped = doc.splitTextToSize(`Notes: ${waybill.notes}`, 180);
    doc.text(wrapped, 14, finalY + 28);
  }

  await drawManagerBlock({
    doc,
    startY: finalY + 30,
    signatureImage: waybill.signature_image,
  });

  doc.save(`waybill-${waybill.waybill_number || waybill.id}.pdf`);
};

export const downloadPurchaseOrderPdf = async (purchaseOrder) => {
  const doc = new jsPDF();
  const orderDate = purchaseOrder.order_date || purchaseOrder.date || "";
  const deliveryDate = purchaseOrder.delivery_date || purchaseOrder.secondaryDate || "";
  const supplierName = purchaseOrder.supplier_name || purchaseOrder.entity || "";

  const normalizedItems = Array.isArray(purchaseOrder.items) && purchaseOrder.items.length
    ? purchaseOrder.items.map((item) => ({
      description: item.description || item.item || item.name || "",
      quantity: Math.max(1, getNumeric(item.quantity || item.qty || 1)),
      rate: getNumeric(item.rate || item.price || 0),
    }))
    : [{
      description: purchaseOrder.item || "",
      quantity: Math.max(1, getNumeric(purchaseOrder.quantity || 1)),
      rate: getNumeric(purchaseOrder.total_amount || purchaseOrder.amount || parseAmountText(purchaseOrder.amount)),
    }];

  const itemRows = normalizedItems.map((item) => {
    const amount = item.quantity * item.rate;
    return [item.description, String(item.quantity), formatNumber(item.rate), formatNumber(amount)];
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxRate = getNumeric(purchaseOrder.tax_rate || purchaseOrder.vat_rate || 10);
  const taxAmount = getNumeric(purchaseOrder.tax_amount || (subtotal * taxRate) / 100);
  const total = getNumeric(purchaseOrder.total_amount || subtotal + taxAmount);

  const headerEndY = await addCompanyHeader(
    doc,
    "PURCHASE ORDER",
    "PO Ref. No",
    purchaseOrder.po_number || purchaseOrder.id || "",
    [
      `Vendor: ${supplierName}`,
      `Order Date: ${orderDate}`,
      `Delivery Date: ${deliveryDate}`,
    ]
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Vendor Address:", 14, headerEndY + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const vendorLines = doc.splitTextToSize(`${supplierName}\n${purchaseOrder.address || ""}`, 84);
  doc.text(vendorLines, 14, headerEndY + 11);

  autoTable(doc, {
    startY: headerEndY + 26,
    head: [["Item Description", "Qty", "Rate", "Amount"]],
    body: itemRows,
    theme: "plain",
    styles: {
      fontSize: 10,
      cellPadding: 3,
      textColor: [75, 75, 75],
    },
    headStyles: {
      fillColor: [102, 102, 102],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 11,
    },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
    },
  });

  const tableBottomY = doc.lastAutoTable?.finalY || 110;
  const summaryStartY = Math.max(tableBottomY + 12, 132);
  const summaryX = 134;
  const summaryWidth = 60;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Sub Total", summaryX, summaryStartY);
  doc.text(formatNumber(subtotal), 194, summaryStartY, { align: "right" });
  doc.text(`Purchase Tax (${taxRate.toFixed(2)}%)`, summaryX, summaryStartY + 8);
  doc.text(formatNumber(taxAmount), 194, summaryStartY + 8, { align: "right" });

  doc.setFillColor(225, 225, 225);
  doc.rect(summaryX - 6, summaryStartY + 14, summaryWidth, 12, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("TOTAL", summaryX - 2, summaryStartY + 22);
  doc.text(formatNumber(total), 194, summaryStartY + 22, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  const wordsY = summaryStartY + 42;
  doc.text(`NGN ${amountToWords(total)} Only`, 14, wordsY);

  const notesStartY = wordsY + 8;
  if (purchaseOrder.notes) {
    const wrappedNotes = doc.splitTextToSize(`Notes: ${purchaseOrder.notes}`, 180);
    doc.text(wrappedNotes, 14, notesStartY);
  }

  await drawManagerBlock({
    doc,
    startY: notesStartY + 10,
    signatureImage: purchaseOrder.signature_image,
  });

  doc.save(`purchase-order-${purchaseOrder.po_number || purchaseOrder.id}.pdf`);
};
