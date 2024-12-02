import joi from "joi"
export const  uploadSchema = joi.object({
    imageName:joi.string().required(),
    category:joi.string().required(),
    fileBase64:joi.string().required(),
   
}).unknown()