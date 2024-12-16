/* eslint-disable no-unused-expressions */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable import/no-extraneous-dependencies */
const chai = require('chai');
const { faker } = require('@faker-js/faker');
const sinon = require('sinon');
const UsuarioService = require('../../services/usuariosService');

const { expect } = chai;
const { Usuario } = require('../../models');
const { aUser, anIndicador } = require('../../utils/factories');

describe('User service', function () {

    const usuario = aUser(faker.number.int());
    const indicadoresFromUser = [
        anIndicador(1),
        anIndicador(2),
        anIndicador(3),
        anIndicador(4),
    ];

    this.afterEach(function () {
        sinon.restore();
    });
    describe('Read operations', function () {
        const userList = [aUser(1), aUser(2), aUser(3)]

        it('Should return a user with a given id', function () {
            const findOneIdFake = sinon.fake.resolves(usuario);
            sinon.replace(Usuario, 'findOne', findOneIdFake);
            return UsuarioService.getUsuarioById(usuario.id)
                .then(existingUsuario => {
                    expect(findOneIdFake.calledOnce).to.be.true;
                    expect(existingUsuario).to.not.be.null;
                    expect(existingUsuario.id).to.equal(usuario.id);
                });
        });

        it('Should return a user with a given correo', function () {
            const findOneCorreoFake = sinon.fake.resolves(usuario);
            sinon.replace(Usuario, 'findOne', findOneCorreoFake);
            return UsuarioService.getUsuarioByCorreo(usuario.correo)
                .then(existingUser => {
                    expect(existingUser).to.not.be.null;
                    expect(findOneCorreoFake.calledOnce).to.be.true;
                });
        });

        it('Should return null if user does not exist', function () {
            const findOneReturnNull = sinon.fake.resolves(null);
            sinon.replace(Usuario, 'findOne', findOneReturnNull);
            return UsuarioService.getUsuarioById(0)
                .then(user => {
                    expect(user).to.be.null;
                    expect(findOneReturnNull.calledOnce).to.be.true;
                });
        });

        it('Should return a list of users', function () {
            const findAndCountAllFake = sinon.fake.resolves({ rows: userList, count: userList.length })
            sinon.replace(Usuario, 'findAndCountAll', findAndCountAllFake);
            return UsuarioService.getUsuarios()
                .then(res => {
                    expect(findAndCountAllFake.calledOnce).to.be.true;
                    expect(res).to.not.be.null;
                    expect(res.usuarios).to.be.an('array');
                    expect(res.total).to.equal(userList.length);
                });
        });

        it('Should return true if correo is already in use', function () {
            const findOneFake = sinon.fake.resolves(usuario);
            sinon.replace(Usuario, 'findOne', findOneFake);
            return UsuarioService.isCorreoAlreadyInUse(usuario.correo)
                .then(res => {
                    expect(findOneFake.calledOnce).to.be.true;
                    expect(res).to.be.true;
                    expect(res).to.not.be.null;
                });
        });

        it('Should return the rol of a user', function () {
            const findOneFake = sinon.fake.resolves({ rolValue: 'ADMIN' });
            sinon.replace(Usuario, 'findOne', findOneFake);
            return UsuarioService.getRol(1)
                .then(res => {
                    expect(findOneFake.calledOnce).to.be.true;
                    expect(res).to.equal('ADMIN');
                })
        })

        it('Should fail when returnin a rol', function () {
            const findOneFake = sinon.fake.rejects(new Error('Connection to DB failed'));
            sinon.replace(Usuario, 'findOne', findOneFake);
            return UsuarioService.getRol(1)
                .catch(err => {
                    expect(err, 'err is not null').to.not.be.null;
                    expect(findOneFake.calledOnce, 'find one fake was called once').to.be.true;
                })
        });

        it('Should return a list of users based on a search query', function () {
            const findAndCountAllFake = sinon.fake.resolves({ rows: userList, count: userList.length });
            sinon.replace(Usuario, 'findAndCountAll', findAndCountAllFake);
            return UsuarioService.getUsuarios(25, 0, 'john')
                .then(res => {
                    expect(findAndCountAllFake.calledOnce).to.be.true;
                    expect(res.usuarios).to.be.an('array');
                    expect(res.total).to.equal(userList.length);
                });
        });


        describe('Indicadores from a user', function () {
            it('Should return a list of indicadores from an user', function () {
                const findOneFake = sinon.fake.resolves(
                    {
                        dataValues: {
                            indicadores: indicadoresFromUser,
                            total: indicadoresFromUser.length
                        }
                    });
                sinon.replace(Usuario, 'findOne', findOneFake);
                return UsuarioService.getIndicadoresFromUser(1)
                    .then(res => {
                        expect(res).to.not.be.null;
                        expect(findOneFake.calledOnce).to.be.true;
                        expect(res.indicadores).to.be.an('array').that.is.not.empty;
                        expect(res.total).to.equal(indicadoresFromUser.length);
                    });
            });

            it('Should not return a list of indicadores from an user', function () {
                const findOneFake = sinon.fake.rejects(new Error('Connection to DB failed'));
                sinon.replace(Usuario, 'findOne', findOneFake);
                return UsuarioService.getIndicadoresFromUser(1)
                    .catch(err => {
                        expect(findOneFake.calledOnce).to.be.true;
                        expect(err).to.not.be.null;
                    });
            });

        });

    });

    describe('Create operations', function () {
        it('Should insert user without errors', async function () {
            const userRes = {
                nombres: usuario.nombres,
                correo: usuario.correo,
                apellidoPaterno: usuario.apellidoPaterno,
                apellidoMaterno: usuario.apellidoMaterno,
                idRol: usuario.idRol
            }
            const createFake = sinon.fake.resolves(userRes);
            sinon.replace(Usuario, 'create', createFake)
            const createdUser = await UsuarioService.addUsuario(usuario);
            expect(createFake.calledOnce).to.be.true;
            expect(createdUser).is.not.null;
            expect(createdUser.nombres).to.equal(usuario.nombres);

        });

        it('Should raise an error if apellidoPaterno field is missing', async function () {
            const createThrowsFake = sinon.fake.throws();
            sinon.replace(Usuario, 'create', createThrowsFake);
            try {
                UsuarioService.addUsuario(null);
            } catch (err) {
                expect(createThrowsFake.calledOnce).to.be.true;
                expect(err).to.be.not.be.null;
            }
        });
    });

    describe('Update operations', function () {
        it('Should update user\'s name', function () {
            const updatedName = faker.name.firstName();
            const updateFake = sinon.fake.resolves(1);
            sinon.replace(Usuario, 'update', updateFake);
            return UsuarioService.updateUsuario(usuario.id, { nombres: updatedName })
                .then(res => {
                    expect(updateFake.calledOnce).to.be.true;
                    expect(res).to.be.true;
                });
        });

        it('Should not affect any row with invalid fields', function () {
            const updateFake = sinon.fake.resolves(0);
            sinon.replace(Usuario, 'update', updateFake);
            return UsuarioService.updateUsuario(usuario.id, { invalid: true })
                .then(res => {
                    expect(updateFake.calledOnce).to.be.true;
                    expect(res).to.be.false;
                });
        });
    });
});