const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const { Indicador } = require('../../models');
const { app } = require('../../../app');
const sinon = require('sinon');
const { anIndicador, aTema } = require('../../utils/factories');

describe('v1/documentos', function () {
  const dummyIndicador = anIndicador(1);

  this.afterEach(function () {
    sinon.restore();
  });

  it('Should return an excel document', function (done) {
    const findOneFake = sinon.fake.resolves({ dataValues: { ...dummyIndicador, Tema: aTema(1) } });
    sinon.replace(Indicador, 'findOne', findOneFake);
    chai.request(app)
      .get('/api/v1/documentos/1/xlsx')
      .end(function (err, res) {
        expect(res).to.have.status(200);
        expect(res.header['content-type']).to.be.equal('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        expect(res.header['content-disposition']).to.have.string('attachment');
        expect(res.header['connection']).to.be.equal('close');
        done();
      });
  });

  it('Should not return an excel document', function (done) {
    const findOneFake = sinon.fake.rejects(dummyIndicador);
    sinon.replace(Indicador, 'findOne', findOneFake);
    chai.request(app)
      .get('/api/v1/documentos/1/xlsx')
      .end(function (err, res) {
        expect(res).to.have.status(500);
        done();
      });
  });

  it('Should return a csv document', function (done) {
    const findOneFake = sinon.fake.resolves(dummyIndicador);
    sinon.replace(Indicador, 'findOne', findOneFake);
    chai.request(app)
      .get('/api/v1/documentos/1/csv')
      .end(function (err, res) {
        expect(res).to.have.status(200);
        expect(res.header['content-type']).to.be.equal('text/csv; charset=utf-8');
        expect(res.header['content-disposition']).to.have.string('attachment');
        expect(res.header['connection']).to.be.equal('close');
        done();
      });
  });

  it('Should not return a csv document', function (done) {
    const findOneFake = sinon.fake.rejects(dummyIndicador);
    sinon.replace(Indicador, 'findOne', findOneFake);
    chai.request(app)
      .get('/api/v1/documentos/1/csv')
      .end(function (err, res) {
        expect(res).to.have.status(500);
        done();
      });
  });

  it('Should return a json document', function (done) {
    const findOneFake = sinon.fake.resolves(dummyIndicador);
    sinon.replace(Indicador, 'findOne', findOneFake);
    chai.request(app)
      .get('/api/v1/documentos/1/json')
      .end(function (err, res) {
        expect(res).to.have.status(200);
        expect(res.header['content-type']).to.be.equal('application/json; charset=utf-8');
        expect(res.header['content-disposition']).to.have.string('attachment');
        expect(res.header['connection']).to.be.equal('close');
        done();
      });
  });

  it('Should not return a json document', function (done) {
    const findOneFake = sinon.fake.rejects(dummyIndicador);
    sinon.replace(Indicador, 'findOne', findOneFake);
    chai.request(app)
      .get('/api/v1/documentos/1/json')
      .end(function (err, res) {
        expect(res).to.have.status(500);
        done();
      });
  });

  it('Should return 422 because of typo error', function (done) {
    const findOneFake = sinon.fake.resolves(dummyIndicador);
    sinon.replace(Indicador, 'findOne', findOneFake);
    chai.request(app)
      .get('/api/v1/documentos/1/xslx')
      .end(function (err, res) {
        expect(res).to.have.status(422);
        done();
      });
  });

})