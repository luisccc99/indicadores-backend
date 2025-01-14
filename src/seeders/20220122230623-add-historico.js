"use strict";
const { faker } = require("@faker-js/faker");
module.exports = {
  async up(queryInterface, Sequelize) {
    const historico = [];

    for (let i = 0; i < 50; i++) {
      const date = new Date();
      historico.push({
        id: i + 16,
        valor: faker.datatype.number(),
        anio: 2022 - i,
        fuente: faker.internet.url(),
        idIndicador: Math.random() * (5 - 1) + 1,
        createdAt: date,
      });
    }
    await queryInterface.bulkInsert("Historicos", historico, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Historicos", null, {});
  },
};
