const axios = require('axios').default;
const guid = require('guid');
const _ = require('lodash');
const fs = require('fs');
const progressBar = require("progress-bar-cli");
const async = require('async');


const ENDPOINT = "http://api.sambavideos.sambatech.com/v1/medias";
const ACCESS_TOKEN = "";
const PID = "";
const TAGS = [];

async function main() {

	var dataReturn = new CategoriesVideos();

	let page = 0;
	var videos = [];
	var startTime = new Date();

	// Loop por requisições da API de vídeos
	do {
		req = await axios.request({
			url: ENDPOINT,
			params: {
				access_token: ACCESS_TOKEN,
				pid: PID,
				recursiveCategory: true,
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

	var allVideos = [];
	startTime = new Date();
	// Loop por vídeos
	await async.eachOfLimit(videos, 1, (video, key, next) => {
	// for (const video of videos) {
		// Barra de Progresso
		progressBar.progressBar(key, videos.length, startTime);
		// Checa se tem arquivos de vídeo vinculado
		if (video.files.length) {
			// Localiza arquivo 720p
			if (file = _.find(video.files, (f) => f.outputName = "720p")) {
				// Pega categoria
				let categoryVideos = dataReturn.getCategory(video.categoryId.toString(), video.categoryName);
				// Cria objeto vídeo
				let videoObject = new Video(video.id,
																		video.title,
																		video.shortDescription,
																		false,
																		file.fileInfo.duration,
																		file?.url,
																		video?.thumbs?.pop()?.url,
																		video.description,
																		video.postdate,
																		"",
																		video.tags);
				// Adiciona na lista de todos os vídeos
				allVideos.push(videoObject);
				// Adiciona na lista da categoria
				categoryVideos.addVideo(videoObject);
			} else {
				console.debug("Arquivo 720p não encontrado. ", video.title);
			}
			next();
		}
	});

	// Output
	// pbcopy(JSON.stringify(dataReturn));
	// Arquivo de todos os vídeos
	fs.writeFileSync("data/videos-all.json", JSON.stringify(allVideos), { encoding: 'utf8', flag: 'w' })
	// Arquivo de vídeos categorizados
	fs.writeFileSync("data/videos.json", JSON.stringify(dataReturn), { encoding: 'utf8', flag: 'w' })
}

class CategoriesVideos {
	constructor() {
		this.categories = []
	}

	addCategory(categoryVideo) {
		this.categories.push(categoryVideo);
	}

	getCategory(id, name) {
		// Busca Categoria pelo id informado
		let categoryVideo = _.find(this.categories, { categoria: { id: id } })
		// Caso não exista, cria e adiciona no array
		if (!categoryVideo) {
			categoryVideo = new CategoryVideos(id, name)
			this.addCategory(categoryVideo)
		}
		// Retorno de dados
		return categoryVideo;
	}
}

// Categorias
class CategoryVideos {
	constructor(id, name) {
		// Guid
		this.uniqueId = guid.create()

		// Categorias
		this.categoria = new Category(name, id, null, false)

		// Vídeos
		this.videos = []
	}

	// Adicionar Vídeos
	addVideo(video) {
		this.videos.push(video);
	}
}

// Classe Vídeo
class Video {
	constructor(id, title, excerpt, saved, duration, video_url, thumb_url, description, date, author, tags) {
		this.id = id;
		this.title = title;
		this.excerpt = excerpt;
		this.saved = saved;
		this.duration = duration;
		// this.thumb_url = thumb_url;
		this.thumb_url = `https://api.ser.eadflix.io/thumbs/thumb_${id}_hq.jpg`;
		this.video_url = video_url;
		this.description = description;
		this.date = date,
		this.author = author;
		this.ies = this.filterIES(tags);
		this.tags = this.filterTags(tags);
	}

	filterTags(tags) {
	
		return _.difference(tags.map(_.toLower), TAGS)
	}

	filterIES(tags) {
		
		return _.intersection(tags.map(_.toLower), TAGS)
	}
}

// Categorias
class Categories {
	constructor() {
		// Guid
		this.uniqueId = guid.create()

		// Categorias
		this.categorias = [];

		// Legenda
		this.titulo = {
			"texto": "Não achou o que procura?",
			"subtitulo": "Navegue pelas categorias"
		}
	}

	// Adicionar Categorias
	addCategory(category) {
		this.categorias.push(category);
	}
}

// Classe categoria
class Category {
	constructor(name, id, icon, featured) {
		this.id = id;
		this.name = name;
		this.icon = icon;
		this.featured = featured;
	}
}

main();