'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const t = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.createTable('IndicadorMetas', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },

        idIndicador: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Indicadores',
            key: 'id'
          }
        },

        idMeta: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Metas',
            key: 'id'
          }
        },

        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('NOW')
        },

        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('NOW')
        },
      }, {
        transaction: t
      });

      await queryInterface.addIndex('IndicadorMetas', {
        name: 'indicadorMeta_unique',
        fields: ['idIndicador', 'idMeta'],
        type: 'UNIQUE',
        transaction: t
      });

      await t.commit()

    } catch (err) {
      console.error(err);
      await t.rollback();
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('IndicadorMetas');
  }
};
