const { generateToken } = require("../../middlewares/auth");
const { expect } = require("chai");
const { describe } = require("mocha");
const proxyquire = require('proxyquire').noCallThru();
const bcrypt = require("bcryptjs");
const { aUser } = require("../../utils/factories");
const sinon = require("sinon");
const jwt = require("jsonwebtoken");
const { TokenExpiredError } = jwt;

describe("Auth controller (Unit Tests)", function () {

  let req, res, next;
  let statusStub, jsonStub;
  let usuario;
  let authController;

  this.beforeEach(function () {
    next = sinon.spy();
    statusStub = sinon.stub().returnsThis();
    jsonStub = sinon.stub().returnsArg(0);

    res = {
      status: statusStub,
      json: jsonStub
    };
  })

  this.afterEach(function () {
    sinon.restore();
  });

  describe('login', function () {
    let getUsuarioFake;

    this.beforeEach(function () {
      usuario = { ...aUser(1), activo: true };
      getUsuarioFake = sinon.stub();

      req = {
        matchedData: {
          correo: usuario.correo,
          clave: usuario.clave
        }
      };
    });

    describe('When user exists', function () {

      this.beforeEach(function () {
        getUsuarioFake = sinon.fake.resolves(usuario);
        authController = proxyquire('../../controllers/authController', {
          '../services/usuariosService': {
            getUsuarioByCorreo: getUsuarioFake
          }
        })
      })

      it("Should return token", function () {
        const compareFake = sinon.fake.resolves(true);
        sinon.replace(bcrypt, 'compare', compareFake)

        const expectedResponse = { token: generateToken({ sub: usuario.id }) }

        return authController.login(req, res, next)
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

        return authController.login(req, res, next)
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
        getUsuarioFake = sinon.fake.resolves({ ...usuario, activo: false });
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

  describe('generate password recovery token', function () {
    const correo = 'johndoe@example.com';

    this.beforeEach(function () {
      req = { matchedData: { correo } }
    });


    it('Should generate token and send email to user', function () {
      const getUsuarioFake = sinon.fake.resolves({ ...usuario, correo, requestedPasswordChange: false });
      const toggleStatusFake = sinon.fake.resolves(true);
      const sendEmailFake = sinon.fake.resolves(true);

      const { generatePasswordRecoveryToken } = proxyquire('../../controllers/authController', {
        '../services/usuariosService': {
          getUsuarioByCorreo: getUsuarioFake,
          toggleUsuarioRequestPasswordChange: toggleStatusFake
        },
        '../services/emailSenderService': {
          sendEmail: sendEmailFake
        }
      })

      return generatePasswordRecoveryToken(req, res, next)
        .then(() => {
          expect(getUsuarioFake.calledOnceWith(correo), 'get usuario').to.be.true;
          expect(sendEmailFake.calledOnce, 'send email').to.be.true;
          expect(toggleStatusFake.calledOnce, 'toggle status').to.be.true;
          expect(statusStub.calledOnceWith(200), 'called with 200').to.be.true;
          expect(jsonStub.calledOnceWith(sinon.match({ message: 'Se ha enviado un correo de recuperación de contraseña' })), 'json message').to.be.true;
        })

    });


    it('Should fail because user was not found', function () {
      const getUsuarioFake = sinon.fake.resolves(null);
      const { generatePasswordRecoveryToken } = proxyquire('../../controllers/authController', {
        '../services/usuariosService': {
          getUsuarioByCorreo: getUsuarioFake
        }
      })

      return generatePasswordRecoveryToken(req, res, next)
        .then(() => {
          expect(getUsuarioFake.calledOnceWith(correo), 'getUsuarioByCorreo called once').to.be.true;
          expect(statusStub.calledOnceWith(404), 'status called once').to.be.true;
          expect(jsonStub.calledOnceWith(sinon.match({ message: 'El usuario no existe' })), 'json called once').to.be.true;
        })
    })

    // what happens when
    // - request password change is truthy 
    // - toggling user request password change fails
    // - sending email fails
  })

  describe('handle password recovery token', function () {
    const sub = 1;
    const clave = 'password'
    this.beforeEach(function () {
      req = {
        matchedData: {
          token: generateToken({ sub }),
          clave
        }
      }
    })

    it('Should fail because user did not request password change', function () {
      const getUsuarioFake = sinon.fake.resolves({ ...aUser(sub), requestedPasswordChange: false });
      const { handlePasswordRecoveryToken } = proxyquire('../../controllers/authController', {
        '../services/usuariosService': {
          getUsuarioById: getUsuarioFake
        }
      })

      return handlePasswordRecoveryToken(req, res, next)
        .then(() => {
          expect(getUsuarioFake.calledOnceWith(sub), 'getUsuarioById').to.be.true;
          expect(statusStub.calledOnceWith(409), 'statusStub').to.be.true;
          expect(jsonStub.calledOnceWith(sinon.match({ message: "El usuario no ha solicitado un cambio de contraseña" })), 'jsonStub').to.be.true;
        })
    });

    it('Should fail because user is inactive', function () {
      const getUsuarioFake = sinon.fake.resolves({ ...aUser(sub), requestedPasswordChange: true, activo: false });
      const { handlePasswordRecoveryToken } = proxyquire('../../controllers/authController', {
        '../services/usuariosService': {
          getUsuarioById: getUsuarioFake,
        }
      })

      return handlePasswordRecoveryToken(req, res, next)
        .then(() => {
          expect(statusStub.calledOnceWith(409)).to.be.true;
          expect(jsonStub.calledOnceWith(sinon.match({ message: 'El usuario se encuentra inactivo' })));
          expect(getUsuarioFake.calledOnceWith(sub)).to.be.true;
        })
    });

    it('Should fail because token is invalid', function () {
      const getUsuarioFake = sinon.fake.resolves({ ...aUser(sub), requestedPasswordChange: true, activo: true });
      const { handlePasswordRecoveryToken } = proxyquire('../../controllers/authController', {
        '../services/usuariosService': {
          getUsuarioById: getUsuarioFake,
        }
      })

      const verifyJWTFake = sinon.fake.throws(new TokenExpiredError('jwt expired'));
      sinon.replace(jwt, 'verify', verifyJWTFake);

      return handlePasswordRecoveryToken(req, res, next)
        .then(() => {
          expect(verifyJWTFake.calledOnce, 'verifyJWT').to.be.true;
          expect(getUsuarioFake.callCount, 'getUsuario').to.equal(0);
          expect(statusStub.calledOnceWith(403), 'statusStub').to.be.true;
          expect(jsonStub.calledOnceWith(sinon.match({ message: 'Token invalido' })), 'jsonStub');
        })

    });

    it('Should update password', function () {
      const getUsuarioFake = sinon.fake.resolves({ ...aUser(sub), requestedPasswordChange: true, activo: true });
      const updateUserPasswordFake = sinon.fake.resolves(true);
      const toggleStatusFake = sinon.fake.resolves(true);
      const hashedClave = 'ha*Ash'
      const hashClaveFake = sinon.fake.resolves(hashedClave)
      const { handlePasswordRecoveryToken } = proxyquire('../../controllers/authController', {
        '../services/usuariosService': {
          getUsuarioById: getUsuarioFake,
          updateUserPassword: updateUserPasswordFake,
          toggleUsuarioRequestPasswordChange: toggleStatusFake
        },
        '../middlewares/auth': {
          hashClave: hashClaveFake
        }
      })

      return handlePasswordRecoveryToken(req, res, next)
        .then(() => {
          expect(getUsuarioFake.calledOnceWith(sub), 'getUsuario').to.be.true;
          expect(updateUserPasswordFake.calledOnceWith(sub, hashedClave), 'update password').to.be.true;
          expect(toggleStatusFake.calledOnceWith(sub), 'toggle status').to.be.true;
          expect(hashClaveFake.calledOnceWith(clave)).to.be.true;
          expect(statusStub.calledOnceWith(200), 'status').to.be.true;
          expect(jsonStub.calledOnceWith(sinon.match({ message: 'Contraseña actualizada' })), 'json').to.be.true;
        })
    })
  })

});
