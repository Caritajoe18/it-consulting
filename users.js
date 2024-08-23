import User from "./userModel.js";

export const signUp = async (req, res) => {
  console.log("Received sign-up request:", req.body);


  const {email } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const user = await User.create({ ...req.body });
    console.log("User created successfully:", user);
    res.status(201).json({ user });
  } catch (error) {
    console.error("Error creating user:", error.message);
    res.status(500).json({ error: error.message });
  }
};
