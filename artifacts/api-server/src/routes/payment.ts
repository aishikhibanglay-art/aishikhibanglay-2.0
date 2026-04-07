import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase-admin.js";
import { initSSLCommerz, validateSSLCommerz } from "../lib/sslcommerz.js";
import { sendReceiptEmail } from "../lib/resend-client.js";
import { logger } from "../lib/logger.js";

const router = Router();

const APP_URL =
  process.env["APP_URL"] ||
  (process.env["REPLIT_DEV_DOMAIN"]
    ? `https://${process.env["REPLIT_DEV_DOMAIN"]}`
    : "https://aishikhibanglay.com");

// ─── Helper: get profile from JWT ────────────────────────────────────────────
async function getProfileFromJWT(authHeader: string | undefined) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email")
    .eq("user_id", user.id)
    .single();

  return profile;
}

// ─── POST /api/payment/sslcommerz/init ───────────────────────────────────────
router.post("/sslcommerz/init", async (req, res) => {
  try {
    const profile = await getProfileFromJWT(req.headers.authorization);
    if (!profile) {
      return res.status(401).json({ error: "Unauthorized. Please login first." });
    }

    const { course_id, coupon_code } = req.body as { course_id: string; coupon_code?: string };
    if (!course_id) return res.status(400).json({ error: "course_id is required" });

    // 1. Fetch course details
    const { data: course, error: courseErr } = await supabaseAdmin
      .from("courses")
      .select("id, title, price_bdt, price_usd, is_free, is_published, slug")
      .eq("id", course_id)
      .eq("is_published", true)
      .single();

    if (courseErr || !course) return res.status(404).json({ error: "কোর্সটি পাওয়া যায়নি।" });

    // 2. Check already enrolled
    const { data: existingEnrollment } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("user_id", profile.id)
      .eq("course_id", course_id)
      .maybeSingle();

    if (existingEnrollment) {
      return res.status(409).json({ error: "আপনি ইতিমধ্যে এই কোর্সে ভর্তি আছেন।" });
    }

    // 3. Handle FREE courses → direct enrollment (no payment)
    if (course.is_free) {
      const { data: order, error: orderErr } = await supabaseAdmin
        .from("orders")
        .insert({
          user_id: profile.id,
          course_id,
          amount: 0,
          currency: "BDT",
          payment_method: "manual",
          payment_status: "success",
          notes: "Free course enrollment",
        })
        .select("id")
        .single();

      if (orderErr) throw orderErr;

      await supabaseAdmin.from("enrollments").insert({
        user_id: profile.id,
        course_id,
        payment_id: order!.id,
      });

      return res.json({ type: "free", redirect: `/dashboard/courses` });
    }

    // 4. Validate coupon (if provided)
    let discountAmount = 0;
    let couponId: string | null = null;

    if (coupon_code) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", coupon_code.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (coupon) {
        const now = new Date();
        const expired = coupon.expiry_date && new Date(coupon.expiry_date) < now;
        const limitReached = coupon.usage_limit && coupon.used_count >= coupon.usage_limit;
        const applicable = !coupon.applicable_courses || coupon.applicable_courses.length === 0 || coupon.applicable_courses.includes(course_id);

        if (!expired && !limitReached && applicable) {
          couponId = coupon.id;
          if (coupon.discount_type === "percentage") {
            discountAmount = Math.floor((course.price_bdt * coupon.discount_value) / 100);
          } else if (coupon.discount_type === "flat_bdt") {
            discountAmount = Math.min(coupon.discount_value, course.price_bdt);
          }
        }
      }
    }

    const finalAmount = Math.max(0, course.price_bdt - discountAmount);

    // 5. Create PENDING order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: profile.id,
        course_id,
        amount: finalAmount,
        currency: "BDT",
        payment_method: "sslcommerz",
        payment_status: "pending",
        coupon_id: couponId,
        discount_amount: discountAmount,
      })
      .select("id")
      .single();

    if (orderErr || !order) throw orderErr || new Error("Order creation failed");

    const orderId = order.id as string;

    // 6. Init SSLCommerz
    const apiBase = `${APP_URL}/api/payment/sslcommerz`;
    const sslResult = await initSSLCommerz({
      tran_id: orderId,
      total_amount: finalAmount,
      currency: "BDT",
      success_url: `${apiBase}/success`,
      fail_url: `${apiBase}/fail`,
      cancel_url: `${apiBase}/cancel`,
      ipn_url: `${apiBase}/ipn`,
      cus_name: profile.name || "Customer",
      cus_email: profile.email,
      cus_phone: "N/A",
      product_name: course.title,
      product_category: "Online Course",
    });

    if (sslResult.status !== "SUCCESS" || !sslResult.GatewayPageURL) {
      // Mark order as failed
      await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", orderId);
      return res.status(502).json({ error: sslResult.failedreason || "SSLCommerz initialization failed" });
    }

    // 7. Store sessionkey in gateway_ref temporarily
    await supabaseAdmin
      .from("orders")
      .update({ gateway_ref: sslResult.sessionkey })
      .eq("id", orderId);

    return res.json({ type: "redirect", url: sslResult.GatewayPageURL });
  } catch (err) {
    logger.error(err, "sslcommerz/init error");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/payment/sslcommerz/success ────────────────────────────────────
router.post("/sslcommerz/success", async (req, res) => {
  try {
    const { tran_id, val_id, amount, currency, status } = req.body as Record<string, string>;

    if (status !== "VALID" && status !== "VALIDATED") {
      return res.redirect(`${APP_URL}/payment/fail?reason=invalid_status`);
    }

    // Validate with SSLCommerz
    const validation = await validateSSLCommerz(val_id);
    if (validation.status !== "VALID" && validation.status !== "VALIDATED") {
      return res.redirect(`${APP_URL}/payment/fail?reason=validation_failed`);
    }

    if (validation.tran_id !== tran_id) {
      return res.redirect(`${APP_URL}/payment/fail?reason=tran_mismatch`);
    }

    // Fetch the order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, course_id, amount, payment_status, coupon_id")
      .eq("id", tran_id)
      .single();

    if (orderErr || !order) {
      return res.redirect(`${APP_URL}/payment/fail?reason=order_not_found`);
    }

    // Prevent double-processing
    if (order.payment_status === "success") {
      return res.redirect(`${APP_URL}/payment/success?order_id=${order.id}`);
    }

    // Update order to success + store actual val_id
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "success", gateway_ref: val_id })
      .eq("id", order.id);

    // Increment coupon used_count
    if (order.coupon_id) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("used_count")
        .eq("id", order.coupon_id)
        .single();
      if (coupon) {
        await supabaseAdmin
          .from("coupons")
          .update({ used_count: (coupon.used_count ?? 0) + 1 })
          .eq("id", order.coupon_id);
      }
    }

    // Create enrollment
    const { error: enrollErr } = await supabaseAdmin
      .from("enrollments")
      .upsert(
        { user_id: order.user_id, course_id: order.course_id, payment_id: order.id },
        { onConflict: "user_id,course_id", ignoreDuplicates: true }
      );

    if (enrollErr) {
      logger.error(enrollErr, "Failed to create enrollment after payment");
    }

    // Fetch profile + course for email
    const [{ data: profile }, { data: course }] = await Promise.all([
      supabaseAdmin.from("profiles").select("name, email").eq("id", order.user_id).single(),
      supabaseAdmin.from("courses").select("title").eq("id", order.course_id).single(),
    ]);

    if (profile && course) {
      await sendReceiptEmail({
        to: profile.email,
        name: profile.name,
        courseName: course.title,
        amount: Number(order.amount),
        currency: currency || "BDT",
        orderId: order.id,
        gatewayRef: val_id,
      }).catch((err) => logger.error(err, "Receipt email failed"));
    }

    return res.redirect(`${APP_URL}/payment/success?order_id=${order.id}`);
  } catch (err) {
    logger.error(err, "sslcommerz/success error");
    return res.redirect(`${APP_URL}/payment/fail?reason=server_error`);
  }
});

