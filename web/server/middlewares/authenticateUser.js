import shopify from "../../shopify.js"
import { ErrorMessage } from "../constants/messages.js";
import { statusCode } from "../constants/statusCodes.js";
import { sendResponse } from "../utils/sendResponse.js"; 
export const authenticateUser=async (req,res,next)=>{
    const session = res.locals?.shopify?.session
    let shop = req.query.shop || session?.shop;
    if(!shop){
     return   sendResponse(res,statusCode.BAD_REQUEST,false,ErrorMessage.SHOP_UNAVAILABLE)
    }
    let currentSession = await shopify.config.sessionStorage.findSessionsByShop(shop);
    if(!currentSession){
        return   sendResponse(res,statusCode.BAD_REQUEST,false,ErrorMessage.SESSION_NOT_FOUND)
    }
    req.currentSession=currentSession[0]
    
    next()
} 

