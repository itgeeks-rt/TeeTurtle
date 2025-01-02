import { statusCode } from "../constants/statusCodes.js";
import { imageListSchema } from "./schema/imageListSchema.js";

export const imageListValidation = (req, res, next) => {
  const { error } = imageListSchema.validate(req.body);
  if (error) {
    res
      .status(statusCode.BAD_REQUEST)
      .json({ error: error.details[0].message });
  } else {
    next();
  }
};
