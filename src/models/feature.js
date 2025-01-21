'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Feature extends Model {
    };
    Feature.init(
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false,
                type: DataTypes.TEXT
            },

            criteria: {
                type: DataTypes.STRING,
                allowNull: false,
                type: DataTypes.TEXT
            },

            active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },

        },
        {
            sequelize,
            name: {
                singular: 'feature',
                plural: 'features'
            },
            modelName: 'Feature',
            timestamps: true
        }
    );
    return Feature;
};  