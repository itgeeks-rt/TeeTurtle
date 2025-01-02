import { statusCode } from "../constants/statusCodes.js";
import { uploadSchema } from "./schema/uploadSchema.js";

export const uploadValidation = (req, res, next) => {
  const { error } = uploadSchema.validate(req.body);
  if (error) {
    res
      .status(statusCode.BAD_REQUEST)
      .json({ error: error.details[0].message });
  } else {
    next();
  }
};
