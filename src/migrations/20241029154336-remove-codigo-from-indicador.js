'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Indicadores', 'codigo')
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.addColumn('Indicadores', 'codigo', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    })
  }
};
