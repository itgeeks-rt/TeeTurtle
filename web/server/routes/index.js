import express from 'express';
import imageRoute from "./imageRoute.js"
import productRoute from "./productRoute.js"


const router = express.Router();

router.use("/image"  ,imageRoute)
router.use("/product"  ,productRoute)

export default router
