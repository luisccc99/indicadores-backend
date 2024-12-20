/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-unused-expressions */
const chai = require('chai');
const sinon = require('sinon');

const { expect } = chai;
const { UsuarioIndicador } = require('../../models');
const UsuarioIndicadorService = require('../../services/usuarioIndicadorService');
const { relationInfo, usersToIndicador } = require('../../utils/factories');

describe('Usuario-Indicador service', function () {

  const relations = relationInfo();
  const userToIndicador = usersToIndicador();
  this.afterEach(function () {
    sinon.restore();
  });

  describe('Read operations', () => {
    it('Should return  a list of indicadores, its owner and how many users are responsible for them', () => {
      const findAndCountAllFake = sinon.fake.resolves({ rows: relations, count: relations.length });
      sinon.replace(UsuarioIndicador, 'findAndCountAll', findAndCountAllFake);
      return UsuarioIndicadorService.getUsuariosIndicadores()
        .then(res => {
          expect(findAndCountAllFake.calledOnce).to.be.true;
          expect(res.total).to.be.an('array').that.is.not.empty;
          expect(res.data).to.equal(relations.length);
        }
        );
    });

    it('Should return a list of how many users and the information about the relation between usuarios - indicadores. Also, it returns the name of the selected indicador', () => {
      const findAndCountAllFake = sinon.fake.resolves({ rows: userToIndicador, count: userToIndicador.length });
      sinon.replace(UsuarioIndicador, 'findAndCountAll', findAndCountAllFake);
      return UsuarioIndicadorService.getRelationUsers(1)
        .then(res => {
          expect(findAndCountAllFake.calledOnce).to.be.true;
          expect(res.data).to.be.an('array').that.is.not.empty;
          expect(res.total).to.equal(userToIndicador.length);
        }
        );
    });
  });

  describe('Create operations', () => {
    it('Creates a relation between a user and an indicador that expires in 1 day', () => {
      const desde = new Date();
      const hasta = new Date();
      hasta.setDate(desde.getDate() + 1)
      const createFake = sinon.fake.resolves(true);
      sinon.replace(UsuarioIndicador, 'bulkCreate', createFake);
      return UsuarioIndicadorService.createRelation([1], [1], {
        fechaDesde: desde,
        fechaHasta: hasta,
        updatedBy: 1,
        createdBy: 1,
        expires: 'SI'
      }).then(_ => {
        expect(createFake.calledOnce).to.be.true;
      })
    });

    it('Creates a relation between a user and multiple indicators that never expires', () => {
      const createFake = sinon.fake.resolves(true);
      sinon.replace(UsuarioIndicador, 'bulkCreate', createFake);
      return UsuarioIndicadorService.createRelation([1], [1, 2], {
        // fechaDesde: new Date(),
        // fechaHasta: new Date(),
        updatedBy: 1,
        createdBy: 1,
        expires: 'NO'
      }).then(_ => {
        expect(createFake.calledOnce).to.be.true;
      })
    }

    )

  }

  );
});