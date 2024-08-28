import User from "../models/userModel.js";

import { v4 as uuidv4 } from "uuid";

const getAmount = (subscription) => {
  let amount;

  switch (subscription) {
    case "starter":
      amount = 20000;
      break;
    case "affiliate":
      amount = 50000;
      break;
    default:
      amount = 100000;
      break;
  }
  return amount;
};

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
    const newAmount = getAmount(subscription);

    // const transactionId = `tx-${user.id}-${Date.now()}-${uuidv4()}`;



    const transactionId = `tx-${Math.floor(10000000 + Math.random() * 90000000).toString()}`;

    const updated = await User.update(
      { ...req.body, transactionId, amount: newAmount },
      { where: { id: id } }
    );

    console.log("newuser", user);

    if (updated) {
      const updatedUser = await User.findOne({ where: { id } });
      return res
        .status(200)
        .json({ message: "User updated successfully", updatedUser });
    } else {
      return res
        .status(404)
        .json({ error: "amount not updated,please try again" });
    }
  } catch (error) {
    console.error("Error updating user:", error.message);
    return res.status(500).json({ error: "An error occurred" });
  }
};
