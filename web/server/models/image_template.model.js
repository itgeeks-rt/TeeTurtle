const image_template = (sequelize, Sequelize) => {
  const image_template = sequelize.define("image_template", {
    imageName: {
      type: Sequelize.STRING,
    },
    imageURL: {
      type: Sequelize.STRING,
    },
    category: {
      type: Sequelize.STRING,
    },
    imageId: {
      type: Sequelize.STRING,
    },
    createdAt: {
      type: Sequelize.DATEONLY,
    },
    updatedAt: {
      type: Sequelize.DATE,
    },
    colorName: {
      type: Sequelize.STRING,
    },
  });
  return image_template;
};

export default image_template;
