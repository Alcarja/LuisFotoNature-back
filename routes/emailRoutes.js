import express from "express";
import { suscribe } from "../controllers/emailController.js";

const router = express.Router();

router.post("/suscribe", suscribe);

export default router;
