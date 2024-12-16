const faker = require('faker');
const { Tema, Indicador, Objetivo, CatalogoDetail } = require('../models')


const aDummyWithName = (id) => ({
	id,
	nombre: faker.random.word()
});

const aCodigo = () => `${faker.datatype.number(9)}${faker.datatype.number(9)}${faker.datatype.number(9)}`;
const randomYear = () => faker.datatype.number({ 'min': 2000, 'max': new Date().getFullYear() });

const anIndicador = (id, options) => {
	let temaInteres = options?.temaInteres;
	if (!options) {
		temaInteres = aTema(1)
	}
	const indicador = Indicador.build({
		id: id || faker.datatype.number(100),
		urlImagen: faker.image.imageUrl(),
		codigo: aCodigo(),
		nombre: `Indicador ${faker.random.word()}`,
		definicion: faker.lorem.sentence(),
		ultimoValorDisponible: faker.datatype.number(),
		anioUltimoValorDisponible: randomYear(),
		tendenciaActual: faker.datatype.boolean() ? "ASCENDENTE" : "DESCENDENTE",
		tendenciaDeseada: faker.datatype.boolean() ? "ASCENDENTE" : "DESCENDENTE",
		observaciones: faker.lorem.sentence(),
		createdBy: faker.datatype.number(9),
		updatedBy: faker.datatype.number(9),
		activo: faker.datatype.boolean(),
		fuente: faker.lorem.sentence(),
		periodicidad: faker.datatype.number(12),
		owner: faker.datatype.number(9),
		archive: faker.datatype.boolean(),
		updatedAt: new Date(),
		createdAt: new Date(),
		catalogos: [],
		Tema: temaInteres,
		objetivo: null,
	}, {
		include: [Tema, { model: Objetivo, as: 'objetivos' }]
	})
	indicador.validate()
	return indicador;
}

// TODO: take into account express-validator rules
const indicadorToCreate = () => {
	const indicador = Indicador.build({
		id: faker.datatype.number(),
		nombre: faker.random.word(),
		codigo: aCodigo(),
		definicion: faker.lorem.sentence(),
		ultimoValorDisponible: faker.datatype.number(),
		anioUltimoValorDisponible: randomYear(),
		periodicidad: faker.datatype.number({ min: 1, max: 120 }),
		tendenciaActual: faker.datatype.boolean() ? "ASCENDENTE" : "DESCENDENTE",
		observaciones: faker.random.words(10),
		fuente: faker.internet.url(),
		urlImagen: faker.image.avatar(),
		idObjetivo: 1,
		idTema: 1
	});
	return indicador.dataValues;
}

const aFormula = (id) => ({
	...(id && { id }),
	ecuacion: '\\frac{1}{x^2-1}',
	descripcion: faker.lorem.words(20)
});

const aVariable = (id) => ({
	...(id && { id }),
	nombre: faker.lorem.word(),
	descripcion: faker.lorem.word(),
	dato: faker.datatype.number(),
	anio: randomYear(),
	idUnidad: 1
});

const anHistorico = () => ({
	anio: randomYear(),
	valor: faker.datatype.number(),
	fuente: faker.random.word()
});

const aMapa = (id) => ({
	...(id && { id }),
	ubicacion: faker.random.word(),
	url: faker.internet.url(),
	urlImagen: faker.image.imageUrl()
});

const aUser = (id) => ({
	id,
	nombres: faker.name.firstName(),
	apellidoPaterno: faker.name.lastName(),
	apellidoMaterno: faker.name.lastName(),
	correo: faker.internet.email(),
	clave: faker.internet.password(8, false),
	activo: true,
	idRol: 1,
	requestedPasswordChange: id % 2 === 0,
});

const aTema = (id) => {
	const tema = Tema.build({
		id,
		codigo: aCodigo(),
		temaIndicador: faker.company.bsNoun(),
		observaciones: faker.lorem.words(20),
		activo: faker.datatype.boolean(),
		urlImagen: faker.image.imageUrl(),
		color: '#ffffff',
		descripcion: faker.lorem.paragraph(),
	});
	tema.validate();
	return tema;
}

const aRol = (id) => ({
	id,
	rol: faker.random.word().toUpperCase(),
	descripcion: faker.lorem.words(8),
	activo: faker.datatype.boolean ? 'SI' : 'NO',
	createdAt: new Date(),
	updatedAt: new Date()
});

