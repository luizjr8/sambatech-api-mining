const { GoogleSpreadsheet } = require('google-spreadsheet');
const axios = require('axios').default;
const guid = require('guid');
const _ = require('lodash');
const fs = require('fs');
const progressBar = require("progress-bar-cli");
const async = require('async');


const ENDPOINT = "http://api.sambavideos.sambatech.com/v1/medias";
const ACCESS_TOKEN = "";
const PID = "";
const TAGS = [""];

const GSHEET = {
	DOCURL: "",
	EMAIL: "",
	CERT: ""
}

async function fillGSheet() {

	let page = 0;
	var videos = [];
	var startTime = new Date();

	console.log(`Carregando vídeos não-categorizados do SambaTech`);

	// Loop por requisições da API de vídeos
	do {
		req = await axios.request({
			url: ENDPOINT,
			params: {
				access_token: ACCESS_TOKEN,
				pid: PID,
				categoryId: 0,
				recursiveCategory: false,
				// Paginação (limite + número da página)
				limit: 100,
				start: page++
			}
		});
		// Barra de Progresso
		try {
			progressBar.progressBar((page-1)*100+req.data.length, req.headers.totalmedias, startTime);	
		} catch (error) {}
		
		// Concatena resultados ao já lido anteriormente
		videos = videos.concat(req.data);

	} while (req && req.data.length);

	console.log(`Carregando planilha de sincronização`)
	startTime = new Date();

	// Carrega dados da planilha
	let { sheet, sheetData } = await loadGSheet();
	
	// Loop por vídeos não-categorizados
	async.eachOfLimit(videos, 1, (video, key, next) => {
		// Checa se o vídeo não existe na planilha
		if(!sheetData.hasOwnProperty(video.id)) {
			sheet.addRow([
				video.id,
				video.shortDescription,
				video.categoryName,
				new Date(video.lastModified).toLocaleDateString("pt-br"),
				video.title,
			], {insert: true})
			.then((result) => {
				console.log(`Novo vídeo ${video.title} adicionado na planilha (linha ${result.rowIndex})`)
				next();
			})
			.catch((err) => {
				console.error(`Erro ao inserir dados: ${err.message}`)
				next();
			})
		} else {
			next()
		}
	})
}

async function loadGSheet() {
	const doc = new GoogleSpreadsheet(GSHEET.DOCURL);
	await doc.useServiceAccountAuth({
		client_email: GSHEET.EMAIL,
		private_key: GSHEET.CERT,
	});

	await doc.loadInfo(); // loads document properties and worksheets
	var data = doc.sheetsByIndex[0];
	await data.loadCells();
	var returnData = {};

	// Todas as linhas da planilha
	var startTime = new Date();
	// Loop por linhas da planilha
	for(var index = 1; index < data.rowCount; index++) {
		// Objeto com dados da linha
		var row = {
			"index": index,
			"id": data.getCell(index,0).value,
			"descricao-curta": data.getCell(index,1).value,
			"categoria-anterior": data.getCell(index,2).value,
			"data-upload": data.getCell(index,3).value,
			"video": data.getCell(index,4).value
		}
		returnData[row.id] = row
	}
	// Retorna conjunto de objetos lidos da planilha
	return { sheet: data, sheetData: returnData }
}

fillGSheet();