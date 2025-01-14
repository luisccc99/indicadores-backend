'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Variable extends Model {
    static associate(models) {
      this.belongsTo(models.Formula, { foreignKey: 'idFormula' });
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

    descripcion: {
      type: DataTypes.STRING,
      allowNull: false
    },

    dato: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'No aplica'
    },

    unidadMedida: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: ''
    },

  
    anio: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }

  }, {
    sequelize,
    name: {
      singular: 'variable',
      plural: 'variables'
    },
    modelName: 'Variable',
    timestamps: false,
  });
  return Variable;
};