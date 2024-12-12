const { generateToken } = require("../../middlewares/auth");
const { expect } = require("chai");
const { describe } = require("mocha");
const proxyquire = require('proxyquire').noCallThru();
const bcrypt = require("bcryptjs");
const { aUser } = require("../../utils/factories");
const sinon = require("sinon");

describe.only("Auth controller (Unit Tests)", function () {

  let req, res, next;
  let statusStub, jsonStub;
  let usuario;

  this.afterEach(function () {
    sinon.restore();
  });

  describe('login', function () {
    let getUsuarioFake;

    this.beforeEach(function () {
      next = sinon.spy();
      usuario = { ...aUser(1), activo: true };
      getUsuarioFake = sinon.stub();
      statusStub = sinon.stub().returnsThis();
      jsonStub = sinon.stub().returnsArg(0);

      req = {
        matchedData: {
          correo: usuario.correo,
          clave: usuario.clave
        }
      };

      res = {
        status: statusStub,
        json: jsonStub
      };
    });

    describe('When user exists', function () {
      let auth;

      this.beforeEach(function () {
        getUsuarioFake = sinon.fake.resolves(usuario);
        auth = proxyquire('../../controllers/authController', {
          '../services/usuariosService': {
            getUsuarioByCorreo: getUsuarioFake
          }
        })
      })

      it("Should return token", function () {
        const compareFake = sinon.fake.resolves(true);
        sinon.replace(bcrypt, 'compare', compareFake)

        const expectedResponse = { token: generateToken({ sub: usuario.id }) }

        return auth.login(req, res, next)
          .then(() => {
            expect(getUsuarioFake.calledOnceWith(usuario.correo)).to.be.true;
            expect(compareFake.calledOnce).to.be.true;
            expect(statusStub.calledOnceWith(200)).to.be.true;
            expect(jsonStub.calledOnceWith(sinon.match(expectedResponse))).to.be.true;
            expect(next.calledOnce).to.be.false;
          })
      });


      it("Should fail because password is invalid", function () {
        const compareFake = sinon.fake.resolves(false);
        sinon.replace(bcrypt, 'compare', compareFake);

        const expectedResponse = { message: "Credenciales invalidas" };

        return auth.login(req, res, next)
          .then(() => {
            expect(getUsuarioFake.calledOnceWith(usuario.correo)).to.be.true;
            expect(compareFake.calledOnce).to.be.true;
            expect(statusStub.calledOnceWith(401)).to.be.true;
            expect(jsonStub.calledOnceWith(sinon.match(expectedResponse))).to.be.true;
            expect(next.calledOnce).to.be.false;
          })
      });
    });

    describe('When user is not found or has invalid state', function () {

      it("Should fail if user with given email is not found", function () {
        getUsuarioFake = sinon.fake.resolves(null);
        const { login } = proxyquire('../../controllers/authController', {
          '../services/usuariosService': {
            getUsuarioByCorreo: getUsuarioFake
          }
        });

        const expectedResponse = { message: 'Credenciales invalidas' }
        return login(req, res, next)
          .then(() => {
            expect(getUsuarioFake.calledOnce).to.be.true;
            expect(statusStub.calledOnceWith(401)).to.be.true;
            expect(jsonStub.calledOnceWith(sinon.match(expectedResponse))).to.be.true;
            expect(next.calledOnce).to.be.false;
          })

      });
    })

    describe('When user exist but has invalid state', function () {
      it("Should fail because user is not active", function () {
        getUsuarioFake = sinon.fake.resolves({ usuario, activo: false });
        const { login } = proxyquire('../../controllers/authController', {
          '../services/usuariosService': {
            getUsuarioByCorreo: getUsuarioFake
          }
        });

        const expectedResponse = { message: "La cuenta se encuentra deshabilitada" }

        return login(req, res, next)
          .then(() => {
            expect(statusStub.calledOnceWith(403)).to.be.true;
            expect(jsonStub.calledOnceWith(sinon.match(expectedResponse))).to.be.true;
            expect(getUsuarioFake.calledOnce).to.be.true;
          });
      });
    })
  })

  describe('generate password recovery token', () => {
  })

  describe('handle password recovery token', () => {

  })

});
