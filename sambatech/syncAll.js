const guid = require('guid');
const _ = require('lodash');
const { SambaVideos, SambaCategories } = require("./lib/sambatech");
const { Categories, Category, Videos, Video} = require("./lib/models");

// Configuração
const config = require("./config");

const PID = "";
const TAGS = [];

// Classe Principal
class SyncData {
	constructor(PID) {
		this.PID = PID;

		// Carrega dados
		this.raw = { }
	}

	async syncAll() {
		// Sincroniza Categorias
		await this.syncCategories();
		// Sincroniza Vídeos
		await this.syncVideos();
	
		return {
			videos: this.Videos,
			categories: this.Categories
		}
	}

	syncCategories() {
		var categories = new SambaCategories(PID);
		this.raw.categories = {}
	}

	async syncVideos() {
		console.debug('< syncVideos');

		var samba = new SambaVideos(PID);
		// Carrega vídeos
		samba.loadVideos();
		// Loop por vídeos do Samba
		for (const iterator of object) {
			
		}

		console.debug('> syncVideos')
	}

	save(path) { }
}

// Run
var runner = new SyncData(PID)
// Sincroniza
runner.syncAll().then((o)=>{
	console.log(o)
	// Salva Dados
	runner.save("../../data/database.json");
});