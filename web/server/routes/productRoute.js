import express from 'express';
import * as controllers  from "../controllers/product.controller.js"

const router = express.Router();


router.post("/productList",controllers.getProductList)
router.post("/productImage",controllers.uploadProductImage)


export default router