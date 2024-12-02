import express from 'express';
import * as controllers  from "../controllers/images.controller.js"
import { upload } from '../middlewares/multerMiddleware.js';
import {uploadValidation } from "../validation/uploadValidation.js"
const router = express.Router();


router.post("/uploadImage",uploadValidation,controllers.uploadImage)
router.post("/getImage",controllers.getImage)
router.delete("/deleteImage",controllers.deleteImage)
router.post("/productImage",controllers.productImage)
router.post("/imagesList",controllers.getImageList)

export default router