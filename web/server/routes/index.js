import express from "express";
import imageRoute from "./imageRoute.js";
import productRoute from "./productRoute.js";
import logoRoute from "./logoRoute.js";

const router = express.Router();

router.use("/image", imageRoute);
router.use("/product", productRoute);
router.use("/logo", logoRoute);

export default router;
