// import dbConfig from "../config/db.config";
import dbConfig from "../config/db.config.js";
import productModel  from "./product.model.js";

import Sequelize from "sequelize"

const sequelize = new Sequelize(
  dbConfig.DB,
  dbConfig.USER,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    dialect: 'mysql',
    port: dbConfig.PORT,
    logging:false
   
  },
  
  
);
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.productModel=productModel(sequelize,Sequelize)

  
export default db;
