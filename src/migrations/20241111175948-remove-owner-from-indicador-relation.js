'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [indicadores, _count] = await queryInterface.sequelize.query('SELECT i."owner", i."id" from "Indicadores" i')
      const relations = indicadores.map(indicador => ({
        idUsuario: indicador.owner,
        idIndicador: indicador.id,
        expires: 'NO',
        createdBy: indicador.owner,
        updatedBy: indicador.owner,
        isOwner: true
      }))

      if (relations.length > 0) {
        await queryInterface.bulkInsert('UsuarioIndicadores', relations, { transaction })
      }

      await queryInterface.removeColumn('Indicadores', 'owner', { transaction });
      transaction.commit();
    } catch (err) {
      console.log(err)
      transaction.rollback();
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Indicadores', 'owner', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null
    });
  }
};
