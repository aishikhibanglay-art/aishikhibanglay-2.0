import express, { type Request, type Response } from "express";
import cors from "cors";
import { Router } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import axios from "axios";
import { Resend } from "resend";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Supabase Admin ───────────────────────────────────────────────────────────
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
  _supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return _supabase;
}

// ─── SSLCommerz ──────────────────────────────────────────────────────────────
const STORE_ID = process.env["SSLCOMMERZ_STORE_ID"] || "testbox";
const STORE_PASSWORD = process.env["SSLCOMMERZ_STORE_PASSWORD"] || "qwerty";
const IS_LIVE = process.env["SSLCOMMERZ_IS_LIVE"] === "true";
const SSLCZ_BASE = IS_LIVE
  ? "https://securepay.sslcommerz.com"
  : "https://sandbox.sslcommerz.com";

const APP_URL =
  process.env["APP_URL"] ||
  (process.env["VERCEL_URL"]
    ? `https://${process.env["VERCEL_URL"]}`
    : "https://aishikhibanglay.com");

async function initSSLCommerz(params: Record<string, string>) {
  const url = `${SSLCZ_BASE}/gwprocess/v4/api.php`;
  const form = new URLSearchParams({ store_id: STORE_ID, store_passwd: STORE_PASSWORD, ...params });
  const res = await axios.post(url, form.toString(), { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
  return res.data as { status: string; GatewayPageURL?: string; sessionkey?: string };
}

async function validateSSLCommerz(val_id: string) {
  const url = `${SSLCZ_BASE}/validator/api/validationserverAPI.php`;
  const res = await axios.get(url, { params: { val_id, store_id: STORE_ID, store_passwd: STORE_PASSWORD, format: "json" } });
  return res.data as { status: string; amount?: string; currency?: string };
}

// ─── Resend ───────────────────────────────────────────────────────────────────
async function sendReceiptEmail(to: string, name: string, courseName: string, amount: number, orderId: string) {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: "AI শিখি বাংলায় <noreply@aishikhibanglay.com>",
    to,
    subject: `পেমেন্ট সফল — ${courseName}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#0f0f1a;color:#e2e8f0;border-radius:12px">
      <h2 style="color:#a78bfa">পেমেন্ট নিশ্চিত হয়েছে! ✅</h2>
      <p>প্রিয় <strong>${name}</strong>,</p>
      <p>আপনার পেমেন্ট সফলভাবে সম্পন্ন হয়েছে।</p>
      <div style="background:#1e1b2e;padding:16px;border-radius:8px;margin:16px 0">
        <p><strong>কোর্স:</strong> ${courseName}</p>
        <p><strong>পরিমাণ:</strong> ৳${amount} BDT</p>
        <p><strong>অর্ডার ID:</strong> ${orderId}</p>
      </div>
      <a href="${APP_URL}/dashboard" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">কোর্স শুরু করুন →</a>
      <p style="margin-top:24px;color:#6b7280;font-size:12px">সমস্যা হলে support@aishikhibanglay.com-এ যোগাযোগ করুন।</p>
    </div>`,
  });
}

// ─── Auth helper ──────────────────────────────────────────────────────────────
async function getProfile(authHeader: string | undefined) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const sb = getSupabase();
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile } = await sb.from("profiles").select("id,name,email").eq("user_id", user.id).single();
  return profile as { id: string; name: string; email: string } | null;
}

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/api/healthz", (_req: Request, res: Response) => res.json({ status: "ok" }));

// ─── Coupons ──────────────────────────────────────────────────────────────────
const couponsRouter = Router();

