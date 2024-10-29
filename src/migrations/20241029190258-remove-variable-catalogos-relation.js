'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeIndex('Variables', 'Variables_idFormula_fkey', { transaction })
      await queryInterface.removeColumn('Variables', 'idUnidad')
      return transaction.commit();
    } catch (err) {
      process.stderr(`${err}\n`)
      return transaction.rollback();
    }
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.addColumn('Variables', 'idUnidad', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    })
  }
};
