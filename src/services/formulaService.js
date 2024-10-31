const { Formula, Variable, CatalogoDetail } = require('../models');

/**
 * @returns formula and variables:
 *  - with a known formula id
 *  - or formula of an indicador
 */
const getFormulaAndVariables = async (where) => {
  const { idFormula, idIndicador } = where;
  try {
    return await Formula.findOne({
      where: {
        ...(idFormula && { id: idFormula }),
        ...(idIndicador && { idIndicador }),
      },
      include: [{
        model: Variable,
      }]
    });
  } catch (err) {
    throw err;
  }
}

/**
 * 
 * @param {int} idFormula  
 * @param {*} values of a formula to update (ecuacion, descripcion, isFormula, etc.)
 * @returns true if formula was updated sucessfully
 */
const updateFormula = async (idFormula, values) => {
  try {
    const affected = await Formula.update(values, {
      where: {
        id: idFormula
      }
    });
    return affected > 0;
  } catch (err) {
    throw err;
  }
}

const createFormula = async (values) => {
  try {
    const options = {};
    if (values?.variables && values?.variables.length > 0) {
      options.include = [Variable];
    }
    return await Formula.create(values, options);
  } catch (err) {
    throw err;
  }
}

module.exports = { getFormulaAndVariables, updateFormula, createFormula }