'use strict';
const { faker } = require('@faker-js/faker');
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const mapas = [];
    for (let i = 0; i < 1; i++) {
      mapas.push({
        id: (i + 1),
        ubicacion: faker.location.city(),
        url: faker.internet.url(),
        idIndicador: 1,
      });
    }
    await queryInterface.bulkInsert('Mapas', mapas, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Mapas', null, {});
  }
};
