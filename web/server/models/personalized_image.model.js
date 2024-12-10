const  personalized_image = (sequelize, Sequelize) => {
    const personalized_image = sequelize.define("personalized_image", {

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
    type: Sequelize.DATE
    }
    });
    return personalized_image;
    };

    export default personalized_image