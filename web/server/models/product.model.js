const  productModel = (sequelize, Sequelize) => {
    const product_details = sequelize.define("product_details", {
   
    productId: {
    type: Sequelize.STRING
    },
    imageName: {
    type: Sequelize.STRING  
    },
    imageURL: {
    type: Sequelize.STRING
    },
    category: {
    type: Sequelize.STRING
    },
    imageId: {
    type: Sequelize.STRING
    },
    createdAt: {
    type: Sequelize.DATEONLY
    },
    updatedAt: {
    type: Sequelize.DATEONLY
    }
    });
    return product_details;
    };

    export default productModel