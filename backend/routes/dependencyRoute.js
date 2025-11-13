import express from "express";
import { analyzeDependencies, getDependencies } from "../controllers/dependencyCntrl.js";

const router = express.Router();

router.post("/analyze", analyzeDependencies);
router.get("/", getDependencies);

export default router;
