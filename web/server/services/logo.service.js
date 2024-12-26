import db from "../models/index.js";
const logo_image = db.logo_image;
export const getLogoList = async (req, res, session) => {
    const page = parseInt(req.body.page) || 1
    const limit = parseInt(req.body.limit) || 5
    const offset = (page - 1) * limit
    const result = await logo_image.findAndCountAll({
        offset: offset,
        limit: limit,
        order: [['updatedAt', 'DESC']], 
    });
    const pagination = {
        current_page: page,
        per_page: limit,
        count: result.count
      }
    
      result.pagination = pagination
      delete result.count;
  return result;
};
