'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Indicadores', 'definicion', {
      type: Sequelize.TEXT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Indicadores', 'definicion', {
      defaultValue: 'No aplica',
      type: Sequelize.STRING(300)
    });
  }
};
