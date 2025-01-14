const { faker } = require("@faker-js/faker");
const { aTema, anIndicador, aVariable, indicadorToCreate } = require("../../utils/factories");

const stubExistsMiddleware = (stub, options) => {
    let exists = options?.exists;
    if (!options) {
        exists = true;
    }
    stub.onCall(0).resolves({ count: exists ? 1 : 0 });
    return stub;
}

const stubGetOneIndicador = (stub, options) => {
    const indicador = options?.indicador || anIndicador();
    stub.onCall(1).resolves(indicador);
}

const stubPrevAndNextIndicadores = (stub, options) => {
    const prev = options?.prev || { id: 2 };
    const next = options?.next || { id: 4 };
    stub.onCall(0).resolves([prev, next])
    return stub;
}

const stubVerifyUserStatus = (stub, options) => {
    let isActive = options?.isActive;
    if (!options) {
        isActive = true;
    }
    stub.onCall(0).resolves({ activo: isActive ? 'SI' : 'NO' });
    return stub;
}

const stubVerifyUserRol = (stub, options) => {
    const role = options?.role || [];
    stub.onCall(1).resolves({ rolValue: role })
}

const getIndicadorWithTema = () => {
    const temaInteres = aTema(1);
    temaInteres.activo = true;
    const indicador = anIndicador(1, temaInteres)
    indicador.activo = true
    return indicador;
}

const getInactiveIndicadorWithTema = () => {
    const temaInteres = aTema(1);
    temaInteres.activo = true;
    const indicador = anIndicador(1, temaInteres)
    indicador.activo = false
    return indicador;
}

const getIndicadorWithInactiveTema = () => {
    const temaInteres = aTema(1)
    temaInteres.activo = true
    const indicador = anIndicador(1, { temaInteres })
    indicador.activo = true
    return indicador;
}

const stubCreateIndicador = (stub, values) => {
    stub.onCall(0).resolves({ id: 1, ...values })
    return stub;
}

const stubCreateUsuarioIndicadorRelation = (stub) => {
    stub.onCall(0).resolves(true); // TODO: check what bulk create returns
    return stub;
}

const stubverifyUserCanPerformActionOnIndicador = (stub, options) => {
    let isAssignedToIndicador = true;
    if (options) {
        isAssignedToIndicador = options.isAssignedToIndicador;
    }

    stub.onCall(0).resolves({ count: isAssignedToIndicador ? 1 : 0 });
}

/**
 * 
 * @returns an instance of form data which is what a frontend client would send when creating a new indicador
 */
const getIndicadorDTO = () => {
    const fd = new FormData()
    const { nombre, codigo, definicion, ultimoValorDisponible, anioUltimoValorDisponible, periodicidad } = indicadorToCreate()
    fd.append('nombre', nombre);
    fd.append('codigo', codigo);
    fd.append('definicion', definicion);
    fd.append('ultimoValorDisponible', ultimoValorDisponible);
    fd.append('anioUltimoValorDisponible', -10);
    fd.append('periodicidad', periodicidad);
    fd.append('idTema', faker.number.int(10));

    const idTema = 1;
    const formula = aTema()
    formula.variables = [aVariable(1)]
    /**
     * nombre', 'codigo', 'definicion', 'ultimoValorDisponible' -> exists
     * anioUltimoValorDisponible -> numeric
     * periodicidad -> int	
     * idTema -> exists int
     * 
     * formula.ecuacion -> optional
     * formula.isFormula -> optional SI or NO
     * formula.variables -> is array
     * 
     * observaciones', 'formula.descripcion', 'historicos.*.fuente',
        'formula.variables.*.descripcion', 'formula.variables.*.nombre',
        'mapa.ubicacion', 'fuente -> optional string

     * 
     * 'historicos.*.anio', 'formula.variables.*.anio' -> valid year 
     * 'catalogos.*', 'formula.variables.*.idUnidad' -> is numeric
     * 
     * historicos.*.valor -> isNumeric
     * 
     * formula.variables.*.dato -> trim
     * 
     * mapa.url -> isURL
     */

    return fd;
}


module.exports = {
    stubExistsMiddleware,
    stubGetOneIndicador,
    stubPrevAndNextIndicadores,
    stubVerifyUserStatus,
    stubVerifyUserRol,
    getIndicadorWithTema,
    getInactiveIndicadorWithTema,
    getIndicadorWithInactiveTema,
    stubCreateIndicador,
    stubCreateUsuarioIndicadorRelation,
    stubverifyUserCanPerformActionOnIndicador,
    getIndicadorDTO,
}
