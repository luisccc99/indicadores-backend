/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-unused-expressions */
/* eslint-disable func-names */
const chai = require('chai');
const chaiHttp = require('chai-http')
const sinon = require('sinon');
require('dotenv').config();

chai.use(chaiHttp);
const { expect } = chai;
const { app } = require('../../../app');
const { Tema, Usuario } = require('../../models');
const { aTema, aUser } = require('../../utils/factories');
const fileUpload = require('../../middlewares/fileUpload');
const { generateToken } = require('../../middlewares/auth');


describe('/temas', function () {
  const token = generateToken({ sub: 1 });
  const statusActive = { activo: true };

  const adminRol = { rolValue: 'ADMIN' };
  const userRol = { roles: 'USER' };

  describe('GET', function () {
    const temasFake = [aTema(1), aTema(2), aTema(3)];

    afterEach(function () {
      sinon.restore();
    });

    it('Should return a list of Temas', function (done) {
      const findAllFake = sinon.fake.resolves(temasFake);
      const countFake = sinon.fake.resolves(temasFake.length);

      sinon.replace(Tema, 'count', countFake);
      sinon.replace(Tema, 'findAll', findAllFake);
      chai.request(app)
        .get('/api/v1/temas')
        .end(function (err, res) {
          expect(res).to.have.status(200);
          expect(findAllFake.calledOnce).to.be.true;
          expect(res.body.data).to.have.lengthOf(temasFake.length);
          done();
        })
    });

    it('Should return a list of Temas with pagination', function (done) {
      const findAndCountAllFake = sinon.fake.resolves({ rows: temasFake, count: temasFake.length });
      const countFake = sinon.fake.resolves(temasFake.length);
      const findOneFake = sinon.fake.resolves(aUser(1));

      sinon.replace(Usuario, 'findOne', findOneFake);
      sinon.replace(Tema, 'count', countFake);
      sinon.replace(Tema, 'findAndCountAll', findAndCountAllFake);
      chai.request(app)
        .get('/api/v1/me/temas')
        .set('Authorization', `Bearer ${token}`)
        .end(function (err, res) {
          expect(findAndCountAllFake.calledOnce).to.be.true;
          expect(countFake.calledOnce).to.be.true;
          expect(findOneFake.calledOnce).to.be.true;
          expect(res).to.have.status(200);
          done();
        })
    })

    it('Should return status 500 if any error is found', function (done) {
      const findAllFake = sinon.fake.rejects(new Error('Testing error'));
      sinon.replace(Tema, 'findAll', findAllFake);
      chai.request(app)
        .get('/api/v1/temas')
        .end(function (err, res) {
          expect(findAllFake.calledOnce).to.be.true;
          expect(res).to.have.status(500);
          done();
        });
    });
  });

  describe('GET /:idTema', function () {
    afterEach(function () {
      sinon.restore();
    });

    it('Should return a Tema', function (done) {
      const dummyTema = aTema(1);
      dummyTema.activo = true
      const findByPkFake = sinon.fake.resolves(dummyTema)
      sinon.replace(Tema, 'findByPk', findByPkFake);
      chai.request(app)
        .get('/api/v1/temas/1')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(200);
          expect(res.body.data).to.exist;
          expect(res.body.data.id).to.be.a('number');
          expect(res.body.data.temaIndicador).to.exist;
          expect(res.body.data.observaciones).to.exist;
          expect(res.body.data.urlImagen).to.exist;
          expect(res.body.data.color).to.exist
          expect(findByPkFake.calledOnce).to.be.true;
          done();
        });
    })

    it('Should fail to return a Tema due to an invalid id', function (done) {
      chai.request(app)
        .get('/api/v1/temas/notvalid')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(422);
          expect(res.body.errors).to.be.an('array').that.is.not.empty;
          done();
        })
    })

    it('Should return not found if Tema does not exist', function (done) {
      const findByPkFake = sinon.fake.resolves(null);
      sinon.replace(Tema, 'findByPk', findByPkFake);
      chai.request(app)
        .get('/api/v1/temas/1000')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(404);
          expect(findByPkFake.calledOnce).to.be.true;
          done();
        });
    });

    it('Should return conflict error if Tema is not active', function (done) {
      const inactiveTema = aTema(20);
      inactiveTema.activo = 'NO';
      const findByPkFake = sinon.fake.resolves(inactiveTema);
      sinon.replace(Tema, 'findByPk', findByPkFake);
      chai.request(app)
        .get('/api/v1/temas/20')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(res).to.have.status(409);
          done();
        })
    })
  });

  describe.skip('GET /Tema/:id/indicadores', function () {
    it('Should return indicadores of :idTema', function (done) {
      const findOneTema = sinon.fake.resolves({ count: 1 })
      const findAndCountIndicadores = sinon.fake.resolves({ rows: indicadoresList, count: indicadoresList.length });
      sinon.replace(Tema, 'findOne', findOneTema);
      sinon.replace(Indicador, 'findAndCountAll', findAndCountIndicadores);
      chai.request(app)
        .get('/api/v1/temas/1/indicadores')
        .end(function (err, res) {
          expect(err).to.be.null;
          expect(findOneTema.calledOnce).to.be.true;
          // it's twice because the service returns the number of inactive indicadores
          expect(findAndCountIndicadores.calledTwice).to.be.true;
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.an('array').that.is.not.empty;
          expect(res.body.data[0].ods).to.not.be.null;
          expect(res.body.data[0].ods).to.not.be.undefined;
          done();
        });
    });

    it('Should return status code 404 if :idTema does not exist', function (done) {
      const findOneFake = sinon.fake.resolves({ count: 0 });
      sinon.replace(Tema, 'findOne', findOneFake);
      chai.request(app)
        .get('/api/v1/temas/1/indicadores')
        .end(function (err, res) {
          expect(findOneFake.calledOnce).to.be.true;
          expect(res.error).to.exist;
          expect(res).to.have.status(404);
          done()
        });
    });

    it('Should return status code 422 with invalid :idTema', function (done) {
      chai.request(app)
        .get('/api/v1/temas/notvalid/indicadores')
        .end(function (err, res) {
          expect(res).to.have.status(422);
          done();
        })
    });

    it('Should return 2 items per page', function (done) {
      const findAndCountAllFake = sinon.fake.resolves({ rows: indicadoresList, count: indicadoresList.length });
      const findOneFake = sinon.fake.resolves({ count: 1 });
      const perPage = indicadoresList.length;
      sinon.replace(Indicador, 'findAndCountAll', findAndCountAllFake);
      sinon.replace(Tema, 'findOne', findOneFake);
      chai.request(app)
        .get('/api/v1/temas/1/indicadores')
        .query({ perPage })
        .end(function (err, res) {
          expect(findAndCountAllFake.calledTwice, 'find indicadores').to.be.true;
          expect(findOneFake.calledOnce).to.be.true;
          expect(res).to.have.status(200);
          expect(res.body.totalPages).to.be.at.least(1);
          expect(res.body.data).to.have.lengthOf(perPage);
          done();
        });

    });

    it('Should return a list of filtered items', function (done) {
      indicadoresList[0].anioUltimoValorDisponible = 2019;
      indicadoresList[1].anioUltimoValorDisponible = 2019;
      const rows = [indicadoresList[0], indicadoresList[1]];
      const findAndCountAllFake = sinon.fake.resolves({ rows, count: rows.length });
      const findOneFake = sinon.fake.resolves({ count: 1 });
      sinon.replace(Tema, 'findOne', findOneFake);
      sinon.replace(Indicador, 'findAndCountAll', findAndCountAllFake)
      chai.request(app)
        .get('/api/v1/temas/1/indicadores')
        .query({ anioUltimoValorDisponible: 2019, page: 1, perPage: 2 })
        .end(function (err, res) {
          expect(findAndCountAllFake.calledTwice).to.be.true;
          expect(findOneFake.calledOnce).to.be.true;
          expect(res).to.have.status(200);
          expect(res.body.totalPages).to.be.at.least(1);
          expect(res.body.data).to.have.length.within(0, 2);
          expect(res.body.data[0].anioUltimoValorDisponible).to.be.equals(2019);
          done();
        });
    });

    it('Should return a list with a negative tendency', function (done) {
      indicadoresList[0].tendenciaActual = 'DESCENDENTE';
      indicadoresList[1].tendenciaActual = 'DESCENDENTE';
      const rows = [indicadoresList[0], indicadoresList[1]];
      const findAndCountAllFake = sinon.fake.resolves({ rows, count: rows.length });
      const findOneFake = sinon.fake.resolves({ count: 1 });
      sinon.replace(Tema, 'findOne', findOneFake);
      sinon.replace(Indicador, 'findAndCountAll', findAndCountAllFake)
      chai.request(app)
        .get('/api/v1/temas/1/indicadores')
        .query({ tendenciaActual: 'DESCENDENTE' })
        .end(function (err, res) {
          expect(findAndCountAllFake.calledTwice, 'find indicadores').to.be.true;
          expect(findOneFake.calledOnce, 'find Tema').to.be.true;
          expect(res).to.have.status(200);
          expect(res.body.data).to.be.an('array').that.is.not.empty;
          expect(res.body.data[0].tendenciaActual).to.be.equals('DESCENDENTE');
          done();
        });
    });

    it('Should return not found if :idTema does not exist', function (done) {
      const findOneFake = sinon.fake.resolves({ count: 0 });
      sinon.replace(Tema, 'findOne', findOneFake);
      chai.request(app)
        .get('/api/v1/temas/1/indicadores')
        .end(function (err, res) {
          expect(findOneFake.calledOnce).to.be.true;
          expect(res).to.have.status(404);
          done();
        })
    });

    it('Should return a list of indicadores filtered by idOds', function (done) {
      indicadoresList[0].idOds = 1;
      indicadoresList[1].idOds = 1;
      const rows = [indicadoresList[0], indicadoresList[1]];

      const findAndCountAllFake = sinon.fake.resolves({ rows, count: rows.length });
      sinon.replace(Indicador, 'findAndCountAll', findAndCountAllFake);

      const findOneFake = sinon.fake.resolves({ count: 1 });
      sinon.replace(Tema, 'findOne', findOneFake);

      chai.request(app)
        .get('/api/v1/temas/1/indicadores')
        .query({ idOds: 1 })
        .end(function (err, res) {
          expect(findAndCountAllFake.calledTwice).to.be.true;
          expect(findOneFake.calledOnce).to.be.true;
          expect(res).to.have.status(200);
          expect(res.body.data[0].idOds).to.be.equal(1);
          done();
        });
    });

    it('Should not process request if indicadores is filtered by an invalid idOds', function (done) {
      chai.request(app)
        .get('/api/v1/temas/1/indicadores')
        .query({ idOds: 'undefinedId' })
        .end(function (err, res) {
          expect(res).to.have.status(422);
          done();
        });
    });

    it('Should return a list of ordered indicadores by name', function (done) {
      indicadoresList[0].nombre = 'A';
      indicadoresList[1].nombre = 'B';
      const rows = [indicadoresList[0], indicadoresList[1]];

      const findAndCountAllFake = sinon.fake.resolves({ rows, count: rows.length });
      sinon.replace(Indicador, 'findAndCountAll', findAndCountAllFake);

      const findOneFake = sinon.fake.resolves({ count: 1 });
      sinon.replace(Tema, 'findOne', findOneFake);

      chai.request(app)
        .get('/api/v1/temas/1/indicadores')
        .query({ sortBy: 'nombre', order: 'asc' })
        .end(function (err, res) {
          expect(findAndCountAllFake.calledTwice).to.be.true;
          expect(findOneFake.calledOnce).to.be.true;
          expect(res).to.have.status(200);
          const comparison = res.body.data[0].nombre.localeCompare(res.body.data[1].nombre);
          expect(comparison).to.be.equals(-1);
          done();
        });
    });

    it.skip('Should fail to return list due to invalid sortby and order values', function (done) {
      chai.request(app)
        .get('/api/v1/temas/1/indicadores')
        .query({ sortBy: 'invalid', order: 'invalid' })
        .end(function (err, res) {
          expect(res).to.have.status(422);
          done();
        });
    })
  });

  describe('POST /temas', function () {

    this.afterEach(function () {
      sinon.restore();
    });

    let usuarioStub;

    this.beforeEach(function () {
      usuarioStub = sinon.stub(Usuario, 'findOne');
      usuarioStub.onFirstCall().resolves(statusActive);
      usuarioStub.onSecondCall().resolves(adminRol);
    });

    const bigImage = Buffer.alloc(2_200_000, '.jpg')
    const allowedImage = Buffer.alloc(10_000, '.jpg')
    const notAllowedFile = Buffer.alloc(50, '.pdf')

    it('Should reject the creation of a new Tema due to file size limit exceeded', function (done) {
      const temaFake = aTema(5);
      const createTemaFake = sinon.fake.resolves(temaFake);
      const findOneFake = sinon.fake.resolves(null);

      const fileUploadFake = sinon.fake.resolves({
        filename: 'bigImage.jpg',
        mimetype: 'image/jpeg',
        encoding: '7bit',
        createReadStream: () => bigImage
      });

      sinon.replace(fileUpload, 'uploadImage', fileUploadFake);
      sinon.replace(Tema, 'create', createTemaFake);
      sinon.replace(Tema, 'findOne', findOneFake);
      chai.request(app)
        .post('/api/v1/temas')
        .set('Authorization', `Bearer ${token}`)
        .type('form')
        .field('temaIndicador', temaFake.temaIndicador)
        .field('id', temaFake.id)
        .field('codigo', temaFake.codigo)
        .field('activo', temaFake.activo)
        .field('observaciones', temaFake.observaciones)
        .field('color', temaFake.color)
        .attach('urlImagen', bigImage, 'bigImage.jpg')
        .end(function (err, res) {
          expect(res).to.have.status(413);
          done();
        });
    });

    it('Should reject the creation of a new Tema due to not allowed file type', function (done) {
      const temaFake = aTema(5);
      const createTemaFake = sinon.fake.resolves(temaFake);
      const findOneFake = sinon.fake.resolves(null);
      sinon.replace(Tema, 'create', createTemaFake);
      sinon.replace(Tema, 'findOne', findOneFake);
      chai.request(app)
        .post('/api/v1/temas')
        .set('Authorization', `Bearer ${token}`)
        .type('form')
        .field('temaIndicador', temaFake.temaIndicador)
        .field('id', temaFake.id)
        .field('codigo', temaFake.codigo)
        .field('activo', temaFake.activo)
        .field('observaciones', temaFake.observaciones)
        .field('color', temaFake.color)
        .attach('urlImagen', notAllowedFile, 'samplePDF.pdf')
        .end(function (err, res) {
          expect(res).to.have.status(422);
          done();
        });
    });

    it('Should create a new Tema with an image', function (done) {
      const temaFake = aTema(5).dataValues;
      const createTemaFake = sinon.fake.resolves(temaFake);
      sinon.replace(Tema, 'create', createTemaFake);

      const findOneFake = sinon.fake.resolves(null);
      sinon.replace(Tema, 'findOne', findOneFake);

      const fileUploadFake = sinon.fake.resolves({
        filename: 'allowedImage.jpg',
        mimetype: 'image/jpeg',
        encoding: '7bit',
        createReadStream: () => allowedImage
      });
      sinon.replace(fileUpload, 'uploadImage', fileUploadFake);

      chai.request(app)
        .post('/api/v1/temas')
        .set('Authorization', `Bearer ${token}`)
        .type('form')
        .field('temaIndicador', temaFake.temaIndicador)
        .field('codigo', temaFake.codigo)
        .field('activo', temaFake.activo)
        .field('observaciones', temaFake.observaciones)
        .field('color', temaFake.color)
        .field('descripcion', temaFake.descripcion)
        .attach('urlImagen', allowedImage, 'avatar.jpg')
        .end(function (err, res) {
          expect(err).to.be.null
          expect(createTemaFake.calledOnce, 'called create fake').to.be.true;
          expect(usuarioStub.calledTwice).to.be.true;
          expect(res).to.have.status(201);
          expect(res.body.data).to.have.property('temaIndicador');
          expect(res.body.data).to.have.property('codigo');
          expect(res.body.data).to.have.property('activo');
          expect(res.body.data).to.have.property('observaciones');
          expect(res.body.data).to.have.property('color');
          expect(res.body.data).to.have.property('descripcion');
          expect(res.body.data).to.have.property('urlImagen');
          done();
        });
    });

    it('Should create a new Tema', function (done) {
      const temaFake = aTema(1).dataValues;
      const createTemaFake = sinon.fake.resolves(temaFake);
      sinon.replace(Tema, 'create', createTemaFake);

      const findOneFake = sinon.fake.resolves(null);
      sinon.replace(Tema, 'findOne', findOneFake);

      chai.request(app)
        .post('/api/v1/temas')
        .set({ Authorization: `Bearer ${token}` })
        .send({ ...temaFake })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(201);
          expect(usuarioStub.calledTwice).to.be.true;
          expect(createTemaFake.calledOnce).to.be.true;
          expect(findOneFake.calledOnce).to.be.true;
          done();
        });
    });

    it('Should not create a new Tema because tema is already in use', function (done) {
      const temaFake = aTema(1).dataValues;
      const findOneFake = sinon.fake.resolves(false);
      sinon.replace(Tema, 'findOne', findOneFake);
      chai.request(app)
        .post('/api/v1/temas')
        .set({ Authorization: `Bearer ${token}` })
        .send({ ...temaFake })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(usuarioStub.calledTwice).to.be.true;
          expect(findOneFake.calledOnce).to.be.true;
          expect(res).to.have.status(409);
          expect(res.body.message).to.be.equal(`El tema indicador ${temaFake.temaIndicador} ya está en uso`)
          done();
        });
    });

    it('Should not create a new Tema due to wrong codigo attribute', function (done) {
      const temaFake = { ...aTema(1), codigo: '1' };
      const createTemaFake = sinon.fake.resolves(temaFake);
      const findOneFake = sinon.fake.resolves(true);
      sinon.replace(Tema, 'create', createTemaFake);
      sinon.replace(Tema, 'findOne', findOneFake);
      chai.request(app)
        .post('/api/v1/temas')
        .set({ Authorization: `Bearer ${token}` })
        .send(temaFake)
        .end((err, res) => {
          expect(res).to.have.status(422);
          done();
        });
    })

    it('Should not create a new Tema due to internal error', function (done) {
      const temaFake = aTema(1).dataValues;
      const createTemaFake = sinon.fake.throws('Error');
      sinon.replace(Tema, 'create', createTemaFake);
      const findOneFake = sinon.fake.rejects(null);
      sinon.replace(Tema, 'findOne', findOneFake);

      chai.request(app)
        .post('/api/v1/temas')
        .set({ Authorization: `Bearer ${token}` })
        .send(temaFake)
        .end((err, res) => {
          expect(usuarioStub.calledTwice, 'usuario stub').to.be.true;
          expect(res).to.have.status(500);
          done();
        });
    });

    it('Should restrict a module creation due to invalid token', function (done) {
      const createTemaFake = sinon.fake.rejects(aTema(1));
      const findOneFake = sinon.fake.resolves(null);
      sinon.replace(Tema, 'create', createTemaFake);
      sinon.replace(Tema, 'findOne', findOneFake);
      chai.request(app)
        .post('/api/v1/temas')
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    })

  });

  describe('PUT /:idTema', function () {
    let usuarioStub;
    this.beforeEach(function () {
      usuarioStub = sinon.stub(Usuario, 'findOne');
      usuarioStub.onFirstCall().resolves(statusActive);
      usuarioStub.onSecondCall().resolves(adminRol);
    });

    this.afterEach(function () {
      sinon.restore();
    });


    it('Should edit a Tema', function (done) {
      const temaFake = aTema(1);
      const editTemaFake = sinon.fake.resolves(true);
      sinon.replace(Tema, 'update', editTemaFake);
      chai.request(app)
        .put('/api/v1/temas/1')
        .set({ Authorization: `Bearer ${token}` })
        .send(temaFake)
        .end((err, res) => {
          expect(res).to.have.status(204);
          expect(res.body.data).to.not.be.null;
          done();
        });
    });

    it('Should not edit a Tema -bad request', function (done) {
      const temaFake = aTema(1);
      const editTemaFake = sinon.fake.resolves(temaFake);
      sinon.replace(Tema, 'update', editTemaFake);

      chai.request(app)
        .put('/api/v1/temas/1')
        .send(temaFake)
        .set({ Authorization: `Bearer ${token}` })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it('Should not edit a Tema due to internal errors', function (done) {
      const temaFake = aTema(1).dataValues;
      const editTemaFake = sinon.fake.rejects(new Error('Error'));
      sinon.replace(Tema, 'update', editTemaFake);
      chai.request(app)
        .put('/api/v1/temas/1')
        .set({ Authorization: `Bearer ${token}` })
        .send({ ...temaFake })
        .end((err, res) => {
          expect(editTemaFake.calledOnce, 'update Tema').to.be.true;
          expect(res).to.have.status(500);
          done();
        });
    });
  });

  describe('PATCH /:idTema', function () {
    let usuarioStub;
    this.beforeEach(function () {
      usuarioStub = sinon.stub(Usuario, 'findOne');
      usuarioStub.onFirstCall().resolves(statusActive);
      usuarioStub.onSecondCall().resolves(adminRol);
    });

    this.afterEach(function () {
      sinon.restore();
    });

    it('Should edit a given Tema status', function (done) {
      const temaFake = aTema(1);
      const findOneFake = sinon.fake.resolves(temaFake);
      const editOneFake = sinon.fake.resolves(true);
      sinon.replace(Tema, 'findOne', findOneFake);
      sinon.replace(Tema, 'update', editOneFake);
      chai.request(app)
        .patch('/api/v1/temas/1')
        .set({ Authorization: `Bearer ${token}` })
        .end((err, res) => {
          expect(res).to.have.status(204);
          expect(res.body.data).to.not.be.null;
          done();
        });
    });

    it('Should not edit a given Tema status -bad request', function (done) {
      const temaFake = aTema(1);
      const findOneFake = sinon.fake.resolves(temaFake);
      const editOneFake = sinon.fake.resolves(false);
      sinon.replace(Tema, 'findOne', findOneFake);
      sinon.replace(Tema, 'update', editOneFake);
      chai.request(app)
        .patch('/api/v1/temas/1')
        .set({ Authorization: `Bearer ${token}` })
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });

    it('Should not edit a given Tema status due to internal errors', function (done) {
      const temaFake = aTema(1);
      const findOneFake = sinon.fake.resolves(temaFake);
      const editOneFake = sinon.fake.throws('Error');
      sinon.replace(Tema, 'findOne', findOneFake);
      sinon.replace(Tema, 'update', editOneFake);
      chai.request(app)
        .patch('/api/v1/temas/1')
        .set({ Authorization: `Bearer ${token}` })
        .end((err, res) => {
          expect(res).to.have.status(500);
          done();
        });
    });
  });
})