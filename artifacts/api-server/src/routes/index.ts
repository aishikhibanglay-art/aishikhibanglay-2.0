import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import paymentRouter from "./payment.js";
import couponsRouter from "./coupons.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/payment", paymentRouter);
router.use("/coupons", couponsRouter);

export default router;
