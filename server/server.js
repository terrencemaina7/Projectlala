import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import mpesaRoutes from "./routes/mpesa.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/mpesa", mpesaRoutes);

app.get("/", (req, res) => {
  res.send("LalaBnB payment server running 🚀");
});

const PORT = process.env.PORT || 4242;

app.listen(PORT, () => {
  console.log(`Payment server running on port ${PORT}`);
});

export default app;