// ─── POST /api/payment/sslcommerz/fail ───────────────────────────────────────
router.post("/sslcommerz/fail", async (req, res) => {
  const { tran_id, error: sslError } = req.body as Record<string, string>;
  if (tran_id) {
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "failed", notes: sslError || "Payment failed" })
      .eq("id", tran_id)
      .eq("payment_status", "pending");
  }
  return res.redirect(`${APP_URL}/payment/fail?reason=payment_failed`);
});

// ─── POST /api/payment/sslcommerz/cancel ─────────────────────────────────────
router.post("/sslcommerz/cancel", async (req, res) => {
  const { tran_id } = req.body as Record<string, string>;
  if (tran_id) {
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "failed", notes: "User cancelled payment" })
      .eq("id", tran_id)
      .eq("payment_status", "pending");
  }
  return res.redirect(`${APP_URL}/payment/fail?reason=cancelled`);
});

// ─── POST /api/payment/sslcommerz/ipn ────────────────────────────────────────
router.post("/sslcommerz/ipn", async (req, res) => {
  // IPN is a background notification — same logic as success but no redirect
  try {
    const { tran_id, val_id, status } = req.body as Record<string, string>;
    if ((status === "VALID" || status === "VALIDATED") && tran_id && val_id) {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, user_id, course_id, payment_status")
        .eq("id", tran_id)
        .single();

      if (order && order.payment_status === "pending") {
        await supabaseAdmin
          .from("orders")
          .update({ payment_status: "success", gateway_ref: val_id })
          .eq("id", order.id);

        await supabaseAdmin
          .from("enrollments")
          .upsert(
            { user_id: order.user_id, course_id: order.course_id, payment_id: order.id },
            { onConflict: "user_id,course_id", ignoreDuplicates: true }
          );
      }
    }
    return res.json({ status: "ok" });
  } catch (err) {
    logger.error(err, "sslcommerz/ipn error");
    return res.json({ status: "error" });
  }
});

export default router;
