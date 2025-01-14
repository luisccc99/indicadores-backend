const { faker } = require('@faker-js/faker');
const { Tema, Indicador, Objetivo } = require('../models')

const aDummyWithName = (id) => ({
	id,
	nombre: faker.word.sample()
});

const aCodigo = () => `${faker.number.int(9)}${faker.number.int(9)}${faker.number.int(9)}`;
const randomYear = () => faker.number.int({ 'min': 2000, 'max': new Date().getFullYear() });

const anIndicador = (id, options) => {
	let temaInteres = options?.temaInteres;
	if (!options) {
		temaInteres = aTema(1)
	}
	const indicador = Indicador.build({
		id: id || faker.number.int(100),
		urlImagen: faker.image.url(),
		codigo: aCodigo(),
		nombre: `Indicador ${faker.word.sample()}`,
		definicion: faker.lorem.sentence(),
		ultimoValorDisponible: faker.number.int(),
		anioUltimoValorDisponible: randomYear(),
		tendenciaActual: faker.datatype.boolean() ? "ASCENDENTE" : "DESCENDENTE",
		tendenciaDeseada: faker.datatype.boolean() ? "ASCENDENTE" : "DESCENDENTE",
		observaciones: faker.lorem.sentence(),
		createdBy: faker.number.int(9),
		updatedBy: faker.number.int(9),
		activo: faker.datatype.boolean(),
		fuente: faker.lorem.sentence(),
		periodicidad: faker.number.int(12),
		owner: faker.number.int(9),
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
const indicadorToCreate = () => ({
	nombre: faker.word.sample(),
	definicion: faker.lorem.sentence(),
	ultimoValorDisponible: faker.number.int({ min: -1231, max: 2911 }),
	anioUltimoValorDisponible: faker.date.past().getFullYear(),
	periodicidad: faker.number.int({ min: 1, max: 48 }),
	tendenciaActual: faker.datatype.boolean() ? "ASCENDENTE" : "DESCENDENTE",
	observaciones: faker.word.sample(10),
	fuente: faker.internet.url(),
	urlImagen: faker.image.avatar(),
	idObjetivo: 1,
	idTema: 1
})

const aFormula = (id) => ({
	...(id && { id }),
	ecuacion: '\\frac{1}{x^2-1}',
	descripcion: faker.lorem.words(20)
});

const aVariable = (id) => ({
	...(id && { id }),
	nombre: faker.lorem.word(),
	descripcion: faker.lorem.word(),
	dato: faker.number.int(),
	anio: randomYear(),
	idUnidad: 1
});

const anHistorico = () => ({
	anio: randomYear(),
	valor: faker.number.int(),
	fuente: faker.word.sample()
});

const aMapa = (id) => ({
	...(id && { id }),
	ubicacion: faker.word.sample(),
	url: faker.internet.url(),
	urlImagen: faker.image.url()
});

const aUser = (id) => ({
	...(id !== undefined && { id }),
	nombres: faker.person.firstName(),
	apellidoPaterno: faker.person.lastName(),
	apellidoMaterno: faker.person.lastName(),
	correo: faker.internet.email(),
	clave: faker.internet.password(8, false),
	activo: true,
	requestedPasswordChange: id % 2 === 0,
});

const aTema = (id) => {
	const tema = Tema.build({
		id,
		codigo: aCodigo(),
		temaIndicador: faker.company.buzzNoun(),
		observaciones: faker.lorem.words(20),
		activo: faker.datatype.boolean(),
		urlImagen: faker.image.url(),
		color: '#ffffff',
		descripcion: faker.lorem.paragraph(),
	});
	tema.validate();
	return tema;
}

const aRol = (id) => ({
	id,
	rol: faker.word.sample().toUpperCase(),
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
		nombre: faker.word.sample(),
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
		valor: faker.number.int(),
		anio: 2022,
		fuente: faker.word.sample(),
		idIndicador: idIndicador,
		createdAt: new Date(),
		ecuacion: 'No aplica',
		descripcionEcuacion: 'No aplica',
	},
	{
		id: 2,
		valor: faker.number.int(),
		anio: 2021,
		fuente: faker.word.sample(),
		idIndicador: idIndicador,
		createdAt: new Date(),
		ecuacion: 'No aplica',
		descripcionEcuacion: 'No aplica',
	},
	{
		id: 3,
		valor: faker.number.int(),
		anio: 2020,
		fuente: faker.word.sample(),
		idIndicador: idIndicador,
		createdAt: new Date(),
		ecuacion: 'No aplica',
		descripcionEcuacion: 'No aplica',
	},
]);

const relationInfo = () => ([
	{
		id: 1,
		nombre: faker.word.sample(),
		owner: faker.word.sample(),
		updatedAt: new Date(),
		count: faker.number.int(),
	},
	{
		id: 2,
		nombre: faker.word.sample(),
		owner: faker.word.sample(),
		updatedAt: new Date(),
		count: faker.number.int(),
	},
	{
		id: 3,
		nombre: faker.word.sample(),
		owner: faker.word.sample(),
		updatedAt: new Date(),
		count: faker.number.int(),
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
			nombres: faker.person.firstName(),
			apellidoPaterno: faker.person.lastName(),
			apellidoMaterno: faker.person.lastName(),
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
			nombres: faker.person.firstName(),
			apellidoPaterno: faker.person.lastName(),
			apellidoMaterno: faker.person.lastName(),
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
			nombres: faker.person.firstName(),
			apellidoPaterno: faker.person.lastName(),
			apellidoMaterno: faker.person.lastName(),
		}
	}
]);

const anObjetivo = (id) => ({
	id,
	titulo: faker.lorem.words(Math.floor(Math.random() * 10) + 1),
	descripcion: faker.lorem.sentence(),
	urlImagen: faker.image.url(),
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