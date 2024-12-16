/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-unused-expressions */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
const chai = require('chai');
const sinon = require('sinon');

const { expect } = chai;
const { Indicador, Historico } = require('../../models');
const { server } = require('../../../app');
const { anIndicador, indicadorToCreate, aFormula, aVariable, anHistorico, aMapa } = require('../../utils/factories');
const IndicadorService = require('../../services/indicadorService');
const { FRONT_PATH, SITE_PATH } = require('../../middlewares/determinePathway');

describe('Indicador service', function () {

  const indicadores = [anIndicador(1), anIndicador(2)];

  this.afterEach(function () {
    sinon.restore();
  });

  describe('Read operations', function () {
    it('Should return a list of indicadores and the total number of them', function () {
      const findAndCountAllFake = sinon.fake.resolves({ rows: indicadores, count: indicadores.length });
      sinon.replace(Indicador, 'findAndCountAll', findAndCountAllFake);
      return IndicadorService.getIndicadores(1, 15, { idTema: 15 }, SITE_PATH)
        .then(res => {
          expect(findAndCountAllFake.calledOnce).to.be.true;
          expect(res.indicadores).to.be.an('array').that.is.not.empty;
          expect(res.total).to.equal(indicadores.length);
        });
    });

    it('Should return an indicador', function () {
      const findOneFake = sinon.fake.resolves({ ...anIndicador(1) });
      sinon.replace(Indicador, 'findOne', findOneFake);
      return IndicadorService.getIndicador(1, SITE_PATH)
        .then(res => {
          expect(findOneFake.args[0][0].where.id).to.be.equal(1);
          expect(findOneFake.calledOnce).to.be.true;
          expect(res).to.not.be.null;
        })
    });

    it('Should reject promise if an error occurs', function () {
      const findAndCountAllFake = sinon.fake.rejects(new Error());
      sinon.replace(Indicador, 'findAndCountAll', findAndCountAllFake);
      return IndicadorService.getIndicadores(1, 15, { idTema: 15 }, SITE_PATH)
        .catch(err => {
          expect(findAndCountAllFake.calledOnce).to.be.true;
          expect(err).to.not.be.null;
        });
    });

    it('Returns null if no indicador is found', function () {
      const findOneFake = sinon.fake.resolves(null);
      sinon.replace(Indicador, 'findOne', findOneFake);
      return IndicadorService.getIndicador(1, FRONT_PATH)
        .then(res => {
          expect(res).to.be.null;
          expect(findOneFake.calledOnce).to.be.true;
          expect(findOneFake.args[0][0]).to.not.be.null;
        });
    });

    it('Should return the id of the indicador related to a model', () => {
      const findOneFake = sinon.fake.resolves({ indicadorId: 1 })
      sinon.replace(Historico, 'findOne', findOneFake);
      return IndicadorService.getIdIndicadorRelatedTo(Historico, 16)
        .then(res => {
          expect(res).to.not.be.null;
          expect(res).to.be.a('number');
        })
    })

    it('Fails to return the id of the indicador related to a model', () => {
      const findOneFake = sinon.fake.rejects(new Error('Something went wrong'));
      sinon.replace(Historico, 'findOne', findOneFake);
      return IndicadorService.getIdIndicadorRelatedTo(Historico, 16)
        .catch(err => {
          expect(err).to.not.be.null;
          expect(err.message).to.be.equals('Something went wrong')
        })
    })

  });

  describe('Create operations', function () {
    it('Should create an indicador with no errors', function () {
      const indicadorDummy = anIndicador(1);
      const createFake = sinon.fake.resolves({ dataValues: indicadorDummy });
      sinon.replace(Indicador, 'create', createFake);
      return IndicadorService.createIndicador(indicadorDummy)
        .then(res => {
          expect(res).to.not.be.undefined;
          expect(createFake.calledOnce).to.be.true;
        });
    });

    it('Should not create indicador, because connection to DB failed', function () {
      const indicadorDummy = anIndicador(1);
      const createFake = sinon.fake.rejects(new Error('Connection to DB failed'));
      sinon.replace(Indicador, 'create', createFake);
      return IndicadorService.createIndicador(indicadorDummy)
        .then(res => {
          expect(res).to.be.null;
        })
        .catch(err => {
          expect(err).to.not.be.undefined;
          expect(createFake.calledOnce).to.be.true;
        });
    });

    it('Should not create indicador, because it has constraint errors', function () {
      const indicadorDummy = anIndicador(1);
      const createFake = sinon.fake.rejects(new Error('Constraint Error'));
      sinon.replace(Indicador, 'create', createFake);
      return IndicadorService.createIndicador(indicadorDummy)
        .then(res => {
          expect(res).to.be.null;
        })
        .catch(err => {
          expect(err).to.not.be.undefined;
          expect(createFake.calledOnce).to.be.true;
        });
    });

    it('Should create indicador with a formula and variables', function () {
      const toCreate = indicadorToCreate();
      const formula = aFormula(1);
      formula.variables = [aVariable(), aVariable()];
      toCreate.formula = formula;
      const createFake = sinon.fake.resolves(anIndicador(1));
      sinon.replace(Indicador, 'create', createFake);
      return IndicadorService.createIndicador(toCreate)
        .then(res => {
          expect(res).to.not.be.undefined;
          expect(createFake.calledOnce).to.be.true;
        });
    });

    it('Should fail to create an indicador', function () {
      const toCreate = indicadorToCreate();
      const createFake = sinon.fake.rejects(new Error('Formula Constraint Error'));
      sinon.replace(Indicador, 'create', createFake);
      return IndicadorService.createIndicador(toCreate)
        .then(res => {
          expect(res).to.be.null;
        })
        .catch(err => {
          expect(err).to.not.be.undefined;
          expect(createFake.calledOnce).to.be.true;
          expect(err.message).to.contain('Formula Constraint Error')
        });
    });

    it('Should create indicador with historicos', function () {
      const toCreate = indicadorToCreate();
      toCreate.historicos = [anHistorico(), anHistorico()];
      const createFake = sinon.fake.resolves(anIndicador(1));
      sinon.replace(Indicador, 'create', createFake);
      return IndicadorService.createIndicador(toCreate)
        .then(res => {
          expect(res).to.not.be.undefined;
          expect(createFake.calledOnce).to.be.true;
        });
    });

    it('Should create indicador with mapa', function () {
      const toCreate = indicadorToCreate();
      toCreate.mapa = aMapa();
      const createFake = sinon.fake.resolves(anIndicador(1));
      sinon.replace(Indicador, 'create', createFake);
      return IndicadorService.createIndicador(toCreate)
        .then(res => {
          expect(res).to.not.be.undefined;
          expect(createFake.calledOnce).to.be.true;
        });
    });

    it('Should create indicador with every model embedded', function () {
      this.timeout(5000);
      const toCreate = indicadorToCreate();
      const formula = aFormula(1);
      formula.variables = [aVariable(), aVariable()];
      toCreate.formula = formula;
      toCreate.historicos = [anHistorico(), anHistorico()];
      toCreate.mapa = aMapa();
      const createFake = sinon.fake.resolves(anIndicador(1));
      sinon.replace(Indicador, 'create', createFake);
      return IndicadorService.createIndicador(toCreate)
        .then(res => {
          expect(res).to.not.be.undefined;
          expect(createFake.calledOnce).to.be.true;
        });

    });
  });

  describe('Update operations', function () {
    const indicador = indicadorToCreate();
    it('Should update indicador', function () {
      const updateFake = sinon.fake.resolves(1);
      sinon.replace(Indicador, 'update', updateFake);
      return IndicadorService.updateIndicador(1, indicador)
        .then(res => {
          expect(res).to.not.be.undefined;
          expect(updateFake.calledOnce).to.be.true;
        });
    });

    it('Should not update indidcador due to DB connection error', function () {
      const updateFake = sinon.fake.rejects(new Error('Connection to DB failed'));
      sinon.replace(Indicador, 'update', updateFake);
      return IndicadorService.updateIndicador(1, indicador)
        .catch(err => {
          expect(err).to.not.be.undefined;
          expect(updateFake.calledOnce).to.be.true;
        });
    });

    it('Should not update indidcador due to validation errors', function () {
      const updateFake = sinon.fake.rejects(new Error('Validation Error'))
      sinon.replace(Indicador, 'update', updateFake);
      return IndicadorService.updateIndicador(1, indicadorToCreate)
        .catch(err => {
          expect(err).to.not.be.undefined;
          expect(updateFake.calledOnce).to.be.true;
        });
    });

  });

});


