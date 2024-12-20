'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      user.hasMany(models.chat,{
        as : "senderMessage",
        foreignKey:{
          name:"idSender"
        }
      })
      user.hasMany(models.chat,{
        as : "recipientMessage",
        foreignKey:{
          name:"idRecipient"
        }
      })

    }
  };
  user.init({
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    fullName: DataTypes.STRING,
    gender: DataTypes.STRING,
    image: DataTypes.STRING,
    status: DataTypes.STRING,
    phone: DataTypes.STRING,
    address: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'user',
  });
  return user;
};