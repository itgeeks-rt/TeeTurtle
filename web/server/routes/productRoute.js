import express from "express";
import * as controllers from "../controllers/product.controller.js";
import { uploadProductImageValidation } from "../validation/uploadProductImageValidation.js";

const router = express.Router();

router.post("/productList", controllers.getProductList);
router.post(
  "/uploadProductImage",
  uploadProductImageValidation,
  controllers.uploadProductImage
);

export default router;
