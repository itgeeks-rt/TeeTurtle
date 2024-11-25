import express from 'express';
import * as controllers  from "../controllers/images.controller.js"
import { upload } from '../middlewares/multerMiddleware.js';
const router = express.Router();


router.post("/uploadImage",upload.single("file"),controllers.uploadImage)
router.get("/getImage",controllers.getImage)
router.delete("/deleteImage",controllers.deleteImage)

export default router