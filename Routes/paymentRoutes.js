import express from "express";
import {
  paymentCallback,
  flwWebhook,
  validateCharge,
  simulatePayment
} from "../controllers/paymentController.js";
import { initiatePay } from "../controllers/paymentController.js";

import { auth } from "../middlewares/middleAuth.js";
const router = express.Router();

router.post("/initiate-pay", initiatePay);
router.get("/pay-callback", paymentCallback);

router.post("/flw-webhook", flwWebhook);
router.post("/stimulate", simulatePayment);

router.post("/validate-charge", auth, validateCharge);

export default router;
