import joi from "joi"
export const  deleteSchema = joi.object({
    imageId:joi.string().required(),
    personalized:joi.boolean().required(),
   
}).unknown()