'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Usuario extends Model {
        static associate(models) {
            this.belongsToMany(models.Indicador, {
                through: models.UsuarioIndicador,
                foreignKey: 'idUsuario',
                otherKey: 'idIndicador'
            });
            this.belongsTo(models.Rol, { foreignKey: 'idRol' });
        }
    };
    Usuario.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },

            correo: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true
                }
            },

            clave: {
                type: DataTypes.STRING,
                allowNull: false
            },

            nombres: {
                type: DataTypes.STRING(160),
                allowNull: false
            },

            apellidoPaterno: {
                type: DataTypes.STRING(160),
                allowNull: false,
            },

            apellidoMaterno: {
                type: DataTypes.STRING(160),
                allowNull: true
            },

            descripcion: {
                type: DataTypes.STRING(255),
                allowNull: true
            },

            urlImagen: {
                type: DataTypes.STRING,
                allowNull: true
            },

            activo: {
                type: DataTypes.STRING(2),
                allowNull: true,
                defaultValue: 'SI',
                validate: {
                    isIn: [['SI', 'NO']]
                }
            },

            requestedPasswordChange: {
                type: DataTypes.STRING(2),
                allowNull: true,
                defaultValue: 'NO',
                validate: {
                    isIn: [['SI', 'NO']]
                }
            }
        },
        {
            sequelize,
            name: {
                singular: 'usuario',
                plural: 'usuarios'
            },
            modelName: 'Usuario',
            tableName: 'Usuarios',
            timestamps: true,
            scopes: {
                // use to select user (s) without showing their password
                withoutPassword: {
                    attributes: { exclude: ['clave'] }
                }
            },
        }
    );
    return Usuario;
};