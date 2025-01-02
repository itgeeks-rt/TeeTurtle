import * as services from "../services/product.service.js";
import { sendResponse } from "../utils/sendResponse.js";
import { SuccessMessage, ErrorMessage } from "../constants/messages.js";
import { statusCode } from "../constants/statusCodes.js";
// Using the services in your function
export const getProductList = async (req, res) => {
  try {
    const session = req.currentSession;
    const result = await services.getProductList(req, res, session);
    sendResponse(res, statusCode.OK, true, SuccessMessage.DATA_FETCHED, result);
  } catch (error) {
    console.log("error in createCollection : ", error);
    sendResponse(
      res,
      statusCode.INTERNAL_SERVER_ERROR,
      false,
      ErrorMessage.INTERNAL_SERVER_ERROR,
      error
    );
  }
};

export const uploadProductImage = async (req, res) => {
  try {
    const session = req.currentSession;
    const result = await services.uploadProductImage(req, res, session);
    if (!result) {
      sendResponse(
        res,
        statusCode.BAD_REQUEST,
        false,
        ErrorMessage.DATA_NOT_CREATED
      );
    } else {
      sendResponse(
        res,
        statusCode.OK,
        true,
        SuccessMessage.DATA_CREATED,
        result
      );
    }
  } catch (error) {
    console.log("error in upload Image : ", error);
    sendResponse(
      res,
      statusCode.INTERNAL_SERVER_ERROR,
      false,
      ErrorMessage.INTERNAL_SERVER_ERROR,
      error
    );
  }
};
