import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase-admin.js";
import { logger } from "../lib/logger.js";

const router = Router();

// ─── POST /api/coupons/validate ───────────────────────────────────────────────
// Body: { code: string, course_id: string, price_bdt: number }
// Returns: { valid: boolean, discount_amount: number, final_price: number, message: string }
router.post("/validate", async (req, res) => {
  try {
    const { code, course_id, price_bdt } = req.body as {
      code: string;
      course_id: string;
      price_bdt: number;
    };

    if (!code || !course_id || price_bdt === undefined) {
      return res.status(400).json({ valid: false, message: "code, course_id এবং price_bdt প্রয়োজন।" });
    }

    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;

    if (!coupon) {
      return res.json({ valid: false, discount_amount: 0, final_price: price_bdt, message: "এই কুপন কোডটি বৈধ নয়।" });
    }

    // Check expiry
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return res.json({ valid: false, discount_amount: 0, final_price: price_bdt, message: "এই কুপনের মেয়াদ শেষ হয়ে গেছে।" });
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return res.json({ valid: false, discount_amount: 0, final_price: price_bdt, message: "এই কুপনের ব্যবহার সীমা শেষ হয়ে গেছে।" });
    }

    // Check if applicable to this course
    if (coupon.applicable_courses && coupon.applicable_courses.length > 0) {
      if (!coupon.applicable_courses.includes(course_id)) {
        return res.json({ valid: false, discount_amount: 0, final_price: price_bdt, message: "এই কুপনটি এই কোর্সে প্রযোজ্য নয়।" });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    let discountLabel = "";

    if (coupon.discount_type === "percentage") {
      discountAmount = Math.floor((price_bdt * coupon.discount_value) / 100);
      discountLabel = `${coupon.discount_value}% ছাড়`;
    } else if (coupon.discount_type === "flat_bdt") {
      discountAmount = Math.min(Number(coupon.discount_value), price_bdt);
      discountLabel = `৳${coupon.discount_value} ছাড়`;
    }

    const finalPrice = Math.max(0, price_bdt - discountAmount);

    return res.json({
      valid: true,
      coupon_id: coupon.id,
      discount_amount: discountAmount,
      final_price: finalPrice,
      discount_label: discountLabel,
      message: `কুপন প্রযোজ্য! ${discountLabel} পাচ্ছেন।`,
    });
  } catch (err) {
    logger.error(err, "coupon/validate error");
    return res.status(500).json({ valid: false, message: "কুপন যাচাই করতে সমস্যা হয়েছে।" });
  }
});

export default router;
