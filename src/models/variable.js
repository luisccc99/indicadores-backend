'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Variable extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.belongsTo(models.Formula, { foreignKey: 'idFormula' });
      this.belongsTo(models.UnidadMedida, { foreignKey: 'idUnidad' })
    }
  };
  Variable.init({

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },

    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    codigoAtributo: {
      type: DataTypes.STRING,
      allowNull: false
    },

    nombreAtributo: {
      type: DataTypes.STRING,
      allowNull: false
    },

    formulaCalculo: {
      type: DataTypes.STRING,
      allowNull: false
    },

    dato: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'No aplica'
    },

    idUnidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    anio: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
    
  }, {
    sequelize,
    name: {
      singular: 'variable',
      plural: 'variables'
    },
    modelName: 'Variable',
    timestamps: false,
    indexes : [
      {
        unique: false,
        fields: ['idUnidad']
      }
    ]
  });
  return Variable;
};