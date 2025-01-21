const numberWithCommas = (num) => {
	typeof num === 'string' || num === 'number'
		? num = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
		: num
	return num;
};

const returnUnit = (idUnidad) => {
	let unit = '';

	switch (idUnidad) {
		case 24: unit = 'ha'; break;
		case 29: unit = 'X̅'; break;
		case 34: unit = '%'; break;
		case 35: unit = '%'; break;
		case 38: unit = '%'; break;
		case 39: unit = ' (posición)'; break;
		case 41: unit = ' (promedio)'; break;
		case 45: unit = ' (tasa)'; break;
		case 56: unit = ' (módulo)'; break;
		case 53: unit = ' (hogares)'; break;
		case 75: unit = ' (población)'; break;
		case 40:
	}

	return unit;
};

const returnFuente = (fuente) => {
	try {
		const fuenteCutted = fuente.split(')')[0] + ')';
		try {
			const fuenteData = fuenteCutted.split(':')[1];
			return 'Valor obtenido por ' + fuenteData;
		} catch (err) {
			return 'Valor obtenido por ' + fuenteCutted;
		}
	} catch (err) {
		return 'Valor obtenido por diversos medios';
	}

}

const getImagePathLocation = (req) => {
	const image = {}
	if (process.env.NODE_ENV === 'production') {
		image.urlImagen = req?.file?.location;
	} else if (req.file) {
		image.urlImagen = `http://${req.headers.host}/${req.file.path}`;
	}
	if (req.body.urlImagen === 'null') {
		image.urlImagen = null;
	}
	return image;
};

const splitNameKeepFirstOne = (name) => {
	return name.split(' ')[0];
}


module.exports = { numberWithCommas, returnUnit, returnFuente, getImagePathLocation, splitNameKeepFirstOne };