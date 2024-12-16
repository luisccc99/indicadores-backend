const chai = require('chai');
const chaiHttp = require('chai-http')
chai.use(chaiHttp);
const expect = chai.expect;
const { app, server } = require('../../../app');
const { Tema } = require('../../models');
const sinon = require('sinon');
const { aTema } = require('../../utils/factories');
const TemaService = require('../../services/temaService');
const faker = require('faker');

describe('Tema service', function () {
    afterEach(function () {
        sinon.restore();
    });
    
    describe('Read operations', function () {
        const temas = [aTema(1), aTema(2), aTema(3)];
        it('Should return a list of temas and the total number of them', function () {
            const findAndCountAllFake = sinon.fake.resolves({ rows: temas, count: temas.length });
            sinon.replace(Tema, 'findAndCountAll', findAndCountAllFake);
            const countFake = sinon.fake.resolves(temas.length);
            sinon.replace(Tema, 'count', countFake);
            return TemaService.getAllTemas(1, 3, { temaIndicador: 'lorem' })
                .then(res => {
                    expect(findAndCountAllFake.calledOnce).to.be.true;
                    expect(res.temas).to.be.an('array').that.is.not.empty;
                    expect(res.total).to.equal(temas.length);
                })
        });

        it('Should return an empty array if not temas were found');

        it('Should return an error if getAllTemas fails to retrieve data', function () {
            const findAndCountAllFake = sinon.fake.rejects(new Error());
            sinon.replace(Tema, 'findAndCountAll', findAndCountAllFake);
            return TemaService.getAllTemas(1, 3, { temaIndicador: 'lorem' })
                .then(res => {
                    expect(res).to.be.null;
                })
                .catch(err => {
                    expect(findAndCountAllFake.calledOnce).to.be.true;
                    expect(err).to.not.be.null;
                });
        })

        it('Should return the count of inactive temas', function () {
            const countInactiveFake = sinon.fake.resolves(temas.length);
            sinon.replace(Tema, 'count', countInactiveFake);
            return TemaService.countTemas()
                .then(res => {
                    expect(countInactiveFake.calledOnce).to.be.true;
                    expect(res).to.equal(temas.length);
                });
        });

        it('Should fail to retrieve the count of inactive temas', function () {
            const countInactiveFake = sinon.fake.rejects(new Error());
            sinon.replace(Tema, 'count', countInactiveFake);
            return TemaService.countTemas()
                .then(res => {
                    expect(res).to.be.null;
                })
                .catch(err => {
                    expect(countInactiveFake.calledOnce).to.be.true;
                    expect(err).to.not.be.null;
                });
        });

    })

    describe('Create operations', function () {
        it('Should create a new Tema and show its data', function () {
            const temaFake = aTema(1);
            const createOneFake = sinon.fake.resolves(temaFake);
            sinon.replace(Tema, 'create', createOneFake);
            const createdTema = TemaService.addTema(temaFake);
            expect(createOneFake.calledOnce).to.be.true;
            expect(createdTema).is.not.null;
        });

        it('Should return true if temaIndicador already exists', function () {
            const findOneFake = sinon.fake.resolves(aTema(1));
            sinon.replace(Tema, 'findOne', findOneFake);
            return TemaService.isTemaIndicadorAlreadyInUse(aTema(1).temaIndicador)
                .then(res => {
                    expect(findOneFake.calledOnce).to.be.true;
                    expect(res).to.be.true;
                });
        });

        it('Should return false if temaIndicador does not exist', function () {
            const findOneFake = sinon.fake.resolves(null);
            sinon.replace(Tema, 'findOne', findOneFake);
            return TemaService.isTemaIndicadorAlreadyInUse(aTema(1).temaIndicador)
                .then(res => {
                    expect(findOneFake.calledOnce).to.be.true;
                    expect(res).to.be.false;
                });
        });

        it('Should not create a Tema because of internal error', function () {
            const createOneFake = sinon.fake.throws('Error');
            sinon.replace(Tema, 'create', createOneFake);
            return TemaService.addTema(aTema(1))
                .catch(err => {
                    expect(createOneFake.calledOnce).to.be.true;
                    expect(err).to.be.an('error');
                });
        })
    });

    describe('Update operations', function () {
        it('Should update a Tema\'s temaIndicador', function () {
            const updateTema = faker.random.word();
            const updateFake = sinon.fake.resolves(1);
            sinon.replace(Tema, 'update', updateFake);
            return TemaService.updateTema(aTema(1).id, { temaIndicador: updateTema })
                .then(res => {
                    expect(updateFake.calledOnce).to.be.true;
                    expect(res).to.be.true;
                });
        });

        it('Should update an entire Tema', function () {
            const updateTema = aTema(2);
            const updateFake = sinon.fake.resolves(1);
            sinon.replace(Tema, 'update', updateFake);
            return TemaService.updateTema(aTema(1).id, updateTema)
                .then(res => {
                    expect(updateFake.calledOnce).to.be.true;
                    expect(res).to.be.true;
                });
        });

        it('Should not update a Tema due to internal error', function () {
            const updateFake = sinon.fake.throws('Error');
            sinon.replace(Tema, 'update', updateFake);
            return TemaService.updateTema(aTema(1).id, aTema(1))
                .catch(err => {
                    expect(updateFake.calledOnce).to.be.true;
                    expect(err).to.be.an('error');
                });
        });

        it('Should update a Tema status', function () {
            const findOneFake = sinon.fake.resolves(aTema(1));
            const updateFake = sinon.fake.resolves(1);
            sinon.replace(Tema, 'findOne', findOneFake);
            sinon.replace(Tema, 'update', updateFake);
            return TemaService.updateTemaStatus(aTema(1).id, { status: 'inactive' })
                .then(res => {
                    expect(findOneFake.calledOnce).to.be.true;
                    expect(updateFake.calledOnce).to.be.true;
                    expect(res).to.be.true;
                }
                );
        });

        it('Should not update a Tema status due to internal error', function () {
            const findOneFake = sinon.fake.resolves(aTema(1));
            const updateFake = sinon.fake.throws('Error');
            sinon.replace(Tema, 'findOne', findOneFake);
            sinon.replace(Tema, 'update', updateFake);
            return TemaService.updateTemaStatus(aTema(1).id, { status: 'inactive' })
                .catch(err => {
                    expect(findOneFake.calledOnce).to.be.true;
                    expect(updateFake.calledOnce).to.be.true;
                    expect(err).to.be.an('error');
                });
        });
    });

});