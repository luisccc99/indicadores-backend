/* eslint-disable func-names */
/* eslint-disable no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow-callback */
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const jwt = require('jsonwebtoken')
const { app } = require('../../../app');
const { Usuario } = require('../../models');
const { aUser } = require('../../utils/factories');
require('dotenv').config();

chai.use(chaiHttp);
const { expect } = chai;
const { TOKEN_SECRET } = process.env;


describe('v1/me', function () {
  const token = jwt.sign({ sub: 1 }, TOKEN_SECRET, { expiresIn: '5h' });

  this.afterEach(function () {
    sinon.restore();
  });

  describe('/', function () {
    it('Should return the profile information of a user with a token', function (done) {
      const findOneFake = sinon.stub(Usuario, 'findOne');
      findOneFake.onFirstCall().resolves({ activo: 'SI' });
      findOneFake.onSecondCall().resolves(aUser(1));
      chai.request(app)
        .get('/api/v1/me')
        .set({ Authorization: `Bearer ${token}` })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(findOneFake.calledTwice).to.be.true;
          expect(res.body.data).to.not.be.empty;
          done();
        });
    });

    it('Should not return the information of a user because token expired', function (done) {
      chai.request(app)
        .get('/api/v1/me')
        .set({ Authorization: 'Bearer notvalid' })
        .end((err, res) => {
          expect(res).to.have.status(403)
          done();
        });
    });

    it('Should return not authorized if token is not present', function (done) {
      chai.request(app)
        .get('/api/v1/me')
        .end((err, res) => {
          expect(res).to.have.status(401)
          done();
        });
    });
  });

  it('Should fail to return profile information because user is not active', function (done) {
    const fakeFindOne = sinon.fake.resolves({ activo: 'NO' });
    sinon.replace(Usuario, 'findOne', fakeFindOne);
    chai.request(app)
      .get('/api/v1/me')
      .set({ Authorization: `Bearer ${token}` })
      .end((err, res) => {
        expect(fakeFindOne.calledOnce).to.be.true;
        expect(res).to.have.status(403);
        expect(res.error.text).to.be.equals('Esta cuenta se encuentra deshabilitada');
        done();
      })
  })

});