const chai = require('chai');
const chaiHttp = require('chai-http');
require('dotenv').config();
chai.use(chaiHttp);
const { aMapa, aUser, indicadorToCreate, anHistorico, aFormula, aVariable } = require("../../utils/factories")
const { app } = require('../../../app');
const {
  Indicador, Usuario, Rol,
  Mapa, sequelize, IndicadorObjetivo,
  Tema, IndicadorTema, Objetivo,
  UsuarioIndicador, Historico,
  Formula, Variable
} = require('../../models');
const { faker } = require('@faker-js/faker');
const { generateToken } = require('../../middlewares/auth');
const { getIndicadorDTO } = require('../utils/commonStubs');
const { expect } = chai;

describe('/v1/indicadores (Integration tests)', () => {
  let adminRol, userRol;
  let usuarioA, usuarioB, usuarioInactivo, admin;
  let indicadorA, indicadorB, indicadorInactivo;

  before('Set up usuarios and indicadores', () => {
    return sequelize.transaction(async _t => {
      const roles = await createRoles();
      [adminRol, userRol] = roles;

      const usuarios = await createUsuarios({ userRol: userRol.id, adminRol: adminRol.id });
      [usuarioA, usuarioB, usuarioInactivo, admin] = usuarios;
      const objetivo = await Objetivo.create({ titulo: faker.word.words(5) });
      const tema = await Tema.create({
        temaIndicador: faker.word.words(3),
        codigo: faker.word.sample(3).toUpperCase(),
        descripcion: faker.word.words(10)
      });

      const indicadores = await createIndicadores({ createdById: admin.id, updatedById: usuarioA.id });
      [indicadorA, indicadorB, indicadorInactivo] = indicadores;

      await IndicadorObjetivo.bulkCreate([{
        idIndicador: indicadorA.id,
        idObjetivo: objetivo.id
      }, {
        idIndicador: indicadorB.id,
        idObjetivo: objetivo.id
      }, {
        idIndicador: indicadorInactivo.id,
        idObjetivo: objetivo.id
      }])
      await IndicadorTema.bulkCreate([{
        idIndicador: indicadorA.id,
        idTema: tema.id
      }, {
        idIndicador: indicadorB.id,
        idTema: tema.id
      }, {
        idIndicador: indicadorInactivo.id,
        idTema: tema.id
      }])

      const usuariosIndicadores = [];
      for (let i = 0; i < indicadores.length; i++) {
        for (let j = 0; j < usuarios.length; j++) {
          const currentIndicador = indicadores[i];
          const currentUsuario = usuarios[j];
          const isOwner = admin.id === currentUsuario.id;

          usuariosIndicadores.push({
            idIndicador: currentIndicador.id,
            idUsuario: currentUsuario.id,
            createdBy: admin.id,
            isOwner,
          })
        }
      };

      await UsuarioIndicador.bulkCreate(usuariosIndicadores).catch(console.log)
    })
  })

  after('Remove usuarios and indicadores', () => {
    return sequelize.transaction(async _t => {
      await IndicadorObjetivo.destroy({ truncate: { cascade: true } })
      await IndicadorTema.destroy({ truncate: { cascade: true } })
      await UsuarioIndicador.destroy({ truncate: { cascade: true } })

      await Indicador.destroy({ truncate: { cascade: true } })
      await Tema.destroy({ truncate: { cascade: true } })
      await Usuario.destroy({ truncate: { cascade: true } });
      await Rol.destroy({ truncate: { cascade: true } });
      await Objetivo.destroy({ truncate: { cascade: true } })
    }).catch(console.log)
  })

  describe('Public endpoints', () => {

    describe('GET /:idIndicador', () => {
      it('Should return 404 because indicador does not exist', done => {
        chai.request(app)
          .get('/api/v1/indicadores/999')
          .end((_, res) => {
            expect(res).to.have.status(404);
            done()
          })
      });


      it('Should return 409 because indicador is not active', done => {
        chai.request(app)
          .get(`/api/v1/indicadores/${indicadorInactivo.id}`)
          .end((_, res) => {
            expect(res).to.have.status(409);
            expect(res.body.message).to.be.equal(`"Indicador" con id "${indicadorInactivo.id}" se encuentra inactivo`);
            done();
          })
      });


      it('Should return status code 422 if :idIndicador is invalid', done => {
        chai.request(app)
          .get('/api/v1/indicadores/uno')
          .end((_, res) => {
            expect(res.error).to.not.be.null;
            expect(res).to.have.status(422);
            done();
          });
      });


      it('Should return an indicador', done => {
        chai.request(app)
          .get(`/api/v1/indicadores/${indicadorA.id}`)
          .end((_, res) => {
            expect(res).to.have.status(200);
            done();
          });
      });
    })


    describe('GET /:idIndicador/usuarios', () => {
      it('Should return 404 because indicador does not exist', done => {
        chai.request(app)
          .get('/api/v1/indicadores/8921/usuarios')
          .end((_, res) => {
            expect(res).to.have.status(404);
            expect(res.body.message).to.be.equal('No se encontró el elemento (Indicador) con id "8921"');
            done()
          })
      });


      it('Should return 409 because indicador is not active', done => {
        chai.request(app)
          .get(`/api/v1/indicadores/${indicadorInactivo.id}/usuarios`)
          .end((_, res) => {
            expect(res).to.have.status(409);
            expect(res.body.message).to.be.equal(`"Indicador" con id "${indicadorInactivo.id}" se encuentra inactivo`);
            done()
          })
      });


      it('Should return 200 with usuarios assigned to an indicador', done => {
        chai.request(app)
          .get(`/api/v1/indicadores/${indicadorB.id}/usuarios`)
          .end((_, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.an('array').that.is.not.empty;
            expect(res.body.data[0]).to.not.have.property('clave');
            done();
          })
      });

    });


    describe('GET /:idIndicador/mapa', () => {
      before('Assign mapa to indicador', () => {
        return Mapa.create({
          ubicacion: faker.system.directoryPath(),
          url: faker.internet.url(),
          urlImagen: faker.image.url(),
          idIndicador: indicadorA.id
        })
      })

      after('Delete mapas', () => {
        return Mapa.destroy({ truncate: true })
      })

      it('Should return 404 because indicador does not exist', done => {
        chai.request(app)
          .get('/api/v1/indicadores/999/mapa')
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(404);
            done();
          })
      })

      it('Should return 409 because indicador is not active', done => {
        chai.request(app)
          .get(`/api/v1/indicadores/${indicadorInactivo.id}/mapa`)
          .end((_err, res) => {
            expect(res.status).to.be.equal(409);
            done();
          })
      })

      it('Should return the mapa of an indicador', done => {
        chai.request(app)
          .get(`/api/v1/indicadores/${indicadorA.id}/mapa`)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body).to.not.be.empty;
            done();
          })
      });
    })


    describe('GET /:idIndicador/historicos', () => {
      before('Assign historicos to indicador', () => {
        return Historico.bulkCreate([{
          valor: 123,
          fuente: faker.internet.url(),
          ecuacion: 'x = x^2',
          descripcionEcuacion: faker.word.words(5),
          anio: faker.date.past({ years: 5 }).getFullYear(),
          pushedBy: usuarioB.id,
          idIndicador: indicadorA.id
        }])
      });

      after(() => {
        return Historico.destroy({ truncate: { cascade: true } });
      })

      it('Should return 404 because indicador does not exist', done => {
        chai.request(app)
          .get('/api/v1/indicadores/999/historicos')
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(404);
            done();
          })
      })

      it('Should return 409 because indicador is not active', done => {
        chai.request(app)
          .get(`/api/v1/indicadores/${indicadorInactivo.id}/historicos`)
          .end((_err, res) => {
            expect(res.status).to.be.equal(409);
            done();
          })
      });

      it('Should return 200 with historic data of an indicador', done => {
        chai.request(app)
          .get(`/api/v1/indicadores/${indicadorA.id}/historicos`)
          .end((_err, res) => {
            expect(res.status).to.be.equal(200);
            expect(res.body.data).to.be.an('array').that.is.not.empty;
            done()
          })
      })
    });


    describe('GET /:idIndicador/formula', () => {
      before('Create formula', () => {
        return sequelize.transaction(async _t => {
          const formula = await Formula.create({
            ecuacion: 'x = x^2',
            descripcion: faker.word.words(5),
            isFormula: 'SI',
            idIndicador: indicadorB.id
          })

          await Variable.create({
            nombre: faker.word.sample(),
            descripcion: faker.word.words(4),
            dato: faker.number.int({ min: 1, max: 200 }),
            unidadMedida: faker.word.sample(),
            anio: faker.date.past().getFullYear(),
            idFormula: formula.id
          })
        })
      })

      after('Remove formula', () => {
        return sequelize.transaction(async _t => {
          await Variable.destroy({ truncate: { cascade: true } })
          await Formula.destroy({ truncate: { cascade: true } })
        })
      })

      it('Should return 404 because indicador does not exist', done => {
        chai.request(app)
          .get('/api/v1/indicadores/999/formula')
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(404);
            done();
          })
      })


      it('Should return 409 because indicador is not active', done => {
        chai.request(app)
          .get(`/api/v1/indicadores/${indicadorInactivo.id}/formula`)
          .end((_err, res) => {
            expect(res.status).to.be.equal(409);
            done();
          })
      })


      it('Should return 200 with formula and variables of an indicador', done => {
        chai.request(app)
          .get(`/api/v1/indicadores/${indicadorB.id}/formula`)
          .end((_err, res) => {
            expect(res.status).to.be.equal(200);
            expect(res.body.data).to.be.an('object');
            done();
          })
      })
    });
  })


  describe('Private endpoints', () => {
    let validToken = ''
    let usuarioAToken, usuarioInactivoToken, adminToken;

    before(() => {
      usuarioAToken = generateToken({ sub: usuarioA.id });
      usuarioInactivoToken = generateToken({ sub: usuarioInactivo.id });
      adminToken = generateToken({ sub: admin.id });
    })

    describe('GET /', () => {
      it('Should return list of indicadores', done => {
        chai.request(app)
          .get('/api/v1/indicadores')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .end((_err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.an('array').that.is.not.empty;
            expect(res.body.data).to.not.be.undefined;
            // private field that only this endpoint with the bearer token can return 
            expect(Object.keys(res.body.data[0])).to.include('updatedBy');
            done();
          })
      })

      it('Should fail to return list because user is not active', done => {
        chai.request(app)
          .get('/api/v1/indicadores')
          .set({ Authorization: `Bearer ${usuarioInactivoToken}` })
          .end((_err, res) => {
            expect(res).to.have.status(403);
            expect(res.text).to.be.equal('Esta cuenta se encuentra deshabilitada')
            done();
          })
      })

      it('Should fail because query params are wrong', done => {
        chai.request(app)
          .get('/api/v1/indicadores?activo=invalidValue')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .end((_err, res) => {
            expect(res).to.have.status(422);
            expect(res.body.errors).to.be.an('array').that.is.not.empty;
            done()
          })
      })

      it('Should fail because request does not have auth token', done => {
        chai.request(app)
          .get('/api/v1/indicadores')
          .end((_err, res) => {
            expect(res).to.have.status(401);
            done();
          })
      })
    })


    describe('POST /', () => {
      const validIndicador = getIndicadorDTO();
      it('Should create an indicador successfully', function (done) {
        const toCreate = indicadorToCreate();

        chai.request(app)
          .post('/api/v1/indicadores')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .type('form')
          .send(toCreate)
          .end(function (_err, res) {
            expect(res).to.have.status(201);
            expect(res.body.data).to.not.be.undefined;
            expect(res.body.data).to.not.be.empty;
            done();
          });
      });

      it('Should create an indicador with formula and variables', function (done) {
        const toCreate = indicadorToCreate();
        const formula = aFormula(1);
        formula.variables = [aVariable(), aVariable()];
        toCreate.formula = formula;

        chai.request(app)
          .post('/api/v1/indicadores')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .send(toCreate)
          .end(function (_err, res) {
            expect(res).to.have.status(201);
            done()
          });
      });

      it('Should fail to create an indicador with formula and variables', function (done) {
        const dto = getIndicadorDTO();

        const indicador = indicadorToCreate();
        const formula = aFormula(1);
        const badVariable = aVariable();
        badVariable.anio = -1;
        formula.variables = [badVariable];
        indicador.formula = formula;

        chai.request(app)
          .post('/api/v1/indicadores')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .type('form')
          .send(dto)
          .end(function (err, res) {
            expect(err).to.be.null;
            expect(res).to.have.status(422);
            expect(res.body.errors).to.be.an('array');
            done()
          });
      });

      it('Should create an indicador with historicos', function (done) {
        const toCreate = indicadorToCreate();
        toCreate.historicos = [anHistorico()];

        chai.request(app)
          .post('/api/v1/indicadores')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .send(toCreate)
          .end(function (err, res) {
            expect(err).to.be.null;
            expect(res).to.have.status(201);
            done()
          });
      });

      it('Should fail to create an indicador with bad formatted historicos', function (done) {
        const toCreate = indicadorToCreate();
        const badHistorico = anHistorico();
        badHistorico.anio = 'not a year';
        badHistorico.valor = 'not a number';
        toCreate.historicos = [badHistorico];

        chai.request(app)
          .post('/api/v1/indicadores')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .send(toCreate)
          .end(function (err, res) {
            expect(err).to.be.null;
            expect(res).to.have.status(422);
            expect(res.body.errors).to.be.an('array').with.lengthOf(2);
            done()
          });
      });

      it('Should create an indicador with a mapa', function (done) {
        const toCreate = indicadorToCreate();
        toCreate.mapa = aMapa();

        chai.request(app)
          .post('/api/v1/indicadores')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .send(toCreate)
          .end(function (_err, res) {
            expect(res).to.have.status(201);
            done()
          });
      });

      it('Should fail to create an indicador with a bad formatted mapa', function (done) {
        const toCreate = indicadorToCreate();
        const badMapa = aMapa();
        badMapa.url = 'not a url pattern';
        toCreate.mapa = badMapa;

        chai.request(app)
          .post('/api/v1/indicadores')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .send(toCreate)
          .end(function (err, res) {
            expect(err).to.be.null;
            expect(res).to.have.status(422);
            expect(res.body.errors).to.be.an('array').with.lengthOf(1);
            done()
          });
      });

      it('Should fail to create indicador due to semantic errors', function (done) {
        const { codigo, ...invalidIndicador } = indicadorToCreate();

        chai.request(app)
          .post('/api/v1/indicadores')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .send(invalidIndicador)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(422);
            expect(res.body.errors).to.be.an('Array').that.is.not.empty;
            done();
          });

      });

      it('Should not create indicador because req does not have JWT', function (done) {
        chai.request(app)
          .post('/api/v1/indicadores')
          .send(validIndicador)
          .end(function (err, res) {
            expect(res).to.have.status(401);
            done();
          });
      });

      it('Should not create indicador because token expired', function (done) {
        chai.request(app)
          .post('/api/v1/indicadores')
          .set({ Authorization: 'Bearer valid' })
          .send(validIndicador)
          .end(function (err, res) {
            expect(res).to.have.status(403)
            done()
          });
      });

      it('Should not create indicador because connection to DB failed', function (done) {

        chai.request(app)
          .post('/api/v1/indicadores')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .send(validIndicador)
          .end(function (err, res) {
            expect(res).to.have.status(500);
            expect(res.error.text).to.not.be.empty
            done();
          })
      });

    })


    describe('PATCH /:idIndicador', () => {

      it('Should fail to update indicador because user is not assigned to given indicador', function (done) {

        chai.request(app)
          .patch('/api/v1/indicadores/1')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .send(validIndicador)
          .end((_err, res) => {
            expect(res).to.have.status(403);
            expect(res.error.text).to.be.equal('No tienes permiso para realizar esta operación');
            done();
          });
      });

      it('Should fail to update indicador due to semantic errors', function (done) {
        const invalidIndicador = indicadorToCreate();
        invalidIndicador.tendenciaActual = 1;
        invalidIndicador.codigo = 'not valid';
        invalidIndicador.anioUltimoValorDisponible = 'not valid';

        chai.request(app)
          .patch('/api/v1/indicadores/1')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .send(invalidIndicador)
          .end(function (err, res) {
            expect(res).to.have.status(422);
            done();
          });
      });

      it('Should fail to update indicador because token is not present', function (done) {
        chai.request(app)
          .patch('/api/v1/indicadores/1')
          .send(validIndicador)
          .end(function (err, res) {
            expect(res).to.have.status(401);
            done();
          })
      });

      it('Should fail to update indicador because token is invalid', function (done) {
        chai.request(app)
          .patch('/api/v1/indicadores/1')
          .set({ Authorization: 'Bearer notvalid' })
          .send(validIndicador)
          .end(function (err, res) {
            expect(res).to.have.status(403);
            done();
          })
      });

      it('Should fail to update because connection to DB fails', function (done) {

        chai.request(app)
          .patch('/api/v1/indicadores/1')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .send(validIndicador)
          .end(function (err, res) {
            expect(res).to.have.status(500);
            done();
          });
      });

      it('Should fail to update indicador because user is not active')

      it("Should update indicador even though user is not assigned to indicador, because user has 'ADMIN' role", function (done) {

        chai.request(app)
          .patch('/api/v1/indicadores/1')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .send(validIndicador)
          .end(function (err, res) {
            expect(err).to.be.null;
            expect(res).to.have.status(204);
            done();
          })
      });

      it('Should update indicador successfully (user rol)', function (done) {
        chai.request(app)
          .patch('/api/v1/indicadores/1')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .send(validIndicador)
          .end(function (err, res) {
            expect(res).to.have.status(204);
            done();
          });
      });

    })


    describe('GET /indicadores/:idIndicador/formula', () => {
      it('Should return formula and variables of an indicador', function (done) {
        chai.request(app)
          .get('/api/v1/indicadores/1/formula')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(200);
            expect(res.body.data).to.not.be.empty;
            expect(res.body.data.variables).to.be.an('array');
            expect(res.body.data.variables).to.have.length(2)
            expect(res.body.data.ecuacion).to.be.an('string');
            expect(res.body.data.descripcion).to.be.an('string');
            done();
          });
      })

      it('Should return no data because indicador does not have formula', function (done) {
        chai.request(app)
          .get('/api/v1/indicadores/1/formula')
          .set({ Authorization: `Bearer ${usuarioAToken}` })
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.data).to.be.an('object').and.be.empty;
            done();
          })
      })
    })


    describe('GET /info/general', () => {
      it('Should test getInformation endpoint')
    })


    describe('POST /:idIndicador/historicos', () => {

    });


    describe('POST /:idIndicador/objetivos/status', () => {

    });


    describe('POST /:idIndicador/formula', () => {
      it('Should create formula for an Indicador', function (done) {
        const formula = aFormula(1);
        chai.request(app)
          .post('/api/v1/indicadores/1/formula')
          .set('Authorization', `Bearer ${usuarioAToken}`)
          .send(formula)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(201);
            done();
          })
      });

      it('Should create formula with variables for an Indicador', function (done) {
        const formulaWithVariables = { ...aFormula(), variables: [aVariable(1), aVariable(2)] }
        chai.request(app)
          .post('/api/v1/indicadores/1/formula')
          .set('Authorization', `Bearer ${usuarioAToken}`)
          .send(formulaWithVariables)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(201);
            done();
          })
      });

      it('Should fail to create formula because indicador does not exist', function (done) {
        const formulaWithVariables = { ...aFormula(), variables: [aVariable(1)] }
        chai.request(app)
          .post('/api/v1/indicadores/1/formula')
          .set('Authorization', `Bearer ${usuarioAToken}`)
          .send(formulaWithVariables)
          .end((err, res) => {
            expect(err).to.be.null;
            expect(res).to.have.status(404)
            done();
          })
      })
    })


    describe('GET /:idIndicador/objetivos/status', () => {

    });


    describe('POST /:idIndicador/mapa', () => {
      const mapa = aMapa();

      it('Should create a mapa for an indicador', done => {
        chai.request(app)
          .post('/api/v1/indicadores/1/mapa')
          .set('Authorization', `Bearer ${validToken}`)
          .type('form')
          .field('ubicacion', mapa.ubicacion)
          .field('url', mapa.url)
          .attach('urlImagen', Buffer.alloc(500_000), 'image.jpg')
          .end((err, res) => {
            expect(res).to.have.status(201);
            done();
          })
      });

      it('Should fail because JWT is not present', done => {
        chai.request(app)
          .post('/api/v1/indicadores/1/mapa')
          .type('form')
          .field('ubicacion', mapa.ubicacion)
          .end((err, res) => {
            expect(res).to.have.status(401);
            done();
          })
      });

      it('Should fail because user is not assigned to the indicador', done => {
        chai.request(app)
          .post('/api/v1/indicadores/1/mapa')
          .set('Authorization', `Bearer ${validToken}`)
          .type('form')
          .field('ubicacion', mapa.ubicacion)
          .field('url', mapa.url)
          .attach('urlImagen', Buffer.alloc(500_000), 'image.jpg')
          .end((err, res) => {
            expect(res).to.have.status(403);
            done();
          })
      });

      it('Should fail because indicador does not exist', done => {
        chai.request(app)
          .post('/api/v1/indicadores/1/mapa')
          .set('Authorization', `Bearer ${validToken}`)
          .type('form')
          .field('ubicacion', mapa.ubicacion)
          .field('url', mapa.url)
          .attach('urlImagen', Buffer.alloc(500_000), 'image.jpg')
          .end((err, res) => {
            expect(res).to.have.status(404)
            done();
          })

      });

      it('Should fail because request body has validation errors', done => {
        chai.request(app)
          .post('/api/v1/indicadores/1/mapa')
          .set('Authorization', `Bearer ${validToken}`)
          .type('form')
          .field('ubicacion', mapa.ubicacion)
          .field('url', 'not a URL pattern')
          .attach('urlImagen', Buffer.alloc(1_000_000), 'image.jpg')
          .end((err, res) => {
            expect(res).to.have.status(422)
            done();
          })
      });
    })


    describe('PATCH /:idIndicador/toggle-status', () => {
      it('Should fail because indicador does not exist');
      it('Should fail because user has invalid role');
      it('Should toggle status of indicador');
    })

    describe('POST /:idIndicador/usuarios', () => {
      it('Should test createRelationUI controller')
    })
  });
})


