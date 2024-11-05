const stream = require('stream');
const PublicIndicadorService = require('../services/publicIndicadorService');
const PrivateIndicadorService = require('../services/privateIndicadorService');
const IndicadorService = require("../services/indicadorService")
const { generateCSV, generateXLSX, generatePDF } = require("../services/fileService");
const UsuarioService = require('../services/usuariosService');
const { FILE_PATH, FRONT_PATH, SITE_PATH } = require('../middlewares/determinePathway');
const { getImagePathLocation } = require('../utils/stringFormat');


const getIndicador = async (req, res, next) => {
  const { pathway } = req;
  const { idIndicador, format } = req.matchedData;
  try {
    const indicador = await IndicadorService.getIndicador(idIndicador, pathway);

    // TODO: validate if temas related to indicador are not active
    if (!indicador.activo) {
      return res.status(409).json({ status: 409, message: `El indicador ${indicador.nombre} se encuentra inactivo` });
    }

    return (res.status(200).json({ data: indicador, navigation: { prev: indicador.prev, next: indicador.next } }));

  } catch (err) {
    next(err)
  }
}


const getPublicIndicador = async (req, res, next) => {
  const { idIndicador } = req.matchedData;
  const indicador = await PublicIndicadorService.getIndicadorById(idIndicador);

  if (!indicador) {
    return res.status(409).json({ status: 409, message: `El indicador con id ${idIndicador} se encuentra inactivo` });
  }

  const related = await PublicIndicadorService.getIndicadoresRelacionadosTo(idIndicador);

  return res.status(200).json({ data: { ...indicador, related } })
}


const generateFile = async (req, res, next) => {
  const { idIndicador, format } = req.matchedData;
  let indicador = await PublicIndicadorService.getIndicadorById(idIndicador);
  const filename = `${indicador.nombre}.${format}`
  res.header('Content-disposition', 'attachment');
  res.attachment(filename)

  switch (format) {
    case 'json':
      res.header('Content-Type', 'application/json');
      return res.send(indicador);
    case 'csv':
      res.header('Content-Type', 'application/csv');
      const csvData = generateCSV(indicador);
      return res.send(csvData);
    case 'xlsx':
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const content = await generateXLSX(indicador);
      const readStream = new stream.PassThrough();
      readStream.end(content);
      return readStream.pipe(res);
    case 'pdf':
      res.header('Content-Type', 'application/pdf');
      const doc = await generatePDF(indicador);
      return res.send(doc);
    default:
      return res.status(409).json({ message: 'Formato de archivo invalido' });
  }
}


const getIndicadores = async (req, res, _next) => {
  const { page, perPage, searchQuery, ...filters } = req.matchedData;

  const indicadores = await PrivateIndicadorService.getIndicadores({
    ...filters,
    page,
    perPage,
    searchQuery,
  })

  const total = await PrivateIndicadorService.countIndicadores({
    ...filters,
    searchQuery,
  })

  return res.status(200).json({
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
    data: indicadores
  });
}


const getPublicIndicadores = async (req, res, _next) => {
  const { page, perPage, searchQuery, ...filters } = req.matchedData;
  const indicadores = await PublicIndicadorService.getIndicadores({
    ...filters,
    page,
    perPage,
    searchQuery,
  })

  const total = await PublicIndicadorService.countIndicadores({
    ...filters,
    searchQuery,
  })

  return res.status(200).json({
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
    data: indicadores
  });
}


const getIndicadoresOfObjetivo = async (req, res, _next) => {
  const { page, perPage, searchQuery, ...filters } = req.matchedData;
  let indicadores = []
  let destacados = []
  let total = 0;
  let offset = (page - 1) * perPage;

  const destacadosCount = await PublicIndicadorService.countIndicadores({ ...filters, searchQuery, destacado: true })
  const indicadoresCount = await PublicIndicadorService.countIndicadores({ ...filters, searchQuery, destacado: false })
  total = indicadoresCount + destacadosCount;

  if (page === 1) {
    destacados = await PublicIndicadorService.getIndicadores({
      ...filters,
      perPage: IndicadorService.LIMIT_NUMBER_INDICADORES_PER_OBJETIVO,
      offset: 0,
      searchQuery,
      destacado: true,
    })

  }

  if (page > 1) {
    offset -= destacadosCount;
  }

  const noDestacados = await PublicIndicadorService.getIndicadores({
    ...filters,
    offset,
    perPage: page === 1 ? perPage - destacadosCount : perPage,
    searchQuery,
    destacado: false,
  });

  indicadores = [...destacados, ...noDestacados]



  return res.status(200).json({
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
    data: indicadores,
  })
}

const getIndicadoresFromUser = async (req, res, next) => {
  try {
    const idUsuario = req.sub;
    const { indicadores, total } = await UsuarioService.getIndicadoresFromUser(idUsuario);
    return res.status(200).json({
      total,
      data: indicadores,
    });
  } catch (err) {
    next(err)
  }
}

const createIndicador = async (req, res, next) => {
  const image = getImagePathLocation(req);
  const indicador = req.matchedData;
  indicador.createdBy = req.sub;
  indicador.updatedBy = req.sub;
  indicador.owner = req.sub;
  indicador.mapa = { ...indicador?.mapa, ...image };
  const savedIndicador = await IndicadorService.createIndicador(indicador);
  return res.status(201).json({ data: savedIndicador });

};

const updateIndicador = async (req, res, next) => {
  const { idIndicador, ...indicador } = req.matchedData;
  indicador.updatedBy = req.sub;

  await IndicadorService.updateIndicador(idIndicador, indicador);

  return res.sendStatus(204);
};

const updateIndicadorStatus = async (req, res, next) => {
  const { idIndicador } = req.matchedData;
  await IndicadorService.updateIndicadorStatus(idIndicador);
  return res.sendStatus(204);
};


const getUsersFromIndicador = async (req, res, next) => {
  const { idIndicador } = req.params;
  try {
    const usuarios = await UsuarioService.getUsersFromIndicador(idIndicador);
    return res.status(200).json({ data: usuarios });
  } catch (err) {
    next(err);
  }
};

const getRandomIndicador = async (req, res, next) => {
  const { idTema } = req.params;
  try {
    const indicador = await IndicadorService.getRandomIndicador(idTema);
    return res.status(200).json({ data: indicador });
  } catch (err) {
    next(err);
  }
};


module.exports = {
  getIndicadores,
  getIndicador,
  getIndicadoresFromUser,
  createIndicador,
  updateIndicador,
  updateIndicadorStatus,
  getUsersFromIndicador,
  getIndicadoresOfObjetivo,
  getRandomIndicador,
  getPublicIndicadores,
  getPublicIndicador,
  generateFile
}
