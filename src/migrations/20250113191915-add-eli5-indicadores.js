'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn('Indicadores', 'elif', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      }, { transaction });
      return transaction.commit();
    } catch (err) {
      console.log(`${err}\n`)
      return transaction.rollback();
    }

  },

  async down(queryInterface, Sequelize) {
    return queryInterface.removeColumn('Indicadores', 'elif')
  }
};
