const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');

require('dotenv').config();

chai.use(chaiHttp);
const { expect } = chai;
const { Usuario, Mapa, UsuarioIndicador } = require('../../models');
const { aMapa } = require('../../utils/factories');
const { app } = require('../../../app');
const { generateToken } = require('../../middlewares/auth');

describe('v1/mapas', function () {
  const SUB_ID = 1;
  const validToken = generateToken({ sub: SUB_ID });
  const statusActive = { activo: 'SI' };
  const adminRol = { rolValue: 'ADMIN' };
  const userRol = { rolValue: 'USER' };

  let findOneFake;

  this.beforeEach(function () {
    findOneFake = sinon.stub(Usuario, 'findOne')
    findOneFake.onFirstCall().resolves(statusActive);
    findOneFake.onSecondCall().resolves(adminRol);
  });

  this.afterEach(function () {
    sinon.restore();
  })

  describe('PUT /mapas', () => {
    const mapa = aMapa();

    it('Should update a mapa with a given id', done => {
      const updateMapaFake = sinon.fake.resolves(1);
      sinon.replace(Mapa, 'update', updateMapaFake);

      const findOneMapa = sinon.fake.resolves({ count: 1 });
      sinon.replace(Mapa, 'findOne', findOneMapa);

      chai.request(app)
        .put('/api/v1/mapas/1')
        .set('Authorization', `Bearer ${validToken}`)
        .type('form')
        .field('ubicacion', mapa.ubicacion)
        .field('url', mapa.url)
        .attach('urlImagen', Buffer.alloc(500_000), 'image.jpg')
        .end((err, res) => {
          expect(res).to.have.status(204);
          expect(updateMapaFake.calledOnce).to.be.true;
          expect(findOneMapa.calledOnce).to.be.true;
          done();
        })
    });

    it('Should fail because request has no JWT', done => {
      chai.request(app)
        .put('/api/v1/mapas/1')
        .type('form')
        .field('ubicacion', mapa.ubicacion)
        .field('url', mapa.url)
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        })
    });

    it('Should fail because request body has validation errors', done => {
      chai.request(app)
        .put('/api/v1/mapas/1')
        .set('Authorization', `Bearer ${validToken}`)
        .type('form')
        .field('ubicacion', mapa.ubicacion)
        .field('url', 'not a url pattern')
        .attach('urlImagen', Buffer.alloc(500_000), 'image.jpg')
        .end((err, res) => {
          expect(res).to.have.status(422);
          done();
        })
    });
    it('Should fail because mapa does not exist', done => {
      const findOneMapa = sinon.fake.resolves({ count: 0 });
      sinon.replace(Mapa, 'findOne', findOneMapa);

      chai.request(app)
        .put('/api/v1/mapas/1')
        .set('Authorization', `Bearer ${validToken}`)
        .type('form')
        .field('ubicacion', mapa.ubicacion)
        .field('url', mapa.url)
        .attach('urlImagen', Buffer.alloc(500_000), 'image.jpg')
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(findOneMapa.calledOnce).to.be.true;
          done();
        })
    });
  })
})