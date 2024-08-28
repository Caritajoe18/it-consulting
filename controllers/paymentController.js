import User from "../models/userModel.js";
import Flutterwave from "flutterwave-node-v3";
import dotenv from "dotenv";
import open from "open";
import PaymentEvent from "../models/paymentEvent.js";
import axios from "axios";
dotenv.config();

import forge from "node-forge";

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const getExpectedAmount = (subscription) => {
  if (subscription === "starter") return 20000;
  if (subscription === "affiliate") return 50000;
  if (subscription === "business") return 100000;
  return 0;
};

const handlePaymentStatus = async (status, res) => {
  switch (status) {
    case "successful":
      return res.send("Payment successful");
    case "failed":
      return res.send("Payment failed");
    case "pending":
      return res.send("Payment is pending");
    default:
      return res.send("Payment status unknown");
  }
};

export const validateCharge = async (req, res) => {
  try {
    const { otp, flw_ref, type } = req.body;

    const response = await flw.Charge.validate({
      ...req.body,
    });
    console.log("ressss", response);
    return res.status(200).json({ response });
  } catch (error) {
    console.error("Error completing payment:", error.message);
    return res.status(500).json({ error: "An error occurred" });
  }
};

export const paymentCallback = async (req, res) => {
  try {
    const { transactionId } = req.query;

    const response = await flw.Transaction.verify({ id: transactionId });

    const { tx_ref, amount } = response.data;
    const user = await User.findOne({ where: { transactionId: tx_ref } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const expectedAmount = getExpectedAmount(user.dataValues.subscription);

    if (amount !== expectedAmount) {
      return res.status(400).json({
        error: "Amount does not match the selected subscription plan",
      });
    }

    await User.update(
      { paymentStatus: true },
      { where: { transactionId: tx_ref } }
    );
    await handlePaymentStatus(response.data.status, res);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(500).json({ error: "An error occurred" });
  }
};

export const flwWebhook = async (req, res) => {
  try {
    const secretHash = process.env.FLW_SECRET_HASH;
    const signature = req.headers["verif-hash"];
    if (!signature || signature !== secretHash) {
      return res.status(401).end();
    }

    const payload = req.body;

    const { id, tx_ref } = payload.data;

    const existingEvent = await PaymentEvent.findOne({
      where: { transactionid: tx_ref },
    });
    if (existingEvent) {
      return res.status(200).send("Event already processed");
    }

    const user = await User.findOne({ where: { transactionId: tx_ref } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const expectedAmount = user.dataValues.amount;

    const verificationResponse = await flw.Transaction.verify({ id });

    if (
      verificationResponse.data.status === "successful" &&
      verificationResponse.data.amount === expectedAmount &&
      verificationResponse.data.currency === "NGN"
    ) {
      await User.update(
        { paymentStatus: true },
        { where: { transactionId: tx_ref } }
      );

      await PaymentEvent.create({
        status: "processed",
        payload,
        transactionId: tx_ref,
      });

      res.status(200).send("Payment confirmed");
    } else {
      res.status(400).send("Payment verification failed");
    }
  } catch (error) {
    //console.error("Error handling webhook:", error);
    res.status(500).json({ error: "An error occurred processing the webhook" });
  }
};

export const simulatePayment = async (req, res) => {
  try {
    const { data } = req.body;
    const { tx_ref } = data;
    const existingEvent = await PaymentEvent.findOne({
      where: { transactionId: tx_ref },
    });
    if (existingEvent) {
      return res.status(200).send("Event already processed");
    }
    const newEvent = await PaymentEvent.create({
      transactionId: tx_ref,
      status: "pending",
      payload: JSON.stringify(req.body), // Store the entire request body as JSON
    });

    res
      .status(200)
      .json({ message: "Mock payment event created successfully" });

    console.log("Mock payment simulated:", newEvent);
  } catch (error) {
    console.error("Error simulating payment:", error);
  }
};

export const initiatePay = async (req, res) => {
  try {
    const {
      card_number,
      cvv,
      expiry_month,
      expiry_year,
      currency,
      amount,
      fullname,
      email,
      phone_number,
    } = req.body;

    const transactionid = `tx-${Math.floor(
      10000000 + Math.random() * 90000000
    ).toString()}`;

    const payload = {
      card_number,
      cvv,
      expiry_month,
      expiry_year,
      currency: currency || "NGN", // Default to NGN if not provided
      amount,
      redirect_url: "https://your-redirect-url.com",
      fullname,
      email,
      phone_number,
      enckey: process.env.FLW_ENCRYPTION_KEY,
      tx_ref: transactionid,
    };

    await flw.Charge.card(payload);
    console.log(response, "rrrrrrrrrr");

    if (response.meta.authorization.mode === "pin") {
      let payload2 = payload;
      payload2.authorization = {
        mode: "pin",
        fields: ["pin"],
        pin: 3310,
      };
      const reCallCharge = await flw.Charge.card(payload2);
      const callValidate = await flw.Charge.validate({
        otp: "12345",
        flw_ref: reCallCharge.data.flw_ref,
      });
      console.log("valisdddd", callValidate);
    }

    if (response.meta.authorization.mode === "redirect") {
      let url = response.meta.authorization.redirect;
      open(url);
    }
    res.status(200).json(response);
    console.log(response);
  } catch (error) {
    console.log(error);
  }
};
