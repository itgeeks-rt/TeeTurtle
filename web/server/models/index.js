// import dbConfig from "../config/db.config";
import dbConfig from "../config/db.config.js";
import image_template from "./image_template.model.js";
import personalized_image from "./personalized_image.model.js";
import logo_image from "./logo_image.model.js";

import Sequelize from "sequelize";

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: "mysql",
  port: dbConfig.PORT,
  logging: false,
});
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.image_template = image_template(sequelize, Sequelize);
db.personalized_image = personalized_image(sequelize, Sequelize);
db.logo_image = logo_image(sequelize, Sequelize);

export default db;
