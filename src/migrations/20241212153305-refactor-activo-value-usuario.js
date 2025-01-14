'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Usuarios', 'activo', {
      type: `BOOLEAN USING CAST(CASE WHEN "activo" = 'SI' THEN 'true' ELSE 'false' END AS BOOLEAN)`,
      allowNull: false,
      defaultValue: true
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Usuarios', 'activo', {
      type: `VARCHAR(255) USING 
      CAST(CASE
        WHEN "activo" = true THEN 'SI'
        WHEN "activo" IS NULL THEN 'NO'
        ELSE 'NO' 
      END AS VARCHAR(255))`,
    })
  }
};
