import express from "express";
import * as controllers from "../controllers/logo.controller.js";
const router = express.Router();

router.post("/uploadLogo", controllers.uploadLogo);
router.post("/logoList", controllers.getLogoList);
router.delete("/deleteLogo", controllers.deleteLogo);

export default router;
