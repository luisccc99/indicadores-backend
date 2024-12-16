const sinon = require('sinon')
const chai = require('chai')
const chaiHttp = require('chai-http');
const { app } = require('../../../app');
const { Usuario } = require('../../models');
const { hashClave, generateToken } = require('../../middlewares/auth');
const emailSenderService = require('../../services/emailSenderService');
const { aUser } = require('../../utils/factories');
const { faker } = require('@faker-js/faker');

chai.use(chaiHttp);
const { expect } = chai;

describe('v1/auth endpoint (Integration Tests)', () => {
  let clave;
  before('Set up clave', () => {
    return hashClave('password')
      .then(hashedClave => {
        clave = hashedClave
      })
  })

  describe('POST /login', () => {

    before('Create users for login scenarios', () => {
      return Usuario.bulkCreate([{
        nombres: 'John',
        apellidoPaterno: 'Doe',
        correo: 'johndoe@example.com',
        clave,
      }, {
        nombres: 'Jane',
        apellidoPaterno: 'Doe',
        correo: 'janedoe@example.com',
        clave,
        activo: false
      }])
    })

    after('Remove users', () => {
      return Usuario.destroy({ truncate: { cascade: true } })
    })

    it('Should return 200 with token', done => {
      chai.request(app)
        .post('/api/v1/auth/login')
        .send({
          correo: 'johndoe@example.com',
          clave: 'password'
        })
        .end((err, res) => {
          expect(res.status).to.be.equal(200);
          expect(res.body.token).to.be.a('string');
          done();
        })
    });


    it('Should return 401 because wrong credentials were provided', done => {
      chai.request(app)
        .post('/api/v1/auth/login')
        .send({
          correo: 'johndoe@example.com',
          clave: 'noope123456'
        })
        .end((err, res) => {
          expect(res.status).to.be.equal(401);
          expect(res.body.message).to.be.equal('Credenciales invalidas');
          done();
        })
    });


    it('Should return 403 because user is inactive', done => {
      chai.request(app)
        .post('/api/v1/auth/login')
        .send({
          correo: 'janedoe@example.com',
          clave: 'password'
        })
        .end((_err, res) => {
          expect(res.status).to.be.equal(403);
          expect(res.body.message).to.be.equal("La cuenta se encuentra deshabilitada");
          done()
        })
    });
  });

  describe('POST /password-reset', () => {
    let sendEmailStub;


    before('Create user to reset password', () => {
      sendEmailStub = sinon.stub(emailSenderService, 'sendEmail').resolves(true);

      return Usuario.create({
        nombres: 'John',
        apellidoPaterno: 'Doe',
        correo: 'johndoe@example.com',
        clave,
      })
    })

    after('Remove users', () => {
      return Usuario.destroy({ truncate: { cascade: true } })
    })

    afterEach(() => {
      sinon.reset();
    })

    it('Should generate token and send email', done => {
      chai.request(app)
        .post('/api/v1/auth/password-reset')
        .send({
          correo: 'johndoe@example.com'
        })
        .end((_err, res) => {
          expect(res.status).to.be.equal(200);
          expect(sendEmailStub.calledOnce).to.be.true;
          expect(res.body.message).to.be.equal('Se ha enviado un correo de recuperación de contraseña');
          done()
        })
    })

    it('Should fail because user was not found', done => {

      chai.request(app)
        .post('/api/v1/auth/password-reset')
        .send({ correo: 'notfound@example.com' })
        .end((_err, res) => {
          expect(res.status).to.equal(404);
          expect(res.body.message).to.equal('El usuario no existe');
          expect(sendEmailStub.callCount).to.equal(0);
          done();
        })
    })
  });

  describe('PATCH /password-reset/token', () => {
    let tokens = []
    before(('Create usuarios and tokens', () => {
      tokens = [
        generateToken({ sub: 1 }),
        generateToken({ sub: 2 }),
        generateToken({ sub: 3 })
      ];

      return Usuario.bulkCreate([
        { ...aUser(1), activo: false },
        { ...aUser(2), activo: true, requestedPasswordChange: false },
        { ...aUser(3), activo: true, requestedPasswordChange: true },
      ])
        .catch(console.log)
    }))

    after(() => {
      return Usuario.destroy({ truncate: { cascade: true } })
    })

    it('Should return 409 because user is inactive', done => {
      chai.request(app)
        .patch(`/api/v1/auth/password-reset/${tokens[0]}`)
        .send({
          clave: faker.internet.password(8)
        })
        .end((_err, res) => {
          expect(res.status).to.be.equal(409)
          expect(res.body.message).to.be.equal('El usuario se encuentra inactivo')
          done();
        })
    });

    it('Should return 409 because user has not started recovery process', done => {
      chai.request(app)
        .patch(`/api/v1/auth/password-reset/${tokens[1]}`)
        .send({
          clave: faker.internet.password(8)
        })
        .end((_err, res) => {
          expect(res.status).to.be.equal(409);
          expect(res.body.message).to.be.equal('El usuario no ha solicitado un cambio de contraseña');
          done();
        })
    });

    it('Should return 200 because password has been updated', done => {
      chai.request(app)
        .patch(`/api/v1/auth/password-reset/${tokens[2]}`)
        .send({
          clave: faker.internet.password(8)
        })
        .end((_err, res) => {
          expect(res.status).to.be.equal(200);
          expect(res.body.message).to.be.equal('Contraseña actualizada');
          done();
        });
    });

    it('Should return 403 because token is invalid', done => {
      const expiredToken = generateToken({ sub: 4, iat: Math.floor(Date.now() / 1000) - 30, expirationTime: 1 })
      chai.request(app)
        .patch(`/api/v1/auth/password-reset/${expiredToken}`)
        .send({
          clave: faker.internet.password(8)
        })
        .end((_err, res) => {
          expect(res.status).to.be.equal(403);
          expect(res.body.message).to.be.equal('Token invalido');
          done();
        })
    });
  });
})