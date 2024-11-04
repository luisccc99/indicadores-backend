'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.renameColumn('Formulas', 'idUnidad', 'unidadMedida', { transaction: t });
    }
    catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.renameColumn('Formulas', 'unidadMedida', 'idUnidad', { transaction: t });
    }
    catch (err) {
      await t.rollback();
      throw err;
    }
  }
};
