import { Resend } from "resend";

const resendApiKey = process.env["RESEND_API_KEY"];

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendReceiptEmail(opts: {
  to: string;
  name: string;
  courseName: string;
  amount: number;
  currency: string;
  orderId: string;
  gatewayRef: string;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping receipt email");
    return;
  }

  const amountFormatted =
    opts.currency === "BDT"
      ? `৳${opts.amount.toLocaleString("bn-BD")}`
      : `$${opts.amount}`;

  await resend.emails.send({
    from: "AI শিখি বাংলায় <noreply@aishikhibanglay.com>",
    to: opts.to,
    subject: `✅ পেমেন্ট সফল — ${opts.courseName}`,
    html: `
      <!DOCTYPE html>
      <html lang="bn">
      <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
      <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Hind Siliguri',Arial,sans-serif;color:#e2e8f0;">
        <div style="max-width:600px;margin:32px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(139,92,246,0.2);">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:24px;letter-spacing:-0.5px;">🎉 পেমেন্ট সফল হয়েছে!</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">আপনার কোর্সে ভর্তি নিশ্চিত হয়েছে</p>
          </div>

          <!-- Body -->
          <div style="padding:32px;">
            <p style="margin:0 0 20px;font-size:16px;">প্রিয় <strong style="color:#a78bfa;">${opts.name}</strong>,</p>
            <p style="margin:0 0 24px;line-height:1.6;color:#94a3b8;">
              আপনার পেমেন্ট সফলভাবে সম্পন্ন হয়েছে এবং আপনি এখন কোর্সটিতে অ্যাক্সেস পাচ্ছেন।
            </p>

            <!-- Receipt Box -->
            <div style="background:#0f0f1a;border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:20px;margin-bottom:24px;">
              <h3 style="margin:0 0 16px;color:#a78bfa;font-size:14px;text-transform:uppercase;letter-spacing:1px;">পেমেন্ট রসিদ</h3>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr>
                  <td style="padding:8px 0;color:#64748b;">কোর্স</td>
                  <td style="padding:8px 0;color:#e2e8f0;text-align:right;font-weight:600;">${opts.courseName}</td>
                </tr>
                <tr style="border-top:1px solid rgba(255,255,255,0.05);">
                  <td style="padding:8px 0;color:#64748b;">পরিমাণ</td>
                  <td style="padding:8px 0;color:#34d399;text-align:right;font-weight:700;font-size:18px;">${amountFormatted}</td>
                </tr>
                <tr style="border-top:1px solid rgba(255,255,255,0.05);">
                  <td style="padding:8px 0;color:#64748b;">অর্ডার আইডি</td>
                  <td style="padding:8px 0;color:#e2e8f0;text-align:right;font-family:monospace;font-size:12px;">${opts.orderId}</td>
                </tr>
                <tr style="border-top:1px solid rgba(255,255,255,0.05);">
                  <td style="padding:8px 0;color:#64748b;">ট্রানজেকশন রেফ</td>
                  <td style="padding:8px 0;color:#e2e8f0;text-align:right;font-family:monospace;font-size:12px;">${opts.gatewayRef}</td>
                </tr>
              </table>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:24px;">
              <a href="https://aishikhibanglay.com/dashboard/courses" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:16px;">
                কোর্স শুরু করুন →
              </a>
            </div>

            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
              কোনো প্রশ্ন থাকলে <a href="mailto:support@aishikhibanglay.com" style="color:#a78bfa;">support@aishikhibanglay.com</a>-এ ইমেইল করুন।
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#0f0f1a;padding:20px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="margin:0;color:#475569;font-size:12px;">AI শিখি বাংলায় — বাংলাদেশের #১ AI শিক্ষামূলক প্ল্যাটফর্ম</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}
