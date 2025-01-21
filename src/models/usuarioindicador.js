'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class UsuarioIndicador extends Model {
        static associate(models) {
            this.belongsTo(models.Usuario, { foreignKey: 'idUsuario', targetKey: 'id' })
            this.belongsTo(models.Indicador, { foreignKey: 'idIndicador', targetKey: 'id' })
        }
    };

    UsuarioIndicador.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },

            idUsuario: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Usuarios',
                    key: 'id'
                },
            },

            idIndicador: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Indicadores',
                    key: 'id'
                },
            },

            createdBy: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            isOwner: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            notified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

            notifiedAt: {
                type: DataTypes.DATE,
                allowNull: true,
            },

            updatedBy: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },

            activo: {
                type: DataTypes.STRING(2),
                allowNull: false,
                defaultValue: 'SI',
                validate: {
                    isIn: [['SI', 'NO']]
                }
            },

        },
        {
            indexes: [
                {
                    unique: false,
                    fields: ['createdBy', 'updatedBy']
                }
            ],
            sequelize,
            name: {
                singular: 'usuarioIndicador',
                plural: 'usuarioIndicador'
            },
            modelName: 'UsuarioIndicador',
            tableName: 'UsuarioIndicadores',
            timestamps: true
        }
    );
    return UsuarioIndicador;
};