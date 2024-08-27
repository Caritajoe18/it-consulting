import User from "../models/userModel.js";

import { v4 as uuidv4 } from "uuid";

export const signUp = async (req, res) => {
  const { email } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const user = await User.create({ ...req.body });

    res.status(201).json({ user });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const assignPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { subscription } = req.body;

    const user = await User.findOne({ where: { id } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const amount =
      subscription == "starter"
        ? 20000
        : subscription == "affiliate"
        ? 50000
        : 100000;
    const transactionId = `tx-${user.id}-${Date.now()}-${uuidv4()}`;

    const updated = await User.update(
      { transactionId, subscription, amount },
      { where: { id: id }, returning: true }
    );

    if (updated) {
      return res
        .status(301)
        .json({ message: "User updated successfully", user });
    } else {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user:", error.message);
    return res.status(500).json({ error: "An error occurred" });
  }
};
