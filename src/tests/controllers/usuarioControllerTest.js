/* eslint-disable func-names */
/* eslint-disable no-unused-expressions */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable prefer-arrow-callback */
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');

const { app, server } = require('../../../app');
const { Usuario, UsuarioIndicador } = require('../../models');
const { aUser } = require('../../utils/factories');
const fileUpload = require('../../middlewares/fileUpload');
const { addDays } = require('../../utils/dates');
const { generateToken } = require('../../middlewares/auth');
require('dotenv').config();

chai.use(chaiHttp);
const { expect } = chai;

describe('v1/usuarios', function () {
  const SUB_ID = 100;
  const token = generateToken({ sub: SUB_ID });
  const adminRol = { rolValue: 'ADMIN' };
  const userRol = { rolValue: 'USER' };

  const bigImage = Buffer.alloc(100200000, '.jpg')
  const allowedImage = Buffer.alloc(1000, '.jpg')
  const notAllowedFile = Buffer.alloc(10000, '.pdf')
  const statusActive = { activo: 'SI' };

  this.afterEach(function () {
    sinon.restore();
  });

  describe('GET /usuarios', function () {

    it('Should return not found if user does not exist', function (done) {
      const findOneFake = sinon.stub(Usuario, 'findOne');
      findOneFake.onFirstCall().resolves({ count: 0 });
      chai.request(app)
        .get('/api/v1/usuarios/1')
        .set({ Authorization: `Bearer ${token}` })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(findOneFake.calledOnce).to.be.true;
          expect(res).have.status(404);
          done();
        });
    });

    it('Should return a list of users', function (done) {
      const findAndCountAllFake = sinon.fake.resolves({ rows: [aUser(1)], count: 1 });
      const countFake = sinon.fake.resolves(1);
      const findOneFake = sinon.stub(Usuario, 'findOne');

      sinon.replace(Usuario, 'findAndCountAll', findAndCountAllFake);
      sinon.replace(Usuario, 'count', countFake);

      findOneFake.onFirstCall().resolves(statusActive);
      findOneFake.onSecondCall().resolves(adminRol);

      chai.request(app)
        .get('/api/v1/usuarios')
        .set({ Authorization: `Bearer ${token}` })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).have.status(200);
          expect(findAndCountAllFake.calledOnce).to.be.true;
          expect(findOneFake.calledTwice).to.be.true;
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).to.have.lengthOf(1)
          done();
        });
    });

    it('Should not return a list of users', function (done) {
      const findAndCountAllFake = sinon.fake.rejects(new Error('Connection to DB failed'));
      const findOneFake = sinon.stub(Usuario, 'findOne');

      sinon.replace(Usuario, 'findAndCountAll', findAndCountAllFake);
      findOneFake.onFirstCall().resolves(statusActive);
      findOneFake.onSecondCall().resolves(adminRol);

      chai.request(app)
        .get('/api/v1/usuarios')
        .set({ Authorization: `Bearer ${token}` })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(findAndCountAllFake.calledOnce).to.be.true;
          expect(findOneFake.calledTwice).to.be.true;
          expect(res).have.status(500);
          done();
        });
    });
  });

  describe('POST /usuarios', function () {
    it('Should create a user with no avatar', function (done) {
      const findOneFake = sinon.stub(Usuario, 'findOne');
      findOneFake.onFirstCall().resolves(statusActive);
      findOneFake.onSecondCall().resolves(adminRol);
      findOneFake.onThirdCall().resolves(null);

      const createUserFake = sinon.fake.resolves(aUser(1));
      sinon.replace(Usuario, 'create', createUserFake);

      chai.request(app)
        .post('/api/v1/usuarios')
        .set({ Authorization: `Bearer ${token}` })
        .send(aUser())
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).to.have.status(201);
          expect(findOneFake.calledThrice).to.be.true;
          expect(createUserFake.calledOnce).to.be.true;
          done();
        });
    });

    it('Should create a user with avatar', function (done) {
      const fileUploadFake = sinon.fake.resolves({
        filename: 'validimage.jpg',
        mimetype: 'image/jpeg',
        encoding: '7bit',
        createReadStream: () => allowedImage
      });
      sinon.replace(fileUpload, 'uploadImage', fileUploadFake);
      const userFake = aUser(1);
      const findOneFake = sinon.stub(Usuario, 'findOne');
      const createUserFake = sinon.fake.resolves(userFake);

      findOneFake.onFirstCall().resolves(statusActive);
      findOneFake.onSecondCall().resolves(adminRol);
      findOneFake.onThirdCall().resolves(null);
      sinon.replace(Usuario, 'create', createUserFake);

      chai.request(app)
        .post('/api/v1/usuarios')
        .set({ Authorization: `Bearer ${token}` })
        .set('Content-Type', 'multipart/form-data')
        .field('nombres', userFake.nombres)
        .field('apellidoPaterno', userFake.apellidoPaterno)
        .field('apellidoMaterno', userFake.apellidoPaterno)
        .field('idRol', userFake.idRol)
        .field('activo', userFake.activo)
        .field('correo', userFake.correo)
        .field('clave', userFake.clave)
        .attach('urlImagen', allowedImage, 'avatar.jpg')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(findOneFake.calledThrice).to.be.true;
          expect(createUserFake.calledOnce).to.be.true;
          expect(res).have.status(201);
          done();
        });
    });

    it('Should fail to create a user because avatar image is too big', function (done) {
      const userFake = aUser(1);
      chai.request(app)
        .post('/api/v1/usuarios')
        .set({ Authorization: `Bearer ${token}` })
        .set('Content-Type', 'multipart/form-data')
        .field('nombres', userFake.nombres)
        .field('apellidoPaterno', userFake.apellidoPaterno)
        .field('apellidoMaterno', userFake.apellidoPaterno)
        .field('idRol', userFake.idRol)
        .field('activo', userFake.activo)
        .field('correo', userFake.correo)
        .field('clave', userFake.clave)
        .attach('urlImagen', bigImage, 'avatar.jpg')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).have.status(413);
          expect(res.error.text).to.be.equal('LIMIT_FILE_SIZE');
          done();
        });
    });

    it('Should fail to create a user because avatar has an incorrect format', function (done) {
      const userFake = aUser(1);
      chai.request(app)
        .post('/api/v1/usuarios')
        .set({ Authorization: `Bearer ${token}` })
        .set('Content-Type', 'multipart/form-data')
        .field('nombres', userFake.nombres)
        .field('apellidoPaterno', userFake.apellidoPaterno)
        .field('apellidoMaterno', userFake.apellidoPaterno)
        .field('idRol', userFake.idRol)
        .field('activo', userFake.activo)
        .field('correo', userFake.correo)
        .field('clave', userFake.clave)
        .attach('urlImagen', notAllowedFile, 'avatar.pdf')
        .end((err, res) => {
          expect(res.error.text).to.be.equal('FILE_TYPE_NOT_ALLOWED');
          expect(err).to.be.null;
          expect(res).have.status(422);
          done();
        });
    });

    it('Should not create a user because email is not available', function (done) {
      const userFake = aUser(10);
      const findOneFake = sinon.stub(Usuario, 'findOne');
      findOneFake.onFirstCall().resolves(statusActive);
      findOneFake.onSecondCall().resolves(adminRol);
      findOneFake.onThirdCall().resolves(userFake.correo);
      chai.request(app)
        .post('/api/v1/usuarios')
        .set({ Authorization: `Bearer ${token}` })
        .send(userFake)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).have.status(409);
          expect(findOneFake.calledThrice).to.be.true;
          done();
        });
    });

    it('Should not create a user because connection to DB failed', function (done) {
      const userFake = aUser(10);
      const findOneFake = sinon.stub(Usuario, 'findOne');
      findOneFake.onFirstCall().resolves(statusActive);
      findOneFake.onSecondCall().resolves(adminRol);
      findOneFake.onThirdCall().resolves(null);

      const createFake = sinon.fake.rejects(new Error('Connection failed'));
      sinon.replace(Usuario, 'create', createFake);

      chai.request(app)
        .post('/api/v1/usuarios')
        .set({ Authorization: `Bearer ${token}` })
        .send(userFake)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(findOneFake.callCount).to.be.equal(3)
          expect(createFake.calledOnce).to.be.true;
          expect(res).have.status(500);
          done();
        });
    });
  });

  describe('PATCH /usuarios/:idUsuario', function () {
    it('Should edit a user', function (done) {
      const fileUploadFake = sinon.fake.resolves({
        filename: 'validimage.jpg',
        mimetype: 'image/jpeg',
        encoding: '7bit',
        createReadStream: () => allowedImage
      });

      sinon.replace(fileUpload, 'uploadImage', fileUploadFake);
      const userFake = aUser(1);
      const editUserFake = sinon.fake.resolves(1)
      const findOneFake = sinon.stub(Usuario, 'findOne');

      sinon.replace(Usuario, 'update', editUserFake);
      findOneFake.onFirstCall().resolves(statusActive);
      findOneFake.onSecondCall().resolves(adminRol);

      chai.request(app)
        .patch('/api/v1/usuarios/1')
        .set({ Authorization: `Bearer ${token}` })
        .field('nombres', userFake.nombres)
        .field('apellidoPaterno', userFake.nombres)
        .field('activo', userFake.activo)
        .attach('urlImagen', allowedImage, 'avatar.jpg')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(editUserFake.calledOnce).to.be.true;
          expect(findOneFake.calledTwice).to.be.true;
          expect(res).have.status(204);
          done();
        });
    });

    it('Should fail to update a user because avatar image is too big', function (done) {
      const findOneFake = sinon.stub(Usuario, 'findOne');

      findOneFake.onFirstCall().resolves(statusActive);
      findOneFake.onSecondCall().resolves(adminRol);

      const userFake = aUser(1);

      chai.request(app)
        .patch('/api/v1/usuarios/1')
        .set({ Authorization: `Bearer ${token}` })
        .set('Content-Type', 'multipart/form-data')
        .field('nombres', userFake.nombres)
        .field('apellidoPaterno', userFake.apellidoPaterno)
        .field('apellidoMaterno', userFake.apellidoPaterno)
        .field('idRol', userFake.idRol)
        .field('activo', userFake.activo)
        .field('correo', userFake.correo)
        .field('clave', userFake.clave)
        .attach('urlImagen', bigImage, 'avatar.jpg')
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).have.status(413);
          expect(findOneFake.calledTwice).to.be.true;
          expect(res.error.text).to.be.equal('LIMIT_FILE_SIZE')
          done();
        });
    });

    it('Should fail to update a user because avatar has an incorrect format', function (done) {
      const userFake = aUser(1);
      const findOneFake = sinon.stub(Usuario, 'findOne');

      findOneFake.onFirstCall().resolves(statusActive);
      findOneFake.onSecondCall().resolves(adminRol);

      chai.request(app)
        .patch('/api/v1/usuarios/1')
        .set({ Authorization: `Bearer ${token}` })
        .set('Content-Type', 'multipart/form-data')
        .field('nombres', userFake.nombres)
        .field('apellidoPaterno', userFake.apellidoPaterno)
        .field('apellidoMaterno', userFake.apellidoPaterno)
        .field('idRol', userFake.idRol)
        .field('activo', userFake.activo)
        .field('correo', userFake.correo)
        .field('clave', userFake.clave)
        .attach('urlImagen', notAllowedFile, 'invalid.format')
        .end((err, res) => {
          expect(res.error.text).to.be.equal('FILE_TYPE_NOT_ALLOWED');
          expect(err).to.be.null;
          expect(res).have.status(422);
          done();
        });
    });

    it('Should not edit a user due to semantic errors', function (done) {
      const userFake = aUser(1);
      userFake.apellidoMaterno = 1;
      const findOneFake = sinon.stub(Usuario, 'findOne');

      findOneFake.onFirstCall().resolves(statusActive);
      findOneFake.onSecondCall().resolves(adminRol);

      chai.request(app)
        .patch('/api/v1/usuarios/1')
        .send(userFake)
        .set({ Authorization: `Bearer ${token}` })
        .end((err, res) => {
          expect(err).to.be.null;
          expect(res).have.status(422);
          done();
        });
    });

    it('Should not edit a user because connection to db fails', function (done) {
      const userFake = aUser(1);
      const editUserFake = sinon.fake.rejects(true);
      sinon.replace(Usuario, 'update', editUserFake);

      const findOneFake = sinon.stub(Usuario, 'findOne');

      findOneFake.onFirstCall().resolves(statusActive);
      findOneFake.onSecondCall().resolves(adminRol);

      chai.request(app)
        .patch('/api/v1/usuarios/1')
        .set({ Authorization: `Bearer ${token}` })
        .send(userFake)
        .end((err, res) => {
          expect(err).to.be.null;
          expect(editUserFake.calledOnce).to.be.true;
          expect(findOneFake.calledTwice).to.be.true;
          expect(res).have.status(500);
          done();
        });
    });
  });

});
