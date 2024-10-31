require('dotenv').config();
const { S3Client } = require('@aws-sdk/client-s3')
const multer = require('multer');
const multerS3 = require('multer-s3');
const { Parser } = require("json2csv");
const Excel = require("exceljs");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { numberWithCommas, returnUnit, returnFuente } = require("../utils/stringFormat");
const handlebars = require("handlebars");
const { footer } = require("../utils/footerImage");
const logger = require('../config/logger');

const MAX_IMAGE_SIZE = 1_048_576; // 1MB
const VALID_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg',
  'image/gif', 'image/svg', 'image/webp', 'image/bmp'];

const s3 = new S3Client({
  credentials: {
    secretAccessKey: process.env.S3_ACCESS_SECRET,
    accessKeyId: process.env.S3_ACCESS_KEY,
  },
  region: process.env.S3_REGION
});

const DESTINATIONS = {
  TEMASS: 'temas',
  INDICADORES: 'indicadores',
  USUARIOS: 'usuarios',
  MAPAS: 'mapas',
  OBJETIVOS: 'objetivos',
}

const getUniqueName = (file) => `${Date.now().toString()}.${file.originalname.split('.')[1]}`;

const getPath = (type) => type ? `uploads/${type}/images/` : 'uploads/tmp';

const validateFileType = (file, cb) => {
  const isValidMimetype = VALID_IMAGE_MIME_TYPES.includes(file.mimetype);
  if (!isValidMimetype) {
    return cb(new Error('FILE_TYPE_NOT_ALLOWED'));
  }
  return cb(null, true);
};

const getDiskStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, getPath(destination))
    },
    filename: (req, file, cb) => {
      cb(null, getUniqueName(file))
    }
  });
}

/**
 * @param {*} destination where to store the image file
 * @returns the storage to use, it saves files locally if env is testing or development
 * only uses S3 if application is in production env
 */
const getStorage = (destination) => {
  if (process.env.NODE_ENV === 'production') {
    return multerS3({
      s3,
      bucket: process.env.S3_INDICADORES_BUCKET,
      metadata: function (_, file, cb) {
        cb(null, { fieldName: file.fieldname });
      },
      key: function (_, file, cb) {
        const fullpath = getPath(destination) + getUniqueName(file);
        logger.info(`Uploading file to S3 ${fullpath}`)
        cb(null, fullpath)
      }
    })
  } else {
    return getDiskStorage(destination)
  }
};


const upload = (destination) => {
  return multer({
    storage: getDiskStorage(destination), // TODO: Change to S3 if available
    limits: {
      fileSize: MAX_IMAGE_SIZE,
      files: 1
    },
    fileFilter: (req, file, cb) => {
      validateFileType(file, cb);
    },
  }).single('urlImagen');
};

const generateCSV = (data) => {
  const json2csv = new Parser();
  const csv = json2csv.parse(data);
  return csv;
};

const UNIDAD_ID = 2;
const COBERTURA_ID = 3;

const getFromCatalogos = (catalogos = [], id) => {
  return catalogos.find(catalogo => catalogo?.dataValues?.idCatalogo === id)
}

const generateXLSX = (indicador) => {
  let baseFile = "./src/templates/indicador.xlsx";
  let workBook = new Excel.Workbook();
  const fields = ['nombre', 'Tema', 'tendenciaActual', 'ultimoValorDisponible',
    'medida', 'anioUltimoValorDisponible', 'cobertura', 'ecuacion', 'variables', 'historicos']
  return workBook.xlsx
    .readFile(baseFile)
    .then(async () => {
      let workSheet = workBook.getWorksheet();
      let col = 1;
      let row = workSheet.getRow(2);
      for (const field of fields) {
        let initialRow = 2;
        let value = indicador[field];
        if (field === 'Tema') {
          value = indicador[field].dataValues.temaIndicador;
        } else if (field === 'medida') {
          value = getFromCatalogos(indicador['catalogos'], UNIDAD_ID)?.dataValues.nombre || 'NA';
        } else if (field === 'cobertura') {
          value = getFromCatalogos(indicador['catalogos'], COBERTURA_ID)?.dataValues.nombre || 'NA';
        } else if (field === 'ecuacion') {
          const formula = indicador?.formula?.dataValues;
          row.getCell(col++).value = formula?.ecuacion || 'NA';
          row.getCell(col++).value = formula?.descripcion || 'NA';
          continue;
        } else if (field === 'variables') {
          const variables = indicador?.formula?.dataValues?.variables || [{}];
          for (const v of variables) {
            let innerRow = workSheet.getRow(initialRow++);
            let innerCol = col;
            innerRow.getCell(innerCol++).value = v?.nombre || 'NA';
            innerRow.getCell(innerCol++).value = v?.descripcion || 'NA';
            innerRow.getCell(innerCol++).value = v?.dato || 'NA';
            innerRow.commit()
          }
          col += 3;
          continue;
        } else if (field === 'historicos') {
          const historicos = indicador?.historicos || [{}];
          for (const h of historicos) {
            let innerRow = workSheet.getRow(initialRow++);
            let innerCol = col;
            innerRow.getCell(innerCol++).value = h?.valor || 'NA';
            innerRow.getCell(innerCol++).value = h?.anio || 'NA';
            innerRow.getCell(innerCol++).value = h?.fuente || 'NA';
            innerRow.commit()
          }
          col += 3;
          continue;
        }
        row.getCell(col).value = value || 'NA';
        col++;
      }
      return await workBook.xlsx.writeBuffer();;
    })
    .catch(err => {
      throw err;
    });
};