couponsRouter.post("/validate", async (req: Request, res: Response) => {
  const { code, course_id, price_bdt } = req.body as { code: string; course_id: string; price_bdt: number };
  if (!code || !course_id || price_bdt == null) {
    return res.status(400).json({ valid: false, discount_amount: 0, final_price: price_bdt ?? 0, message: "কোড, কোর্স ID এবং মূল্য প্রয়োজন।" });
  }
  const now = new Date().toISOString();
  const sb = getSupabase();
  const { data: coupon, error } = await sb.from("coupons").select("*").eq("code", code.toUpperCase()).eq("is_active", true).single();
  if (error || !coupon) return res.json({ valid: false, discount_amount: 0, final_price: price_bdt, message: "এই কুপন কোডটি বৈধ নয়।" });
  if (coupon.expires_at && coupon.expires_at < now) return res.json({ valid: false, discount_amount: 0, final_price: price_bdt, message: "এই কুপন কোডের মেয়াদ শেষ হয়ে গেছে।" });
  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) return res.json({ valid: false, discount_amount: 0, final_price: price_bdt, message: "এই কুপনের ব্যবহারসীমা শেষ হয়ে গেছে।" });
  if (coupon.applicable_courses?.length > 0 && !coupon.applicable_courses.includes(course_id)) return res.json({ valid: false, discount_amount: 0, final_price: price_bdt, message: "এই কুপন এই কোর্সে প্রযোজ্য নয়।" });
  const discount = coupon.discount_type === "percentage" ? Math.round(price_bdt * coupon.discount_value / 100) : Math.min(coupon.discount_value, price_bdt);
  const final = Math.max(0, price_bdt - discount);
  return res.json({ valid: true, discount_amount: discount, final_price: final, message: `${coupon.discount_value}${coupon.discount_type === "percentage" ? "%" : "৳"} ছাড় পেয়েছেন!`, coupon_id: coupon.id });
});

app.use("/api/coupons", couponsRouter);

// ─── Payment ──────────────────────────────────────────────────────────────────
const paymentRouter = Router();

