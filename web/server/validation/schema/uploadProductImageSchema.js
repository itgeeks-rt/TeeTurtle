import joi from "joi";
export const uploadProductImageSchema = joi
  .object({
    productIdList: joi.array().min(1).required(),
    imageUrlList: joi.array().min(1).required(),
  })
  .unknown();
