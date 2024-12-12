const chai = require('chai')
const chaiHttp = require('chai-http');
const { app } = require('../../../app');
const { Usuario } = require('../../models');
const { hashClave } = require('../../middlewares/auth');

chai.use(chaiHttp);
const { expect } = chai;

describe.only('/auth endpoint (Integration Tests)', () => {

  describe('POST /login', () => {

    describe('When user exists', () => {
      before('Save user to db', () => {

        return hashClave('password')
          .then(clave => Usuario.bulkCreate([{
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
          }]))
      })

      after('Remove user', () => {
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
    })
  });

  describe('POST /password-reset', () => {

  });

  describe('PATCH /password-reset/token', () => {

  });
})