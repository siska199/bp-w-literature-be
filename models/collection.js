'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class collection extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      collection.belongsTo(models.user,{
        as:'user',
        foreignKey:'idUser'
        
      })
    }
  };
  collection.init({
    idUser: DataTypes.INTEGER,
    idLiterature:  DataTypes.UUID
  }, {
    sequelize,
    modelName: 'collection',
  });
  return collection;
};