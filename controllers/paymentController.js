import User from "../models/userModel.js";
import Flutterwave from "flutterwave-node-v3";
//import { v4 as uuidv4 } from "uuid";
//import jwt from "jsonwebtoken";
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
        console.log("Webhook payload received:", payload);
        
        const { id, tx_ref, status } = payload.data;
        
        const existingEvent = await PaymentEvent.findOne({ where: { id } });
        if (existingEvent) {
            return res.status(200).send("Event already processed");
        }
        
        const user = await User.findOne({ where: { transactionId: tx_ref } });
        
        if (!user) return res.status(404).json({ error: "User not found" });
        
        const expectedAmount = getExpectedAmount(user.subscription);
        
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
                    
                    await PaymentEvent.create({ id, status: "processed" });
                    
                    res.status(200).send("Payment confirmed");
                } else {
                    res.status(400).send("Payment verification failed");
                }
            } catch (error) {
                console.error("Error handling webhook:", error);
                res.status(500).json({ error: "An error occurred processing the webhook" });
            }
        };
        
        // export const initiatePay = async (user) => {
        //   try {
        //     const {
        //       card_number,
        //       cvv,
        //       expiry_month,
        //       expiry_year,
        //       email,
        //       amount,
        //       currency,
        
        //       tx_ref,
        //       redirect_url,
        //     } = req.body;
        //     const userId = req.user.userId;
        
        //     //console.log("idddd", req.user);
        
        //     const details = {
        //       tx_ref,
        //       amount,
        //       currency,
        //       redirect_url,
        //       //payment_options: "card",
        //       card_number,
        //       cvv,
        //       expiry_month,
        //       email,
        //       expiry_year,
        //       // customer: {
        //       //   email: req.user.email,
        //       //   name: req.user.firstname,
        //       //   phonenumber: req.user.phonenumber,
        //       // },
        //       // customizations: {
        //       //   title: "IT consultation Subscription Payment",
        //       //   description: `Payment for ${subscription} subscription`,
        //       // },
        //     };
        //     console.log("dddd", details);
        
        //     console.log("Available methods:", Object.keys(flw));
        //     console.log(flw.Charge);
        
        //     await flw.Charge.card({ details, enckey: process.env.FLW_ENCRYPTION_KEY });
        
        //     return xxx.data.link;
        //   } catch (error) {
        //     if (error instanceof Error) {
        //       return res.status(500).json({ error: error.message });
        //     }
        //     return res.status(500).json({ error: "An error occurred" });
        //   }
        // };