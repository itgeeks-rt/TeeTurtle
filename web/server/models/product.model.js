const  productModel = (sequelize, Sequelize) => {
    const product_details = sequelize.define("product_details", {
   
    productId: {
    type: Sequelize.STRING
    },
    imageId: {
    type: Sequelize.STRING
    }
    });
    return product_details;
    };

    export default productModel