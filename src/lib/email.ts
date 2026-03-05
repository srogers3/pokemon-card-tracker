import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const f = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export async function sendRestockAlert({
  to,
  productName,
  storeName,
  storeLocation,
}: {
  to: string;
  productName: string;
  storeName: string;
  storeLocation: string;
  status?: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cardboard-tracker.com";

  await getResend().emails.send({
    from: "Cardboard Tracker <noreply@cardboard-tracker.com>",
    to,
    subject: `Restock Alert: ${productName} at ${storeName}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f0fa; font-family: ${f};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f0fa; padding: 32px 16px; font-family: ${f};">
    <tr>
      <td align="center" style="font-family: ${f};">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(100, 60, 180, 0.08); font-family: ${f};">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed, #6d28d9, #4f9a8f); padding: 32px 24px; text-align: center; font-family: ${f};">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; font-family: ${f};">Cardboard Tracker</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 24px; font-family: ${f};">
              <h2 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #1a1025; font-family: ${f};">Restock Spotted!</h2>
              <p style="margin: 0 0 24px; font-size: 14px; color: #6b6280; font-family: ${f};">A product you're watching has been restocked nearby.</p>

              <!-- Product Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f7fc; border-radius: 12px; border: 1px solid #ede8f5; font-family: ${f};">
                <tr>
                  <td style="padding: 20px; font-family: ${f};">
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #7c3aed; font-family: ${f};">Product</p>
                    <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #1a1025; font-family: ${f};">${productName}</p>
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #7c3aed; font-family: ${f};">Store</p>
                    <p style="margin: 0 0 2px; font-size: 16px; font-weight: 600; color: #1a1025; font-family: ${f};">${storeName}</p>
                    <p style="margin: 0; font-size: 13px; color: #6b6280; font-family: ${f};">${storeLocation}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/dashboard/map" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-family: ${f};">View on Map</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 24px; border-top: 1px solid #ede8f5; text-align: center; font-family: ${f};">
              <p style="margin: 0; font-size: 12px; color: #a099b0; font-family: ${f};">You're receiving this because you have an alert set up on <a href="${appUrl}/dashboard/alerts" style="color: #7c3aed; text-decoration: none; font-family: ${f};">Cardboard Tracker</a>.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });
}
