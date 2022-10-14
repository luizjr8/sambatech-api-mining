const { GoogleSpreadsheet } = require('google-spreadsheet');
const axios = require('axios').default;
const axiosRetry = require('axios-retry');
const async = require('async');
const progressBar = require("progress-bar-cli");
const fs = require('fs');

const config = {
	access_token: '',
	pid: 0
}

const GSHEET = {
	DOCURL: "",
	EMAIL: "",
	CERT: ""
}

const endpoints = {
	'medias_get': "http://api.sambavideos.sambatech.com/v1/medias/",
}

const categories = {
	"Arte e Cultura": 5826,
	"Biologia": 5835
}

// Retry Axios
// axiosRetry(axios, {
// 	retries: 10, retryDelay: (retryCount) => 500, onRetry: (retryCount, error, requestConfig) => {
// 		log(`Retentando ${requestConfig.data} ${retryCount} vez: ${error}`)
// 		return;
// 	}
// });

fs.writeFileSync("output.log","Log\r\n");

function log(message) {
	fs.appendFile("output.log", message + '\r\n',()=>{})
	console.log(message);
}

async function sambaMediaGet(id) {
	console.log(`Lendo vídeo ${id}`)
	return new Promise((resolve, reject) => {
		axios.request({
			url: `${endpoints.medias_get}${id}`,
			method: 'GET',
			params: {
				'access_token': config.access_token,
				'pid': config.pid,
			}
		})
			.then(result => resolve(result))
			.catch((err) => {
				log(err);
				reject(err);
			})
	});
}

async function sambaMediaPut(id, data) {
	return new Promise((resolve, reject) => {
		axios.request({
			url: `${endpoints.medias_get}${id}`,
			method: 'PUT',
			params: {
				'access_token': config.access_token,
				'pid': config.pid,
			},
			data: data
		})
			.then(result => resolve(result))
			.catch((err) => {
				log(err);
				reject(err);
			})
	});
}

async function sambaMediaDelete(id) {
	return new Promise((resolve, reject) => {
		console.log(`Deletando ${id} ...`);
		axios.request({
			url: `${endpoints.medias_get}${id}`,
			method: 'DELETE',
			params: {
				'access_token': config.access_token,
				'pid': config.pid,
			}
		})
			.then(result => resolve(result))
			.catch((err) => {
				log(err);
				reject(err);
			})
	});
}

async function syncMediaCategory(row, newCategory, next) {
	console.log(`Alterando categoria do vídeo ${row['Vídeo']}`)
	sambaMediaPut(row.id, { categoryId: categories[newCategory] })
		.then((res) => {
			console.log(res.status, res.data);
			next();
		})
		.catch(err => {
			log(`Erro ao atualizar categoria: ${err}`);
		});
}

async function syncMediaRemove(id, next) {
	return new Promise((resolve, reject) => {
		sambaMediaDelete(id)
			.then(resolve, reject)
	})
}

// Dados do GSuite
async function syncSheet() {
	const doc = new GoogleSpreadsheet(GSHEET.DOCURL);
	await doc.useServiceAccountAuth({
		// Authentication
		client_email: GSHEET.EMAIL,
		private_key: GSHEET.CERT,
	});

	await doc.loadInfo(); // loads document properties and worksheets
	var data = doc.sheetsByIndex[0];
	await data.loadCells();

	// Todas as linhas da planilha
	var sheetRows = await data.getRows()
	var startTime = new Date();

	// Loop por vídeos da planilha
	await async.eachOfLimit(sheetRows, 10, (row, key, next) => {
		progressBar.progressBar(key++, sheetRows.length, startTime);
		console.log(`Linha ${key}: Lendo ${row['id']}`);
		sambaMediaGet(row.id)
			// Vídeo encontrado 
			.then((sambaVideo) => {
				// Categoria
				var newCategory = row['Nova Categoria'];

				// Checa se categoria do Samba diverge da planilha
				if (categories.hasOwnProperty(newCategory) && sambaVideo.data?.categoryId != categories[newCategory]) {
					// Ajusta categoria no Samba
					syncMediaCategory(row, newCategory, next)

					// Confere se o controle (sys_cat) da planilha está desatualizado
				} else if(!row.sys_cat || categories[newCategory] != row.sys_cat) {
					const cell = data.getCell(row._rowNumber-1,8);
					cell.value = categories[newCategory];
				}

				// Checa se é preciso remover
				if (row["Remover?"] === "sim")
					syncMediaRemove(row.id)
						.then((data) => {
							console.log(`Removido vídeo ${row['Vídeo']}`)
							row.del();
						})
						.catch(err => next())

				// Continua (async)
				next();
			})
			// Erro na requisição
			.catch((err) => {
				if(err?.response?.status === 404) {
					row.sys_404 = "sim";
					row.save();
				} else {
					log(err);
				}
				
				next();
			})
	});
	// Salva alterações de células no GSheet
	await data.saveUpdatedCells();
}

syncSheet();