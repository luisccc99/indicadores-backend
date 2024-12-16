const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
require('dotenv').config();
chai.use(chaiHttp);
const { expect } = chai;
const { app, server } = require('../../../app');
const { generateToken } = require('../../middlewares/auth');
const { aVariable } = require('../../utils/factories');
const { Usuario, Variable } = require('../../models');

describe('v1/variables', function () {
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

  describe('PATCH /variables/:idVariable', function () {

    it('Should update a variable succesfully', function (done) {
      const findOneVariable = sinon.fake.resolves({ count: 1 });
      sinon.replace(Variable, 'findOne', findOneVariable);
      const updateVariable = sinon.fake.resolves(1);
      sinon.replace(Variable, 'update', updateVariable);

      chai.request(app)
        .patch('/api/v1/variables/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send(aVariable())
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(204);
          expect(findOneVariable.calledOnce).to.be.true;
          expect(updateVariable.calledOnce).to.be.true;
          done();
        })
    });

    it('Should fail due to semantic errors', function (done) {
      chai.request(app)
        .patch('/api/v1/variables/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...aVariable(), anio: 3999, dato: 'invalid' })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(422);
          expect(res.body.errors).to.be.an('array').that.is.not.empty;
          done();
        })
    });

    it('Should fail to update because variable does not exist', function (done) {
      const findOneVariable = sinon.fake.resolves({ count: 0 });
      sinon.replace(Variable, 'findOne', findOneVariable);

      chai.request(app)
        .patch('/api/v1/variables/1')
        .set('Authorization', `Bearer ${validToken}`)
        .send(aVariable())
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(404);
          expect(findOneVariable.calledOnce).to.be.true;
          done();
        })

    })

    it('Should fail to update due to token validation', function (done) {
      chai.request(app)
        .patch('/api/v1/variables/5')
        .send(aVariable())
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(401)
          done();
        })
    })

  });


  describe('DELETE /variables/:idVariable', function () {

    it('Should delete a variable succesfully', function (done) {
      const findOneVariable = sinon.fake.resolves({ count: 1 });
      sinon.replace(Variable, 'findOne', findOneVariable);
      const destroyVariable = sinon.fake.resolves(1);
      sinon.replace(Variable, 'destroy', destroyVariable);
      chai.request(app)
        .delete('/api/v1/variables/7')
        .set('Authorization', `Bearer ${validToken}`)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(204);
          expect(findOneVariable.calledOnce).to.be.true;
          expect(destroyVariable.calledOnce).to.be.true;
          done();
        })
    });

    it('Should fail to delete due to token validation', function (done) {
      chai.request(app)
        .delete('/api/v1/variables/5')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(401)
          done();
        })
    })

    it('Should fail to delete because variable does not exist', function (done) {
      const findOneVariable = sinon.fake.resolves({ count: 0 });
      sinon.replace(Variable, 'findOne', findOneVariable);
      chai.request(app)
        .delete('/api/v1/variables/1020')
        .set('Authorization', `Bearer ${validToken}`)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(404);
          expect(findOneVariable.calledOnce).to.be.true;
          done();
        })
    })

  });

});