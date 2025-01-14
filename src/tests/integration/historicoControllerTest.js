const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
require('dotenv').config();
chai.use(chaiHttp);
const { expect } = chai;
const { app } = require('../../../app');

const { someHistoricos, } = require('../../utils/factories');
const { TOKEN_SECRET } = process.env;

describe('v1/historicos', function () {
  const historicos = someHistoricos(1);
  const validToken = jwt.sign({ sub: 1 }, TOKEN_SECRET, { expiresIn: '5h' });

  this.afterEach(function () {
    sinon.restore();
  });

  describe('GET /historicos', function () {
    it('Should return a list of historicos with an INNER JOIN from indicadores', function () {

      chai.request(app)
        .get('/api/v1/historicos/1')
        .set('Authorization', `Bearer ${validToken}`)
        .then(res => {
          expect(res.body.historicos).to.be.an('array').that.is.not.empty;
          expect(res.body.total).to.equal(historicos.length);
        });
    });
  });

  describe('DELETE /historicos/:id', function () {
    it('Should delete an historico', function () {
      chai.request(app)
        .delete('/api/v1/historicos/1')
        .set('Authorization', `Bearer ${validToken}`)
        .then(res => {
          expect(res.body).to.be.true;
        });
    });

    it('Should not delete an historico due to invalid token', function () {
      chai.request(app)
        .delete('/api/v1/historicos/1')
        .then(res => {
          expect(res.body).to.be.false;
        });
    });

  });
});