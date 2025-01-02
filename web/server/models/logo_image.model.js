const logo_image = (sequelize, Sequelize) => {
  const logo_image = sequelize.define("logo_image", {
    logoName: {
      type: Sequelize.STRING,
    },
    logoURL: {
      type: Sequelize.STRING,
    },
    logoId: {
      type: Sequelize.STRING,
    },
    createdAt: {
      type: Sequelize.DATEONLY,
    },
    updatedAt: {
      type: Sequelize.DATEONLY,
    },
  });
  return logo_image;
};

export default logo_image;
