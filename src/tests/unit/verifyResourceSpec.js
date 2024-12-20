const sinon = require('sinon');
const chai = require('chai')
const { expect } = chai;
const { verifyResourceExists } = require('../../middlewares/resourceExists');
const { Indicador, Historico } = require('../../models');

describe.only('Resource exists middleware (Unit Tests)', () => {

  let req, res, next;
  let statusStub, jsonStub;
  const idIndicador = 1;
  beforeEach(() => {
    statusStub = sinon.stub().returnsThis();
    jsonStub = sinon.stub();
    next = sinon.stub();
    req = {
      matchedData: { idIndicador }
    };
    res = {
      status: statusStub,
      json: jsonStub
    };
  })

  afterEach(() => {
    sinon.restore();
  })

  it('Should return 404 because resource was not found', () => {
    const findOneIndicador = sinon.fake.resolves(null)
    sinon.replace(Indicador, 'findOne', findOneIndicador);

    const middleware = verifyResourceExists({ routeParam: 'idIndicador', model: 'Indicador' });
    return middleware(req, res, next)
      .then(() => {
        expect(findOneIndicador.calledOnce, 'findOne CalledOnce').to.be.true;
        expect(next.calledOnce, 'next calledOnce').to.be.false;
        expect(statusStub.calledOnceWith(404), 'status stub').to.be.true;
        expect(jsonStub.calledOnceWith(sinon.match({
          status: 404,
          message: 'No se encontró el elemento (Indicador) con id "1"'
        })), 'json stub called once with').to.be.true;
      })
  });

  it('Should return 409 because resource is not active', () => {
    const findOneIndicador = sinon.fake.resolves({ id: idIndicador, activo: false });
    sinon.replace(Indicador, 'findOne', findOneIndicador);

    const middleware = verifyResourceExists({ routeParam: 'idIndicador', model: 'Indicador', isActivo: true });
    return middleware(req, res, next)
      .then(() => {
        expect(findOneIndicador.calledOnce, 'findOne CalledOnce').to.be.true;
        expect(next.calledOnce, 'next calledOnce').to.be.false;
        expect(statusStub.calledOnceWith(409), 'status stub').to.be.true;
        expect(jsonStub.calledOnceWith(sinon.match({
          status: 409,
          message: `"Indicador" con id "${idIndicador}" se encuentra inactivo`
        })), 'json stub called once with').to.be.true;

      })
  });

  it('Should fail because resource does not have "activo" boolean field', () => {
    const err = new Error('Model does not have activo field')
    const findOneHistorico = sinon.fake.rejects(err);
    sinon.replace(Historico, 'findOne', findOneHistorico);

    const middleware = verifyResourceExists({ routeParam: 'idHistorico', model: 'Historico', isActivo: true });
    return middleware(req, res, next)
      .then(() => {
        expect(next.calledOnceWith(err), 'next calledOnce').to.be.true;
      })
  });

  it('Should call next middleware if resource is activo and exists', () => {
    const findOneIndicador = sinon.fake.resolves({ id: idIndicador, activo: true });
    sinon.replace(Indicador, 'findOne', findOneIndicador);

    const middleware = verifyResourceExists({ routeParam: 'idIndicador', model: 'Indicador', isActivo: true });
    return middleware(req, res, next)
      .then(() => {
        expect(next.calledOnce, 'next calledOnce').to.be.true;
      })
  })
})