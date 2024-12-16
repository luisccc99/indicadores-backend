const chai = require('chai');
const sinon = require('sinon');

const { expect } = chai;

const { Historico } = require('../../models');

const HistoricoService = require('../../services/historicoService');
const { server } = require('../../../app');
const { someHistoricos } = require('../../utils/factories');

describe('Historicos service', function () {
    const historicos = someHistoricos(1);

    this.afterEach(function () {
        sinon.restore();
    });

    describe('Read operations', function () {
        it('Should return a list of historicos with an INNER JOIN from indicadores', function () {
            const findAndCountALlFake = sinon.fake.resolves({ rows: historicos, count: historicos.length });
            sinon.replace(Historico, 'findAndCountAll', findAndCountALlFake);
            return HistoricoService.getHistoricos(1, 1, 1, { temaIndicador: 'lorem' })
                .then(res => {
                    expect(findAndCountALlFake.calledOnce).to.be.true;
                    expect(res.historicos).to.be.an('array').that.is.not.empty;
                    expect(res.total).to.equal(historicos.length);
                });
        });

        it('Should not return any historicos at all', function () {
            const findAndCountALlFake = sinon.fake.resolves({ rows: [], count: 0 });
            sinon.replace(Historico, 'findAndCountAll', findAndCountALlFake);
            return HistoricoService.getHistoricos(1, 1, 1, { temaIndicador: 'lorem' })
                .then(res => {
                    expect(findAndCountALlFake.calledOnce).to.be.true;
                    expect(res.historicos).to.be.an('array').that.is.empty;
                    expect(res.total).to.equal(0);
                });
        });
    });

    describe('Delete operations', function () {
        it('Should delete an historico', function () {
            const destroyFake = sinon.fake.resolves(true);
            sinon.replace(Historico, 'destroy', destroyFake);
            return HistoricoService.deleteHistorico(1)
                .then(res => {
                    expect(destroyFake.calledOnce).to.be.true;
                    expect(res).to.be.true;
                });
        });

        it('Should not delete an historico', function () {
            const destroyFake = sinon.fake.resolves(false);
            sinon.replace(Historico, 'destroy', destroyFake);
            return HistoricoService.deleteHistorico(1)
                .then(res => {
                    expect(destroyFake.calledOnce).to.be.true;
                    expect(res).to.be.false;
                });
        });
    });

    describe('Update operations', function () {
        it('Should update an historico', function () {
            const updateFake = sinon.fake.resolves(true);
            sinon.replace(Historico, 'update', updateFake);
            return HistoricoService.updateHistorico(1, { valor: 'lorem' })
                .then(res => {
                    expect(updateFake.calledOnce).to.be.true;
                    expect(res).to.be.true;
                });
        });

        it('Should not update an historico', function () {
            const updateFake = sinon.fake.resolves(false);
            sinon.replace(Historico, 'update', updateFake);
            return HistoricoService.updateHistorico(1, { valor: 'lorem' })
                .then(res => {
                    expect(updateFake.calledOnce).to.be.true;
                    expect(res).to.be.false;
                });
        });

    });

})