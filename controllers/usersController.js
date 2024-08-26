import User from "../models/userModel.js";
//import Flutterwave from "flutterwave-node-v3";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import forge from "node-forge";

import axios from "axios";



export const signUp = async (req, res) => {
  console.log("Received sign-up request:", req.body);

  const { email } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const user = await User.create({ ...req.body });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });
    console.log("User created successfully:", user, token);
    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const assignPlan = async (req, res) => {
  try {
    const { subscription } = req.body;
    const { Id } = req.params;

    const amount =
      subscription === "starter"
        ? 20000
        : subscription === "affiliate"
        ? 50000
        : 100000;
    const transactionId = `tx-${req.user.userId}-${Date.now()}-${uuidv4()}`;

    const updated = await User.update(
      { transactionId, subscription, amount },
      { where: { id: Id }, returning: true }
    );

    if (updated) {
      return res.status(200).json({ message: "User updated successfully" });
    } else {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user:", error.message);
    return res.status(500).json({ error: "An error occurred" });
  }
};
