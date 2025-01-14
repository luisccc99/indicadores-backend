'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Usuarios', 'requestedPasswordChange', {
      type: `BOOLEAN USING 
        CAST(CASE 
            WHEN "requestedPasswordChange" = 'SI' THEN 'true' 
            WHEN "requestedPasswordChange" IS NULL THEN 'false'
            ELSE 'false'
          END AS BOOLEAN)`,
      allowNull: true,
      defaultValue: false
    })
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Usuarios', 'requestedPasswordChange', {
      type: `VARCHAR(255) USING 
      CAST(CASE
        WHEN "requestedPasswordChange" = true THEN 'SI'
        WHEN "requestedPasswordChange" IS NULL THEN 'NO'
        ELSE 'NO' 
      END AS VARCHAR(255))`,
    })
  }
};
