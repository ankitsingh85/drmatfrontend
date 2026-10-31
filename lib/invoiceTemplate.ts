// Shared "Tax Invoice" HTML builder — the single format used everywhere an
// invoice can be downloaded: user product/treatment/consultation orders,
// B2B orders, clinic orders, doctor orders, clinic subscription purchases,
// and the admin Transactions list. Keeping one builder means every surface
// renders byte-for-byte the same layout instead of N copy-pasted versions
// silently drifting apart.

export interface InvoiceParty {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface InvoiceLineItem {
  name: string;
  meta?: string;
  unitPrice: number;
  quantity: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNo: string;
  orderNo: string;
  invoiceDate: string;
  orderDate: string;
  docSubtitle: string;
  orderTypeLabel: string;
  paymentStatus: string;
  paymentMethod: string;
  soldBy?: InvoiceParty;
  billTo: InvoiceParty;
  shipTo?: InvoiceParty;
  items: InvoiceLineItem[];
  discount?: number;
  total: number;
  footerNote?: string;
  logoUrl?: string;
}

const formatMoney = (value: number) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const escapeHtml = (value: string) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const buildInvoiceHtml = (data: InvoiceData): string => {
  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
  const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const shipTo = data.shipTo || data.billTo;
  const soldBy = data.soldBy || {
    name: "Dr. Dermat Healthcare Marketplace",
    address: "India",
  };

  const itemsRows = data.items
    .map(
      (item, index) => `
        <tr>
          <td class="sl">${index + 1}</td>
          <td class="desc">
            <div class="itemName">${escapeHtml(item.name)}</div>
            <div class="itemMeta">Qty: ${item.quantity}</div>
            ${item.meta ? `<div class="itemMeta">${escapeHtml(item.meta)}</div>` : ""}
          </td>
          <td class="num">${formatMoney(item.unitPrice)}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${formatMoney(item.amount)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <html>
      <head>
        <title>Invoice ${escapeHtml(data.invoiceNo)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 22px;
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
            background: #fff;
          }
          .invoice {
            max-width: 980px;
            margin: 0 auto;
            border: 1px solid #cfd7e3;
            position: relative;
          }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            align-items: flex-start;
            padding: 18px 20px 12px;
            border-bottom: 2px solid #111827;
          }
          .brand { display: flex; align-items: center; gap: 14px; }
          .brand img { width: 88px; height: 88px; object-fit: contain; }
          .brandName { font-size: 34px; font-weight: 800; line-height: 1; letter-spacing: -0.04em; }
          .brandSub { margin-top: 4px; font-size: 12px; color: #52606d; }
          .docTitle { text-align: right; }
          .docTitle h1 { margin: 0; font-size: 22px; line-height: 1.15; }
          .docTitle p { margin: 2px 0 0; font-size: 12px; color: #52606d; }
          .invoiceNoBadge {
            display: inline-block;
            margin-top: 8px;
            padding: 6px 12px;
            border: 1px solid #111827;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
          }
          .meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            padding: 16px 20px;
            border-bottom: 1px solid #cfd7e3;
          }
          .block { font-size: 12px; line-height: 1.5; }
          .block h3 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; }
          .muted { color: #52606d; }
          .orderMeta {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 10px;
            padding: 14px 20px;
            border-bottom: 1px solid #cfd7e3;
            font-size: 12px;
          }
          .orderMeta div { min-width: 0; }
          .orderMeta span {
            display: block;
            color: #52606d;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 10px;
            margin-bottom: 4px;
          }
          .orderMeta strong { display: block; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          thead th {
            background: #f3f4f6;
            padding: 10px 8px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            border-bottom: 1px solid #cfd7e3;
            text-align: left;
          }
          tbody td { border-bottom: 1px solid #e5e7eb; padding: 12px 8px; font-size: 12px; vertical-align: top; }
          .sl { width: 42px; text-align: center; }
          .desc { width: 50%; }
          .num { text-align: right; white-space: nowrap; }
          .itemName { font-weight: 700; color: #111827; }
          .itemMeta { margin-top: 4px; color: #52606d; font-size: 11px; }
          .summaryWrap { display: flex; justify-content: flex-end; padding: 16px 20px 20px; }
          .summary { width: 320px; border: 1px solid #cfd7e3; background: #fafafa; }
          .summaryRow {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
          }
          .summaryRow:last-child { border-bottom: 0; }
          .summaryRow.total { font-size: 14px; font-weight: 800; background: #fff; }
          .footer {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 16px;
            align-items: end;
            padding: 0 20px 18px;
          }
          .note { font-size: 11px; color: #52606d; line-height: 1.55; }
          .sign { width: 210px; text-align: center; font-size: 12px; }
          .signBox { height: 48px; border: 1px solid #9ca3af; margin-bottom: 6px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div class="brand">
              ${data.logoUrl ? `<img src="${escapeHtml(data.logoUrl)}" alt="Dr. Dermat" />` : ""}
              <div>
                <div class="brandName">Dr. Dermat</div>
                <div class="brandSub">${escapeHtml(data.docSubtitle)}</div>
              </div>
            </div>
            <div class="docTitle">
              <h1>Tax Invoice / Bill of Supply / Cash Memo</h1>
              <p>(Original for Recipient)</p>
              <div class="invoiceNoBadge">Invoice Number # ${escapeHtml(data.invoiceNo)}</div>
            </div>
          </div>

          <div class="meta">
            <div class="block">
              <h3>Sold By</h3>
              <div>${escapeHtml(soldBy.name)}</div>
              ${soldBy.address ? `<div class="muted">${escapeHtml(soldBy.address)}</div>` : ""}
              <div class="muted">Order support and fulfillment</div>
            </div>
            <div class="block" style="text-align:right;">
              <h3>Billing Address</h3>
              <div>${escapeHtml(data.billTo.name)}</div>
              ${data.billTo.email ? `<div class="muted">${escapeHtml(data.billTo.email)}</div>` : ""}
              ${data.billTo.phone ? `<div class="muted">${escapeHtml(data.billTo.phone)}</div>` : ""}
              ${data.billTo.address ? `<div class="muted">${escapeHtml(data.billTo.address)}</div>` : ""}
            </div>
            <div class="block">
              <h3>Shipping Address</h3>
              <div>${escapeHtml(shipTo.name)}</div>
              ${shipTo.address ? `<div class="muted">${escapeHtml(shipTo.address)}</div>` : ""}
            </div>
            <div class="block" style="text-align:right;">
              <h3>Invoice Details</h3>
              <div><strong>Invoice No:</strong> ${escapeHtml(data.invoiceNo)}</div>
              <div><strong>Order No:</strong> ${escapeHtml(data.orderNo)}</div>
              <div><strong>Invoice Date:</strong> ${escapeHtml(data.invoiceDate)}</div>
              <div><strong>Order Date:</strong> ${escapeHtml(data.orderDate)}</div>
            </div>
          </div>

          <div class="orderMeta">
            <div>
              <span>Payment Status</span>
              <strong>${escapeHtml(data.paymentStatus)}</strong>
            </div>
            <div>
              <span>Order Type</span>
              <strong>${escapeHtml(data.orderTypeLabel)}</strong>
            </div>
            <div>
              <span>Items</span>
              <strong>${totalItems}</strong>
            </div>
            <div>
              <span>Payment Method</span>
              <strong>${escapeHtml(data.paymentMethod)}</strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="sl">#</th>
                <th>Description</th>
                <th class="num">Unit Price</th>
                <th class="num">Qty</th>
                <th class="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="summaryWrap">
            <div class="summary">
              <div class="summaryRow">
                <span>Subtotal</span>
                <strong>${formatMoney(subtotal)}</strong>
              </div>
              ${
                data.discount
                  ? `<div class="summaryRow"><span>Discount</span><strong>-${formatMoney(
                      data.discount
                    )}</strong></div>`
                  : ""
              }
              <div class="summaryRow total">
                <span>Total</span>
                <strong>${formatMoney(data.total)}</strong>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="note">
              ${escapeHtml(
                data.footerNote ||
                  "This invoice is generated for your records. Please keep this copy for future reference."
              )}
            </div>
            <div class="sign">
              <div class="signBox"></div>
              <div>Authorized Signatory</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const formatInvoiceDate = (value: string | Date) =>
  new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/** Opens a new tab, writes the invoice HTML into it, and triggers the
 * browser print dialog — the user picks "Save as PDF" to download it.
 * Returns false (and leaves the caller to show its own error toast) if the
 * popup was blocked. */
export const printInvoice = (data: InvoiceData): boolean => {
  if (typeof window === "undefined") return false;
  const printable = window.open("", "_blank", "width=900,height=700");
  if (!printable) return false;

  printable.document.write(buildInvoiceHtml(data));
  printable.document.close();
  printable.focus();
  printable.print();
  return true;
};
