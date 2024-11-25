import express from 'express';
import collectionRoute from './collection.js';
import imageRoute from "./imageRoute.js"


const router = express.Router();


router.use("/collection",collectionRoute)
router.use("/image"  ,imageRoute)

export default router
