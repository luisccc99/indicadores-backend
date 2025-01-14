'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.addColumn('UsuarioIndicadores', 'notified', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction })

      await queryInterface.addColumn('UsuarioIndicadores', 'notifiedAt', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction })

      return transaction.commit();
    } catch (err) {
      process.stderr(`${err}\n`)
      return transaction.rollback();
    }
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.removeColumn('UsuarioIndicadores', 'notified')
  }
};
