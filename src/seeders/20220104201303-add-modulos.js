'use strict';
const { faker } = require('@faker-js/faker');
const { aCodigo } = require('../utils/factories');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const temas = [];
    for (let i = 0; i < 20; i++) {
      temas.push(
        {
          temaIndicador: faker.lorem.word() + (i + 100),
          observaciones: faker.lorem.words(5),
          activo: i % 2 === 0,
          codigo: aCodigo(),
          descripcion: faker.lorem.words(10),
          createdAt: new Date(),
          updatedAt: new Date(),
          urlImagen: faker.image.url(),
          color: faker.internet.color()
        }
      );
    }

    await queryInterface.bulkInsert('Temas', temas, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Temas', null, {});
  }
};
