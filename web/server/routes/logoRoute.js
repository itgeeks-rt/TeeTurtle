import express from 'express';
import * as controllers  from "../controllers/logo.controller.js"
const router = express.Router();

router.post("/logoList",controllers.getLogoList)


export default router