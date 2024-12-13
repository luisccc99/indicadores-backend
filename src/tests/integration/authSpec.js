const sinon = require('sinon')
const chai = require('chai')
const chaiHttp = require('chai-http');
const { app } = require('../../../app');
const { Usuario } = require('../../models');
const { hashClave } = require('../../middlewares/auth');
const emailSenderService = require('../../services/emailSenderService');

chai.use(chaiHttp);
const { expect } = chai;

describe.only('/auth endpoint (Integration Tests)', () => {
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

  });
})