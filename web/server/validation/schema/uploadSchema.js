import joi from "joi"
export const  uploadSchema = joi.object({
    name:joi.string().required()
   
})