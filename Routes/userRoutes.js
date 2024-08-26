import express from "express";
import { signUp, assignPlan } from "../controllers/usersController.js";

const router = express.Router();

router.post("/register", signUp);

router.patch("/plan", assignPlan);

export default router;
