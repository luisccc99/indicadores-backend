'use strict';
const { faker } = require('@faker-js/faker');
const { Op } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Roles',
      [
        {
          id: 1,
          rol: 'ADMIN',
          descripcion: faker.lorem.words(5),
          activo: 'SI',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          rol: 'USER',
          descripcion: faker.lorem.words(5),
          activo: 'NO',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
      , {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Roles', { [Op.or]: [{ rol: 'ADMIN' }, { rol: 'USER' }] }, {});
  }
};
