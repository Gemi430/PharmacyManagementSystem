import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  res.json({ message: "Protected sales data", user: req.user });
});

export default router;