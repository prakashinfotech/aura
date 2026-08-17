function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inr(n: number): string {
  return `&#8377;${n.toLocaleString("en-IN")}`;
}

export interface EmailOrderItem {
  name?: string;
  brand?: string;
  size?: string;
  color?: string;
  qty: number;
  mrp: number;
  price: number;
}

export interface EmailAddress {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface OrderConfirmationEmailData {
  orderId: string;
  customerName: string;
  orderDate: string;
  items: EmailOrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  address?: EmailAddress | null;
  appUrl: string;
}

export function buildOrderConfirmationEmail(data: OrderConfirmationEmailData): string {
  const {
    orderId,
    customerName,
    orderDate,
    items,
    subtotal,
    deliveryCharge,
    total,
    address,
    appUrl,
  } = data;

  const shortId = orderId.slice(0, 8).toUpperCase();

  const formattedOrderDate = new Date(orderDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const estDelivery = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ── Item rows ──────────────────────────────────────────────────────────────
  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align:top;">
                <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#999999;text-transform:uppercase;letter-spacing:0.5px;">${esc(item.brand)}</p>
                <p style="margin:0 0 5px;font-size:14px;font-weight:600;color:#282C3F;line-height:1.4;">${esc(item.name ?? "Product")}</p>
                <p style="margin:0;font-size:12px;color:#aaaaaa;">
                  ${item.size ? `Size: ${esc(item.size)}` : ""}${item.size ? " &middot; " : ""}Qty: ${item.qty}${item.color ? ` &middot; ${esc(item.color)}` : ""}
                </p>
              </td>
              <td style="vertical-align:top;text-align:right;padding-left:16px;white-space:nowrap;">
                <p style="margin:0;font-size:15px;font-weight:700;color:#282C3F;">${inr(item.price * item.qty)}</p>
                ${
                  item.price < item.mrp
                    ? `<p style="margin:4px 0 0;font-size:12px;color:#cccccc;text-decoration:line-through;">${inr(item.mrp * item.qty)}</p>
                       <p style="margin:2px 0 0;font-size:11px;font-weight:600;color:#27ae60;">${Math.round((1 - item.price / item.mrp) * 100)}% off</p>`
                    : ""
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  // ── Price summary ──────────────────────────────────────────────────────────
  const priceRows = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#666666;">Subtotal</td>
        <td style="padding:6px 0;font-size:14px;color:#282C3F;text-align:right;">${inr(subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#666666;">Delivery</td>
        <td style="padding:6px 0;font-size:14px;text-align:right;${deliveryCharge === 0 ? "color:#27ae60;font-weight:600;" : "color:#282C3F;"}">${
          deliveryCharge === 0 ? "FREE" : inr(deliveryCharge)
        }</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:4px 0;">
          <hr style="border:none;border-top:1px dashed #eeeeee;margin:0;">
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:#282C3F;">Total Paid</td>
        <td style="padding:8px 0 0;font-size:18px;font-weight:800;color:#FF3F6C;text-align:right;">${inr(total)}</td>
      </tr>
    </table>`;

  // ── Delivery address ────────────────────────────────────────────────────────
  const addressSection = address
    ? `
    <tr>
      <td style="padding:0 32px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="background:#fafafa;border-radius:10px;border:1px solid #f0f0f0;padding:18px 20px;">
          <tr>
            <td>
              <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#282C3F;text-transform:uppercase;letter-spacing:0.8px;">
                &#128230; Delivery Address
              </p>
              <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#282C3F;">${esc(address.name)}</p>
              <p style="margin:0;font-size:13px;color:#666666;line-height:1.7;">
                ${esc(address.line1)}${address.line2 ? `, ${esc(address.line2)}` : ""}<br>
                ${esc(address.city)}, ${esc(address.state)} &ndash; ${esc(address.pincode)}<br>
                &#128222; ${esc(address.phone)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    : "";

  // ── Full email ─────────────────────────────────────────────────────────────
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Order Confirmed &#8211; Aura</title>
</head>
<body style="margin:0;padding:0;background-color:#f2f2f2;-webkit-font-smoothing:antialiased;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#f2f2f2;padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- Outer card -->
        <table cellpadding="0" cellspacing="0" border="0"
          style="width:100%;max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;
                 box-shadow:0 2px 20px rgba(0,0,0,0.08);">

          <!-- ── Brand header ── -->
          <tr>
            <td style="background:#282C3F;padding:22px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <span style="font-size:28px;font-weight:900;color:#6366f1;
                                 font-family:Georgia,serif;letter-spacing:-1px;">aura</span>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="font-size:11px;color:#7a8a9a;letter-spacing:1px;
                                 text-transform:uppercase;font-weight:600;">Order Confirmation</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Hero ── -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#818cf8 100%);
                       padding:40px 32px;text-align:center;">
              <p style="margin:0 0 12px;font-size:48px;line-height:1;">&#127881;</p>
              <h1 style="margin:0 0 10px;font-size:30px;font-weight:800;color:#ffffff;
                         letter-spacing:-0.5px;line-height:1.2;">Your order is confirmed!</h1>
              <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.88);line-height:1.5;">
                Hi <strong>${esc(customerName)}</strong>, thanks for shopping with us.<br>
                We&#39;re preparing your order right now.
              </p>
            </td>
          </tr>

          <!-- ── Order meta strip ── -->
          <tr>
            <td style="background:#fff8f9;border-bottom:1px solid #ffe0e8;padding:18px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width:34%;vertical-align:top;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#bbbbbb;
                               text-transform:uppercase;letter-spacing:1px;">Order ID</p>
                    <p style="margin:0;font-size:16px;font-weight:800;color:#282C3F;
                               font-family:'Courier New',monospace;">#${shortId}</p>
                  </td>
                  <td style="width:33%;vertical-align:top;text-align:center;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#bbbbbb;
                               text-transform:uppercase;letter-spacing:1px;">Order Date</p>
                    <p style="margin:0;font-size:13px;font-weight:600;color:#282C3F;">${formattedOrderDate}</p>
                  </td>
                  <td style="width:33%;vertical-align:top;text-align:right;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:#bbbbbb;
                               text-transform:uppercase;letter-spacing:1px;">Est. Delivery</p>
                    <p style="margin:0;font-size:13px;font-weight:600;color:#27ae60;">${estDelivery}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Items ── -->
          <tr>
            <td style="padding:24px 32px 8px;">
              <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#282C3F;
                         text-transform:uppercase;letter-spacing:1px;">
                Items Ordered &nbsp;
                <span style="background:#6366f1;color:#fff;font-size:11px;
                             font-weight:700;padding:2px 7px;border-radius:20px;">${items.length}</span>
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${itemRows}
              </table>
            </td>
          </tr>

          <!-- ── Dashed divider ── -->
          <tr>
            <td style="padding:4px 32px 0;">
              <hr style="border:none;border-top:2px dashed #f0f0f0;margin:0;">
            </td>
          </tr>

          <!-- ── Price summary ── -->
          <tr>
            <td style="padding:20px 32px 24px;">
              <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#282C3F;
                         text-transform:uppercase;letter-spacing:1px;">Price Details</p>
              ${priceRows}
            </td>
          </tr>

          <!-- ── Delivery address ── -->
          ${addressSection}

          <!-- ── CTA button ── -->
          <tr>
            <td style="padding:4px 32px 36px;text-align:center;">
              <a href="${appUrl}/account/orders"
                style="display:inline-block;background:#6366f1;color:#ffffff;
                       padding:15px 48px;border-radius:8px;font-size:15px;font-weight:700;
                       text-decoration:none;letter-spacing:0.3px;
                       box-shadow:0 4px 14px rgba(99,102,241,0.4);">
                Track Your Order &rarr;
              </a>
              <p style="margin:14px 0 0;font-size:12px;color:#bbbbbb;">
                Or visit
                <a href="${appUrl}/account/orders"
                  style="color:#6366f1;text-decoration:none;">${appUrl}/account/orders</a>
              </p>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background:#f9f9f9;border-top:1px solid #f0f0f0;
                       padding:22px 32px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#888888;">
                Questions? Reply to this email or
                <a href="mailto:support@aura.local"
                  style="color:#6366f1;text-decoration:none;">contact support</a>.
              </p>
              <p style="margin:0;font-size:12px;color:#cccccc;">
                &copy; 2025 Aura Marketplace &nbsp;&middot;&nbsp; Happy Shopping &#128717;
              </p>
            </td>
          </tr>

        </table>
        <!-- /card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}
