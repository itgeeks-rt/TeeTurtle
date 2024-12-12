import { statusCode } from "../constants/statusCodes.js";
import { deleteSchema } from "./schema/deleteSchema.js"


export const deleteValidation = (req, res, next) => {
    const { error } = deleteSchema.validate(req.body);
    if (error) {
        res.status(statusCode.BAD_REQUEST).json({ error: error.details[0].message });
    } else {
        next();
    }
}


