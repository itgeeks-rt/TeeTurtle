
import * as services from "../services/image.service.js";
import { sendResponse } from "../utils/sendResponse.js";
import {SuccessMessage,ErrorMessage} from "../constants/messages.js"
import {statusCode} from "../constants/statusCodes.js"
// Using the services in your function
export const uploadImage = async (req, res) => {
    
    

   try {

    const session=req.currentSession

    const result = await services.uploadImage(req, res,session);
   //  if(result.result==false  && result.status==false){
   //  sendResponse(res,statusCode.BAD_REQUEST,false,ErrorMessage.IMAGE_NOT_FOUND)
   //  }
   //  else
    sendResponse(res,statusCode.OK,true,SuccessMessage.DATA_CREATED,result)
    
   } catch (error) {
    console.log("error in upload Image : ",error);
    sendResponse(res,statusCode.INTERNAL_SERVER_ERROR,false,ErrorMessage.INTERNAL_SERVER_ERROR,error)
   }
   
   
};

export const getImage = async (req, res) => {
    
    

   try {

     

    const session=req.currentSession

    const result = await services.getImage(req, res,session);
   
    sendResponse(res,statusCode.OK,true,SuccessMessage.DATA_FETCHED,result)
    
   } catch (error) {
    console.log("error in upload Image : ",error);
    sendResponse(res,statusCode.INTERNAL_SERVER_ERROR,false,ErrorMessage.INTERNAL_SERVER_ERROR,error)
   }
   
   
};


export const deleteImage = async (req, res) => {
    
    

   try {

     

    const session=req.currentSession

    const result = await services.deleteImage(req, res,session);
    
    sendResponse(res,statusCode.OK,true,SuccessMessage.DATA_DELETED,result)
    
   } catch (error) {
    console.log("error in upload Image : ",error);
    sendResponse(res,statusCode.INTERNAL_SERVER_ERROR,false,ErrorMessage.INTERNAL_SERVER_ERROR,error)
   }
   
   
};
export const productImage = async (req, res) => {
    
    

   try {

     

    const session=req.currentSession

    const result = await services.productImage(req, res,session);
    
    sendResponse(res,statusCode.OK,true,SuccessMessage.DATA_DELETED,result)
    
   } catch (error) {
    console.log("error in upload Image : ",error);
    sendResponse(res,statusCode.INTERNAL_SERVER_ERROR,false,ErrorMessage.INTERNAL_SERVER_ERROR,error)
   }
   
   
};
export const getImageList = async (req, res) => {
   
   try {

     

    const session=req.currentSession

    const result = await services.getImageList(req, res,session);
    
    sendResponse(res,statusCode.OK,true,SuccessMessage.DATA_FETCHED,result)
    
   } catch (error) {
    console.log("error in upload Image : ",error);
    sendResponse(res,statusCode.INTERNAL_SERVER_ERROR,false,ErrorMessage.INTERNAL_SERVER_ERROR,error)
   }
   
   
};
