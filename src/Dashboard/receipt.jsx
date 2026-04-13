import React from "react";

const Invoice = () => {
  const invoiceData = {
    invoiceNumber: "CLT-22022876",
    date: "1/14/2026",
    purchaserOrder: "4500012788",

    // 🔐 PAYMENT VALIDATION
    paymentStatus: "SUCCESSFUL", // change to "FAILED" if payment fails

    items: [
      {
        no: 0,
        code: "",
        description: "BELT S760MMX60MM PART NO:F5M12L06004",
        qty: 0,
        unitPrice: 0,
        total: 0,
      },
    ],
    totals: {
      grandTotal: 0,
      vat: 0,
      amountInWords: "0 NGN",
    },
  };

  const isPaid = invoiceData.paymentStatus === "SUCCESSFUL";

  return (
    <>
      {/* INVOICE */}
      <div className="invoice max-w-[850px] mx-auto p-10 bg-white text-[13px] text-gray-800 font-sans leading-tight shadow-lg my-6 border border-gray-200 print:shadow-none print:border-none print:my-0 print:p-0">

        {/* HEADER */}
        <div className="flex justify-between items-start mb-6">
          <div className="w-2/3">
            <h1 className="font-bold text-sm uppercase mb-1">
              CHARIOT LINK TECH. & IND. PRODUCTS LTD.
            </h1>
            <p className="font-bold">Head Office: 30, Osolo Way Opp. Wakanow, Off</p>
            <p className="font-bold">Airport Road by 7/8 bus stop, Ajao Estate, Lagos,</p>
            <p className="font-bold mb-4">Nigeria.</p>

            <p className="font-bold mt-4">
              Branch Office: 14, Sofuye Street, Opposite Shark Filling
            </p>
            <p className="font-bold">Station, Ilasmaja, Lagos, Nigeria</p>
            <p className="font-bold">Phone: +234803399228, +2348184415556</p>
            <p className="font-bold">E-mail: info@chariotlink.com.ng,</p>
            <p className="font-bold underline">chariot_tech@yahoo.com</p>
          </div>

          <img
            src="unnamed (1).jpg"
            alt="Company Logo"
            className="max-w-[140px] object-contain"
          />
        </div>

        {/* TITLE */}
        <h2 className="text-center font-bold text-base underline mb-3">
          INVOICE
        </h2>

        {/* PAYMENT STATUS */}
        <div className="flex justify-between items-center mb-4">
          <p className="font-bold">{invoiceData.invoiceNumber}</p>
          <span
            className={`px-4 py-1 rounded-full text-xs font-bold border ${
              isPaid
                ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                : "bg-rose-100 text-rose-700 border-rose-300"
            }`}
          >
            PAYMENT {invoiceData.paymentStatus}
          </span>
        </div>

        {/* META */}
        <div className="flex justify-between mb-2">
          <p className="font-bold">Invoice No: {invoiceData.invoiceNumber}</p>
          <p className="font-bold">Date: {invoiceData.date}</p>
        </div>

        {/* ADDRESS */}
        <div className="mb-6">
          <p className="font-bold">To,</p>
          <p className="font-bold">Prima Corporation Limited</p>
          <p className="font-bold">12, Akinwande Street, Off Badagry Expressway,</p>
          <p className="font-bold">Alaba Coker</p>
          <p className="font-bold">Lagos, Nigeria</p>
          <p className="text-[11px] mt-4 uppercase text-gray-600">
            PURCHASER ORDER NO. {invoiceData.purchaserOrder}
          </p>
        </div>

        {/* TABLE */}
        <table className="w-full border-collapse border border-gray-800">
          <thead>
            <tr>
              <th className="border border-gray-800 p-1 w-10">No.</th>
              <th className="border border-gray-800 p-1 w-24">Item Code</th>
              <th className="border border-gray-800 p-1">Description</th>
              <th className="border border-gray-800 p-1 w-12 text-center">Qty</th>
              <th className="border border-gray-800 p-1 w-28 text-right">
                Unit Price (NGN)
              </th>
              <th className="border border-gray-800 p-1 w-28 text-right">
                Total (NGN)
              </th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, idx) => (
              <tr key={idx} className="min-h-[100px]">
                <td className="border border-gray-800 p-1">{item.no}</td>
                <td className="border border-gray-800 p-1">{item.code}</td>
                <td className="border border-gray-800 p-1 font-bold">
                  {item.description}
                </td>
                <td className="border border-gray-800 p-1 text-center">
                  {item.qty}
                </td>
                <td className="border border-gray-800 p-1 text-right">
                  {item.unitPrice.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className="border border-gray-800 p-1 text-right">
                  {item.total.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            ))}

            <tr className="h-24">
              {Array.from({ length: 6 }).map((_, i) => (
                <td key={i} className="border border-gray-800"></td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* TOTALS */}
        <div className="flex justify-end">
          <div className="w-1/2">
            <div className="grid grid-cols-2 border-x border-b border-gray-800 p-1">
              <span className="font-bold text-right pr-4">Grand Total</span>
              <span className="font-bold text-right">
                {invoiceData.totals.grandTotal.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}{" "}
                NGN
              </span>
            </div>
            <div className="grid grid-cols-2 border-x border-b border-gray-800 p-1">
              <span className="font-bold text-right pr-4">VAT (7.5%)</span>
              <span className="font-bold text-right">
                {invoiceData.totals.vat.toLocaleString("en-NG", {
                  minimumFractionDigits: 2,
                })}{" "}
                NGN
              </span>
            </div>
          </div>
        </div>

        <div className="text-center mt-4 font-bold italic">
          {invoiceData.totals.amountInWords}
        </div>

        {/* SIGNATURE */}
        <div className="mt-16 w-48 border-t border-gray-800 pt-2">
          <img
            src="IMG_7880.jpeg"
            alt="Signature"
            className="w-full h-12 object-contain"
          />
          <p className="font-bold mt-2 uppercase">CHINEDU O. ORJI</p>
          <p className="font-bold uppercase">SALES DIRECTOR</p>
        </div>

        {/* FOOTER */}
        <div className="mt-20 pt-8 border-t border-gray-300">
          <div className="flex justify-between text-[10px] text-gray-500">
            <p>Copyright © CHARIOT LINK TECH. & IND. PRODUCTS LTD.</p>
            <p>Page 1 of 1</p>
          </div>
          <div className="text-center text-[10px] text-gray-400 italic mt-1">
            {isPaid ? "Payment Verified & Successful" : "Payment Failed / Pending"}
          </div>
        </div>
      </div>
    </>
  );
};

export default Invoice;
