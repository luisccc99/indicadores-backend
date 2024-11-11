const HistoricoService = require('../services/historicoService');
const IndicadorService = require('../services/indicadorService')
const { getPaginationHistoricos } = require('../utils/pagination');
const PublicIndicadorService = require('../services/publicIndicadorService');


const getHistoricos = async (req, res, next) => {
  const { idIndicador, order, sortBy } = req.matchedData;
  const { page, perPage } = getPaginationHistoricos(req.matchedData);
  const attributes = ['ultimoValorDisponible', 'updatedAt', 'periodicidad']
  try {
    const { ultimoValorDisponible, updatedAt, periodicidad } = await PublicIndicadorService.getIndicadorById(idIndicador, attributes);
    const { historicos, total } = await HistoricoService.getHistoricos(idIndicador, page, perPage, order, sortBy);
    const indicadorResponse = {
      idIndicador,
      indicadorLastValue: ultimoValorDisponible,
      indicadorLastUpdateDate: updatedAt,
      indicadorPeriodicidad: periodicidad,
    }
    if (historicos.length > 0) {
      const totalPages = Math.ceil(total / perPage);
      return res.status(200).json({
        ...indicadorResponse,
        page,
        perPage,
        total,
        totalPages,
        data: historicos
      });
    } else if (historicos.length === 0) {
      return res.status(200).json({
        ...indicadorResponse,
        page,
        perPage,
        total,
        totalPages: 0,
        data: []
      });
    } else {
      return res.sendStatus(400);
    }

  } catch (err) {
    next(err)
  }
};


const deleteHistorico = async (req, res, _next) => {
  const { idHistorico } = req.matchedData;

  await HistoricoService.deleteHistorico(idHistorico);
  return res.status(200).json({ message: 'Historico eliminado' })
};


const updateHistorico = async (req, res, next) => {
  const { idHistorico, ...values } = req.matchedData;

  await HistoricoService.updateHistorico(idHistorico, values);
  return res.sendStatus(204);
};


const createHistorico = async (req, res, next) => {
  const { idIndicador, ...historico } = req.matchedData;
  const idUser = req.sub;
  const response = await HistoricoService.createHistorico(idIndicador, historico, idUser);
  return res.status(201).json(response);
}

module.exports = {
  getHistoricos,
  deleteHistorico,
  updateHistorico,
  createHistorico,
}