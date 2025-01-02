import joi from "joi";
export const imageListSchema = joi
  .object({
    personalized: joi.boolean().required(),
  })
  .unknown();
