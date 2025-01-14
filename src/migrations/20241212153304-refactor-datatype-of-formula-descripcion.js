'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Formulas', 'descripcion', {
      type: Sequelize.TEXT,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Formulas', 'descripcion', {
      defaultValue: 'No aplica',
      type: Sequelize.STRING(300)
    });
  }
};
