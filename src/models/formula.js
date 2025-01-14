'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Formula extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.Variable, { foreignKey: 'idFormula' });
      this.belongsTo(models.Indicador, { foreignKey: 'idIndicador' });
    }
  };
  Formula.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      ecuacion: {
        type: DataTypes.STRING,
        defaultValue: 'No aplica'
      },


      descripcion: {
        type: DataTypes.TEXT,
        defaultValue: 'No aplica'
      },

      isFormula: {
        type: DataTypes.STRING(2),
        allowNull: true,
        defaultValue: 'NO',
        validate: {
          isIn: [['SI', 'NO']]
        }
      },
      idIndicador: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Indicador',
            key: 'id'
        },
    },
    },
    {
      sequelize,
      name: {
        singular: 'formula',
        plural: 'formulas'
      },
      modelName: 'Formula',
      timestamps: true
    }
  );
  return Formula;
};