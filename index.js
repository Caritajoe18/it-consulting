import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDatabase, db } from "./db.js";
import userRoutes from "./Routes/userRoutes.js";
import paymentRoutes from './Routes/paymentRoutes.js'

const app = express();
dotenv.config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT ?? 5000;

connectToDatabase()
  .then(async () => {
    console.log("MySQL connected...");

    db.sync({ alter: false}).then(() => {
      console.log("Connected to MySql");
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database:", error);
  });

app.use("/users", userRoutes);
app.use("/pay", paymentRoutes);

export default app;
