'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class literature extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      literature.belongsTo(models.user,{
        as:'user',
        foreignKey:'idUser'
        
      })

      literature.belongsTo(models.year,{
        as:'year',
        foreignKey:'idYear'
      })

      literature.hasMany(models.collection,{
        as : 'collections',
        foreignKey:'idLiterature',
        onUpdate:'cascade',
        onDelete:'cascade',
        hook: true
      })

    }
  };
  literature.init({
    id : {
      allowNull: false,
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      validate: {
        notNull: true
      }
    },
    idUser: DataTypes.INTEGER,
    idYear: DataTypes.INTEGER,
    title: DataTypes.STRING,
    status: DataTypes.STRING,
    publicationDate: DataTypes.STRING,
    pages: DataTypes.INTEGER,
    isbn: DataTypes.STRING,
    author: DataTypes.STRING,
    file: DataTypes.STRING,
    thumbnail:  DataTypes.STRING
  }, {
    sequelize,
    modelName: 'literature',
  });
  return literature;
};