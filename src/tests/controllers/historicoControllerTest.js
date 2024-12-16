const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
require('dotenv').config();
chai.use(chaiHttp);
const { expect } = chai;
const { app } = require('../../../app');

const { Historico, Usuario, Indicador } = require('../../models');
const { someHistoricos, anIndicador } = require('../../utils/factories');
const { TOKEN_SECRET } = process.env;

describe('v1/historicos', function () {
    const historicos = someHistoricos(1);
    const indicador = anIndicador(1);

    const validToken = jwt.sign({ sub: 1 }, TOKEN_SECRET, { expiresIn: '5h' });

    const adminRol = { rolValue: 'ADMIN' };
    const userRol = { roles: 'USER' };
    const statusActive = { activo: 'SI' };

    this.beforeEach(function () {
        findOneFake = sinon.stub(Usuario, 'findOne');
        findOneFake.onFirstCall().resolves(statusActive);
        findOneFake.onSecondCall().resolves(adminRol);
    });

    this.afterEach(function () {
        sinon.restore();
    });

    describe('GET /historicos', function () {
        it('Should return a list of historicos with an INNER JOIN from indicadores', function () {
            const findAndCountALlFake = sinon.fake.resolves({ rows: historicos, count: historicos.length });
            sinon.replace(Historico, 'findAndCountAll', findAndCountALlFake);

            chai.request(app)
                .get('/api/v1/historicos/1')
                .set('Authorization', `Bearer ${validToken}`)
                .then(res => {
                    expect(findOneFake.calledOnce).to.be.true;
                    expect(findAndCountALlFake.calledOnce).to.be.true;
                    expect(res.body.historicos).to.be.an('array').that.is.not.empty;
                    expect(res.body.total).to.equal(historicos.length);
                });
        });
    });

    describe('DELETE /historicos/:id', function () {
        it('Should delete an historico', function () {
            const destroyFake = sinon.fake.resolves(true);
            sinon.replace(Historico, 'destroy', destroyFake);
            chai.request(app)
                .delete('/api/v1/historicos/1')
                .set('Authorization', `Bearer ${validToken}`)
                .then(res => {
                    expect(destroyFake.calledOnce).to.be.true;
                    expect(res.body).to.be.true;
                });
        });

        it('Should not delete an historico due to invalid token', function () {
            const destroyFake = sinon.fake.resolves(true);
            sinon.replace(Historico, 'destroy', destroyFake);
            chai.request(app)
                .delete('/api/v1/historicos/1')
                .then(res => {
                    expect(destroyFake.calledOnce).to.be.false;
                    expect(res.body).to.be.false;
                });
        });

    });

    // describe('UPDATE /historicos/:id', function () {
    //     it('Should update an existing historico', function (done) {
    //         const updateFake = sinon.fake.resolves(1);
    //         sinon.replace(Historico, 'update', updateFake);

    //         chai.request(app)
    //             .patch('/api/v1/historicos/1')
    //             .set('Authorization', `Bearer ${validToken}`)
    //             .send({
    //                 valor: '1.5',
    //                 fuente: 'Fuente',
    //             })
    //             .end(function (err, res) {
    //                 expect(res).to.have.status(204);
    //                 expect(updateFake.calledOnce).to.be.true;
    //                 done();
    //             });
    //     });
    // });
});