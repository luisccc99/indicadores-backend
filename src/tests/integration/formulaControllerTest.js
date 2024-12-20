const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
require('dotenv').config();
chai.use(chaiHttp);
const { expect } = chai;
const { app } = require('../../../app');
const { generateToken } = require('../../middlewares/auth');
const { Usuario, Formula, Variable, UsuarioIndicador } = require('../../models');
const { aVariable } = require('../../utils/factories');

describe('v1/formulas', function () {
  const SUB_ID = 1;
  const validToken = generateToken({ sub: SUB_ID });
  const adminRol = { rolValue: 'ADMIN' };
  const userRol = { rolValue: 'USER' };
  const statusActive = { activo: 'SI' };

  let usuarioStub;

  this.beforeEach(function () {
    usuarioStub = sinon.stub(Usuario, 'findOne');
    usuarioStub.onFirstCall().resolves(statusActive);
    usuarioStub.onSecondCall().resolves(adminRol);
  });

  this.afterEach(function () {
    sinon.restore();
  });


  describe('PATCH /formulas/:idFormula', function () {
    it('Should update fields of a formula', function (done) {

      chai.request(app)
        .patch('/api/v1/formulas/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ecuacion: 'new ecuacion', descripcion: 'new descripcion' })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(204);
          done();
        });
    });

    it('Should fail to update formula because it does not exist', function (done) {

      chai.request(app)
        .patch('/api/v1/formulas/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ecuacion: 'new ecuacion', descripcion: 'new descripcion' })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(404);
          done();
        });
    });

    it('Should fail to update formula due to validation errors', function (done) {
      chai.request(app)
        .patch('/api/v1/formulas/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ecuacion: 'Otros medios', descripcion: 'new one', isFormula: false })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(422);
          expect(res.body.errors).to.be.an('array').that.is.not.empty;
          done();
        });
    });

    it('Should fail to update formula because user is not assigned to it', done => {
      chai.request(app)
        .patch('/api/v1/formulas/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ecuacion: 'new ecuacion', descripcion: 'new descripcion' })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(403);
          done();
        });
    })

  });


  describe('POST /formulas/:idFormula/variables', function () {

    it('Should add variables to a formula', function (done) {
      chai.request(app)
        .post('/api/v1/formulas/1/variables')
        .set('Authorization', `Bearer ${validToken}`)
        .send(formulaWithVariables)
        .end((err, res) => {
          expect(res).to.have.status(201);
          done()
        })
    });

    it('Should fail to add variables to a formula that does not exist', function (done) {
      chai.request(app)
        .post('/api/v1/formulas/1/variables')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ variables: [aVariable()] })
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        })
    });

    it('Should fail to add a variable due to validation errors', function (done) {
      const badVariable = { ...aVariable(), dato: 'not valid', anio: 3000, idUnidad: 'wrong' };
      chai.request(app)
        .post('/api/v1/formulas/8/variables')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ variables: [badVariable] })
        .end((err, res) => {
          expect(res).to.have.status(422);
          expect(res.body.errors).to.be.an('array').that.is.not.empty;
          done();
        });
    });

  });
});