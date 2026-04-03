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

const money = (value) => `₦${Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  const items = [
    {
      item: invoice.item || "",
      description: invoice.description || "",
      quantity: Number(invoice.quantity || 0),
      price: Number(invoice.price || 0),
      total: Number(invoice.total || 0),
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
  doc.text(`Subtotal: ${money(invoice.quantity * invoice.price)}`, 14, finalY + 12);
  doc.text(`Discount: ${money(invoice.discount || 0)}`, 14, finalY + 18);
  doc.text(`Total: ${money(invoice.total)}`, 14, finalY + 24);
  doc.setFont("helvetica", "normal");
  doc.text(`Signature: ${invoice.signature_name || "________________"}`, 14, finalY + 40);

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
  doc.text(`Subtotal: ${money(quotation.subtotal || quotation.amount || 0)}`, 14, finalY + 12);
  doc.text(`VAT (${Number(quotation.vat_rate || 0).toFixed(2)}%): ${money(quotation.vat_amount || 0)}`, 14, finalY + 18);
  doc.text(`Total: ${money(quotation.amount || 0)}`, 14, finalY + 24);
  doc.setFont("helvetica", "normal");

  if (quotation.terms) {
    const wrapped = doc.splitTextToSize(`Terms & Conditions: ${quotation.terms}`, 180);
    doc.text(wrapped, 14, finalY + 38);
  }

  doc.text(`Signature: ${quotation.signature_name || "________________"}`, 14, finalY + 58);

  doc.save(`quotation-${quotation.quotation_number || quotation.id}.pdf`);
};
