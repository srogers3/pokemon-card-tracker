import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendRestockAlert({
  to,
  productName,
  storeName,
  storeLocation,
  status,
}: {
  to: string;
  productName: string;
  storeName: string;
  storeLocation: string;
  status: string;
}) {
  await resend.emails.send({
    from: "Pokemon Card Tracker <noreply@yourdomain.com>",
    to,
    subject: `Restock Alert: ${productName} at ${storeName}`,
    html: `
      <h2>Restock Spotted!</h2>
      <p><strong>${productName}</strong> was spotted at <strong>${storeName}</strong> (${storeLocation}).</p>
      <p>Status: <strong>${status}</strong></p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">View Dashboard</a></p>
    `,
  });
}
