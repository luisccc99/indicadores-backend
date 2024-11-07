'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('UsuarioIndicadores', 'isOwner', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }, { transaction });
      transaction.commit();
    } catch (err) {
      console.log(err)
      transaction.rollback();
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeColumn('UsuarioIndicadores', 'isOwner')
    } catch (err) {
      console.log(err)
      transaction.rollback();
    }
  }
};
