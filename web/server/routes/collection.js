import express from 'express';
import * as controllers  from "../controllers/collection.controller.js"
const router = express.Router();


router.post("/createCollection",controllers.createCollection)

export default router