paymentRouter.post("/sslcommerz/init", async (req: Request, res: Response) => {
  try {
    const profile = await getProfile(req.headers.authorization);
    if (!profile) return res.status(401).json({ error: "Unauthorized. Please login first." });
    const { course_id, coupon_code } = req.body as { course_id: string; coupon_code?: string };
    if (!course_id) return res.status(400).json({ error: "course_id is required" });
    const sb = getSupabase();
    const { data: course, error: courseErr } = await sb.from("courses").select("id,title,price_bdt,price_usd,is_free,is_published,slug").eq("id", course_id).eq("is_published", true).single();
    if (courseErr || !course) return res.status(404).json({ error: "কোর্সটি পাওয়া যায়নি।" });
    const { data: existing } = await sb.from("enrollments").select("id").eq("profile_id", profile.id).eq("course_id", course_id).eq("status", "active").single();
    if (existing) return res.status(409).json({ error: "আপনি ইতিমধ্যে এই কোর্সে ভর্তি আছেন।" });
    if (course.is_free) {
      await sb.from("enrollments").upsert({ profile_id: profile.id, course_id, status: "active", enrolled_at: new Date().toISOString() }, { onConflict: "profile_id,course_id" });
      return res.json({ type: "free", redirect: `${APP_URL}/dashboard` });
    }
    let finalPrice = course.price_bdt;
    let couponId: string | null = null;
    if (coupon_code) {
      const { data: coupon } = await sb.from("coupons").select("*").eq("code", coupon_code.toUpperCase()).eq("is_active", true).single();
      if (coupon) {
        const disc = coupon.discount_type === "percentage" ? Math.round(finalPrice * coupon.discount_value / 100) : Math.min(coupon.discount_value, finalPrice);
        finalPrice = Math.max(0, finalPrice - disc);
        couponId = coupon.id;
      }
    }
    const tran_id = `ORDER_${Date.now()}_${profile.id.slice(0, 8)}`;
    await sb.from("orders").insert({ profile_id: profile.id, course_id, tran_id, amount_bdt: finalPrice, coupon_id: couponId, status: "pending" });
    const sslRes = await initSSLCommerz({
      total_amount: String(finalPrice),
      currency: "BDT",
      tran_id,
      success_url: `${APP_URL}/api/payment/sslcommerz/success`,
      fail_url: `${APP_URL}/api/payment/sslcommerz/fail`,
      cancel_url: `${APP_URL}/api/payment/sslcommerz/cancel`,
      ipn_url: `${APP_URL}/api/payment/sslcommerz/ipn`,
      product_name: course.title,
      product_category: "Education",
      product_profile: "digital-goods",
      cus_name: profile.name,
      cus_email: profile.email,
      cus_add1: "Bangladesh",
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      cus_phone: "01700000000",
      shipping_method: "NO",
      num_of_item: "1",
      weight_of_items: "0",
      logistic_pickup_id: "N/A",
      logistic_delivery_type: "N/A",
      invoice_prefix: "AISH",
    });
    if (sslRes.status !== "SUCCESS" || !sslRes.GatewayPageURL) return res.status(502).json({ error: "পেমেন্ট গেটওয়ে সমস্যা। পরে আবার চেষ্টা করুন।" });
    return res.json({ type: "redirect", url: sslRes.GatewayPageURL });
  } catch (err) {
    console.error("Payment init error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

paymentRouter.post("/sslcommerz/success", async (req: Request, res: Response) => {
  try {
    const { tran_id, val_id, status } = req.body as { tran_id: string; val_id: string; status: string };
    if (status !== "VALID" && status !== "VALIDATED") return res.redirect(`${APP_URL}/payment/fail?reason=invalid_status`);
    const validation = await validateSSLCommerz(val_id);
    if (validation.status !== "VALID" && validation.status !== "VALIDATED") return res.redirect(`${APP_URL}/payment/fail?reason=validation_failed`);
    const sb = getSupabase();
    const { data: order } = await sb.from("orders").select("*").eq("tran_id", tran_id).single();
    if (!order) return res.redirect(`${APP_URL}/payment/fail?reason=order_not_found`);
    if (order.status === "success") return res.redirect(`${APP_URL}/payment/success?order_id=${order.id}`);
    await sb.from("orders").update({ status: "success", val_id, paid_at: new Date().toISOString() }).eq("tran_id", tran_id);
    await sb.from("enrollments").upsert({ profile_id: order.profile_id, course_id: order.course_id, status: "active", enrolled_at: new Date().toISOString(), order_id: order.id }, { onConflict: "profile_id,course_id" });
    if (order.coupon_id) {
      const { data: coupon } = await sb.from("coupons").select("used_count").eq("id", order.coupon_id).single();
      if (coupon) await sb.from("coupons").update({ used_count: (coupon.used_count || 0) + 1 }).eq("id", order.coupon_id);
    }
    const { data: profile } = await sb.from("profiles").select("name,email").eq("id", order.profile_id).single();
    const { data: course } = await sb.from("courses").select("title").eq("id", order.course_id).single();
    if (profile && course) await sendReceiptEmail(profile.email, profile.name, course.title, order.amount_bdt, order.id);
    return res.redirect(`${APP_URL}/payment/success?order_id=${order.id}`);
  } catch (err) {
    console.error("Payment success error:", err);
    return res.redirect(`${APP_URL}/payment/fail?reason=server_error`);
  }
});

paymentRouter.post("/sslcommerz/fail", async (req: Request, res: Response) => {
  const { tran_id } = req.body as { tran_id: string };
  if (tran_id) await getSupabase().from("orders").update({ status: "failed" }).eq("tran_id", tran_id).eq("status", "pending");
  return res.redirect(`${APP_URL}/payment/fail?reason=payment_failed`);
});

paymentRouter.post("/sslcommerz/cancel", async (req: Request, res: Response) => {
  const { tran_id } = req.body as { tran_id: string };
  if (tran_id) await getSupabase().from("orders").update({ status: "failed" }).eq("tran_id", tran_id).eq("status", "pending");
  return res.redirect(`${APP_URL}/payment/fail?reason=cancelled`);
});

paymentRouter.post("/sslcommerz/ipn", async (req: Request, res: Response) => {
  try {
    const { tran_id, val_id, status } = req.body as { tran_id: string; val_id: string; status: string };
    if ((status === "VALID" || status === "VALIDATED") && tran_id && val_id) {
      const validation = await validateSSLCommerz(val_id);
      if (validation.status === "VALID" || validation.status === "VALIDATED") {
        const sb = getSupabase();
        const { data: order } = await sb.from("orders").select("*").eq("tran_id", tran_id).single();
        if (order && order.status !== "success") {
          await sb.from("orders").update({ status: "success", val_id, paid_at: new Date().toISOString() }).eq("tran_id", tran_id);
          await sb.from("enrollments").upsert({ profile_id: order.profile_id, course_id: order.course_id, status: "active", enrolled_at: new Date().toISOString(), order_id: order.id }, { onConflict: "profile_id,course_id" });
        }
      }
    }
    return res.json({ status: "ok" });
  } catch { return res.json({ status: "ok" }); }
});

app.use("/api/payment", paymentRouter);

export default app;
