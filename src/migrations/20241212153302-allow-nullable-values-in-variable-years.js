'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Variables', 'anio', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('Variables', 'anio', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    })
  }
};