const getSimpleIndicador = ({ createdBy, updatedBy }) => {
  const indicador = Indicador.build({
    urlImagen: faker.image.url(),
    nombre: faker.word.words(3),
    definicion: faker.word.words(20),
    ultimoValorDisponible: faker.number.float({ min: 1, max: 1000 }),
    anioUltimoValorDisponible: faker.date.past().getFullYear(),
    createdBy,
    updatedBy,
  });
  return indicador.toJSON();
}

const createRoles = async () => {
  return Rol.bulkCreate([{
    rol: 'ADMIN',
    descripcion: faker.lorem.words(5),
    activo: 'SI',
  }, {
    rol: 'USER',
    descripcion: faker.lorem.words(5),
    activo: 'SI',
  }], { returning: true });
}

const createUsuarios = async ({ userRol, adminRol }) => {
  return Usuario.bulkCreate([
    { ...aUser(), activo: true, idRol: userRol },
    { ...aUser(), activo: true, idRol: userRol },
    { ...aUser(), activo: false, idRol: userRol },
    { ...aUser(), activo: true, idRol: adminRol }
  ], { returning: true });
}


const createIndicadores = async ({ createdById, updatedById }) => {
  const values = [{
    ...getSimpleIndicador({ createdBy: createdById, updatedBy: updatedById }),
    activo: true,
  }, {
    ...getSimpleIndicador({ createdBy: createdById, updatedBy: updatedById }),
    activo: true,
  }, {
    ...getSimpleIndicador({ createdBy: createdById, updatedBy: updatedById }),
    activo: false
  }]
  return Indicador.bulkCreate(values, {
    returning: true
  });
}