import { statusCode } from "../constants/statusCodes.js";
import { uploadProductImageSchema } from "./schema/uploadProductImageSchema.js";

export const uploadProductImageValidation = (req, res, next) => {
  const { error } = uploadProductImageSchema.validate(req.body);
  if (error) {
    res
      .status(statusCode.BAD_REQUEST)
      .json({ error: error.details[0].message });
  } else {
    next();
  }
};
