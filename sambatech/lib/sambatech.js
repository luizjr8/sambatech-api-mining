// Módulos
const axios = require('axios').default;

// Configuração
const config = require("./../config");
const ACCESS_TOKEN = config.sambatech.access_token;

// Cache
const CacheApi = require('node-filesystem-cache');
const cachePath = __dirname + '/cache';
const Cache = new CacheApi(cachePath);


class SambaVideos {
	constructor(PID) {
		console.debug('< SambaVideos constructor')

		this.PID = PID;
		// Dados
		this.videos = [];
		// Endpoint
		this.ENDPOINT = "http://api.sambavideos.sambatech.com/v1/medias";

		console.debug('> SambaVideos constructor')
	}

	async loadVideos() {
		console.debug('< loadVideos')
		await this.loadSambaVideos();
		console.debug('> loadVideos')
	}

	async loadSambaVideos() {
		console.debug('< loadSambaVideos');

		let totalLoad = 0;
		var videos = [];

		// Loop por requisições da API de vídeos
		do {
			var req = await axios.request({
				url: this.ENDPOINT,
				params: {
					access_token: ACCESS_TOKEN,
					pid: this.PID,
					// Paginação (limite + número da página)
					limit: 100,
					start: totalLoad++
				}
			});

			console.log(req.data.length);

			// Concatena resultados ao já lido anteriormente
			videos = videos.concat(req.data);

		} while (req && req.data.length);

		console.log('Finished Loading:' + videos.length);
		console.debug('> loadSambaVideos');

		// Retorno de vídeos
		this.videos = videos;
	}

	find(id) {
		// Busca por Id
	}

	findByCategory(categoryId) {
		// Busca (todos) por Categoria
	}
}

class SambaCategories {
	constructor(PID) {
		this.PID = PID
		// Carrega Categorias
		this.loadCategories()
	}

	loadCategories() {
		// Checa se existe Cache
		// Checa se cache é menor que 30 minutos
		// Inicializa Objeto
		// Loop por Categorias
		// Chama categoria-filhos
	}
}

module.exports = {
	SambaCategories,
	SambaVideos
}