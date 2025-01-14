'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    //remove the columns of fechaDesde, fechaHasta and expires

    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.removeColumn('UsuarioIndicadores', 'fechaDesde', { transaction })
      await queryInterface.removeColumn('UsuarioIndicadores', 'fechaHasta', { transaction })
      await queryInterface.removeColumn('UsuarioIndicadores', 'expires', { transaction })
      return transaction.commit();
    } catch (err) {
      process.stderr(`${err}\n`)
      return transaction.rollback();
    }


  },

  async down(queryInterface, Sequelize) {
    return queryInterface.addColumn('UsuarioIndicadores', 'fechaDesde', {
      type: Sequelize.DATE,
      allowNull: false
    }),
      queryInterface.addColumn('UsuarioIndicadores', 'fechaHasta', {
        type: Sequelize.DATE,
        allowNull: false
      }),
      queryInterface.addColumn('UsuarioIndicadores', 'expires', {
        type: Sequelize.DATE,
        allowNull: false
      })
  }
};
