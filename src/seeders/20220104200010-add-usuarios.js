'use strict';
const faker = require('faker');
const { hashClave } = require('../middlewares/auth');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const usuarios = [];
    const clave = await hashClave('password')
    usuarios.push({
      correo: 'johndoe@email.com',
      clave,
      nombres: 'John',
      apellidoPaterno: 'Doe',
      descripcion: 'Usuario de sistema de indicadores',
      activo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      idRol: 1,
      requestedPasswordChange: 'NO',
      descripcion: 'Lorem ipsum dolor at eit',
    });

    for (let i = 0; i < 10; i++) {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      usuarios.push({
        correo: faker.internet.email(firstName, lastName),
        clave,
        nombres: `${firstName} ${lastName}`,
        apellidoPaterno: firstName,
        apellidoMaterno: lastName,
        descripcion: faker.lorem.words(5),
        urlImagen: 'https://lorempokemon.fakerapi.it/pokemon/200/280',
        activo: i % 2 === 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        idRol: (i % 2) + 1
      });
    }
    await queryInterface.bulkInsert('Usuarios', usuarios, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Usuarios', null, {});
  }
};