const generatePDF = async (indicador) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });


  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 800, deviceScaleFactor: 3 });
  const templateHtml = fs.readFileSync("./src/templates/indicador.html", "utf8");
  handlebars.registerHelper('isAscending', (str) => str === 'Ascendente');
  handlebars.registerHelper('notApplies', (str) => str === 'No aplica');
  handlebars.registerHelper('numberWithCommas', numberWithCommas);
  handlebars.registerHelper('getCatalogo', (catalogos, id) => {
    return catalogos
      .sort((a, b) => a.idCatalogo - b.idCatalogo)
      .find(indicador => indicador.idCatalogo === id)?.nombre || 'NA';
  });
  handlebars.registerHelper('toString', (num) => num?.toString());
  handlebars.registerHelper('containsNA', (str) => str?.includes("NA") ? "NA" : str);
  handlebars.registerHelper('valueIsNull', (str) => str === null);
  handlebars.registerHelper('hasHistoricos', (historicos) => historicos.length > 0);
  handlebars.registerHelper('hasFormula', (formula) => typeof formula !== undefined || formula !== null)
  handlebars.registerHelper('calculateTopPx', (Tema) => {
    const top = (parseInt(Tema.id) - 1) * 35;
    return `
    <style>
      .tematica__id {
        width: 28px;
        height: 28px;
        background: ${Tema.color};
        color: white;
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: bold;
        font-size: 12px;
        position: absolute;
        top: ${top}px;
      }
    </style>
    <div class="tematica__id">
      ${Tema.codigo}
    </div>   
    `;
  })
  handlebars.registerHelper('hasVariablesNotFormula', (formula) => formula.dataValues.isFormula == 'SI');
  handlebars.registerHelper('hasValue', (value) => (value.trim().length === 0));
  handlebars.registerHelper('returnDato', (idUnidad) => returnUnit(idUnidad));
  handlebars.registerHelper('returnFuente', (fuente) => returnFuente(fuente));

  const template = handlebars.compile(templateHtml);

  const html = template(indicador, { allowProtoPropertiesByDefault: true });
  await page.setContent(html, {
    waitUntil: "networkidle0",
  });

  const years = []
  const values = []
  if (indicador.historicos.length > 0) {
    const historicosSorted = indicador.historicos.sort((a, b) => a.anio - b.anio);
    years.push(...historicosSorted.map(indicador => indicador.anio));
    values.push(...historicosSorted.map((elem) => elem.valor));
    years.push(indicador.anioUltimoValorDisponible);
    values.push(indicador.ultimoValorDisponible);

    await page.evaluate(
      (years, values) => {
        const ctx = document.getElementById("chart").getContext("2d");
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: years,
            datasets: [
              {
                label: 'Valores históricos',
                data: values,
                backgroundColor: ['#D12D6A', '#C62C6B', '#A6296C', '#9C286D', '#91276E', '#662270'].reverse(),
                barPercentage: 0.8,
              },
            ],
          },
          options: {
            animation: {
              duration: 0,
            },
            responsive: true,
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true
                }
              }]
            }
          },
        });
      },
      years,
      values,
    ).catch((err) => {
      throw err;
    });
  }

  page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36WAIT_UNTIL=load"
  );

  const date = new Date();
  const [month, day, year] = [date.getMonth(), date.getDate(), date.getFullYear()];

  const pdf = await page.pdf({
    format: "letter",
    displayHeaderFooter: true,
    printBackground: true,
    headerTemplate: '',
    footerTemplate: `
    <div clas="test" style="width: 100%; font-size: 7px; z-index: 10000;
        padding: 5px 5px 0; position: relative;">
        <div style="position: absolute; left: 10px; bottom: 0; font-size: 8px; z-index: 10000;">
          <div>
          Generado el ${month}/${day}/${year}
          </div>
        </div>
        <div style="text-align: center; margin-top: 220px !important;">

          <div>
            ${footer}
          </div>
        </div>
        <div style="position: absolute; right: 10px; bottom: 0; font-size: 8px; z-index: 10000;">
          Página 
          <span class="pageNumber">
          </span> 
          de 
          <span class="totalPages">
          </span>
        </div>
    </div>`,
    margin: { bottom: '70px' },
  });

  await browser.close();
  return pdf;
};

module.exports = {
  upload,
  DESTINATIONS,
  generateCSV,
  generateXLSX,
  generatePDF,
}

