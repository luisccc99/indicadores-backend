"use strict";
const { faker } = require("@faker-js/faker");
const { aCodigo, randomYear } = require("../utils/factories");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const indicadores = [];
    for (let i = 0; i < 10; i++) {
      const codigo = aCodigo();
      const date = new Date();
      indicadores.push({
        id: i + 1,
        urlImagen: faker.image.url(),
        nombre: `Indicador ${faker.lorem.word()}`,
        definicion: faker.lorem.sentence(),
        observaciones: faker.lorem.sentence(),
        ultimoValorDisponible: faker.number.float(),
        anioUltimoValorDisponible: randomYear(),
        createdBy: 1,
        updatedBy: 1,
        activo: true,
        fuente: faker.lorem.word(5),
        periodicidad: faker.number.int(15),
        archive: false,
        createdAt: date,
        updatedAt: date,
        tendenciaActual: i % 2 === 0 ? "ASCENDENTE" : "DESCENDENTE",
        tendenciaDeseada: i % 2 === 0 ? "ASCENDENTE" : "DESCENDENTE",
      });
    }
    await queryInterface.bulkInsert("Indicadores", indicadores, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Indicadores", null, {});
  },
};
