
import * as services from "../services/logo.service.js";
import { sendResponse } from "../utils/sendResponse.js";
import { SuccessMessage, ErrorMessage } from "../constants/messages.js"
import { statusCode } from "../constants/statusCodes.js"
// Using the services in your function
export const getLogoList = async (req, res) => {


  try {
    const session = req.currentSession
    const result = await services.getLogoList(req, res, session);
    sendResponse(res, statusCode.OK, true, SuccessMessage.DATA_FETCHED, result)

  } catch (error) {
    console.log("error in createCollection : ", error);
    sendResponse(res, statusCode.INTERNAL_SERVER_ERROR, false, ErrorMessage.INTERNAL_SERVER_ERROR, error)
  }


};