/** Catalogos */

const someCatalogos = (id) => ([
	{
		id,
		nombre: 'ODS',
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: id + 1,
		nombre: 'Unidad Medida',
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: id + 2,
		nombre: 'Cobertura Geográfica',
		createdAt: new Date(),
		updatedAt: new Date()
	},
]);

const someCatalogosDetails = (id, idCatalogo) => ([
	{
		id,
		nombre: faker.random.word(),
		idCatalogo,
		createdAt: new Date(),
		updatedAt: new Date()
	}
]);

const someCatalogosFromIndicador = (idIndicador) => ([
	{
		id: 1,
		idIndicador,
		idCatalogoDetail: 1,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 2,
		idIndicador,
		idCatalogoDetail: 2,
		createdAt: new Date(),
		updatedAt: new Date()
	},
	{
		id: 3,
		idIndicador,
		idCatalogoDetail: 3,
		createdAt: new Date(),
		updatedAt: new Date()
	},
]);

const someHistoricos = (idIndicador) => ([
	{
		id: 1,
		valor: faker.datatype.number(),
		anio: 2022,
		fuente: faker.random.word(),
		idIndicador: idIndicador,
		createdAt: new Date(),
		ecuacion: 'No aplica',
		descripcionEcuacion: 'No aplica',
	},
	{
		id: 2,
		valor: faker.datatype.number(),
		anio: 2021,
		fuente: faker.random.word(),
		idIndicador: idIndicador,
		createdAt: new Date(),
		ecuacion: 'No aplica',
		descripcionEcuacion: 'No aplica',
	},
	{
		id: 3,
		valor: faker.datatype.number(),
		anio: 2020,
		fuente: faker.random.word(),
		idIndicador: idIndicador,
		createdAt: new Date(),
		ecuacion: 'No aplica',
		descripcionEcuacion: 'No aplica',
	},
]);

const relationInfo = () => ([
	{
		id: 1,
		nombre: faker.random.word(),
		owner: faker.random.word(),
		updatedAt: new Date(),
		count: faker.datatype.number(),
	},
	{
		id: 2,
		nombre: faker.random.word(),
		owner: faker.random.word(),
		updatedAt: new Date(),
		count: faker.datatype.number(),
	},
	{
		id: 3,
		nombre: faker.random.word(),
		owner: faker.random.word(),
		updatedAt: new Date(),
		count: faker.datatype.number(),
	},
]);

const usersToIndicador = () => ([
	{
		id: 1,
		idUsuario: 1,
		fechaDesde: new Date(),
		fechaHasta: new Date(),
		expires: 'SI',
		createdBy: 1,
		usuario: {
			nombres: faker.name.firstName(),
			apellidoPaterno: faker.name.lastName(),
			apellidoMaterno: faker.name.lastName(),
		}
	},
	{
		id: 2,
		idUsuario: 6,
		fechaDesde: null,
		fechaHasta: null,
		expires: 'NO',
		createdBy: 1,
		usuario: {
			nombres: faker.name.firstName(),
			apellidoPaterno: faker.name.lastName(),
			apellidoMaterno: faker.name.lastName(),
		}
	},
	{
		id: 3,
		idUsuario: 7,
		fechaDesde: new Date(),
		fechaHasta: new Date(),
		expires: 'SI',
		createdBy: 1,
		usuario: {
			nombres: faker.name.firstName(),
			apellidoPaterno: faker.name.lastName(),
			apellidoMaterno: faker.name.lastName(),
		}
	}
]);

const anObjetivo = (id) => ({
	id,
	titulo: faker.lorem.words(Math.floor(Math.random() * 10) + 1),
	descripcion: faker.lorem.sentence(),
	urlImagen: faker.image.imageUrl(),
	color: faker.internet.color(),
	createdAt: new Date(),
	updatedAt: new Date()
})

module.exports = {
	anIndicador,
	aUser,
	aTema,
	aDummyWithName,
	aRol,
	indicadorToCreate,
	aFormula,
	aVariable,
	anHistorico,
	aMapa,
	someCatalogos,
	someCatalogosDetails,
	someCatalogosFromIndicador,
	aCodigo,
	randomYear,
	someHistoricos,
	relationInfo,
	usersToIndicador,
	anObjetivo
};