const axios = require('axios').default;
const guid = require('guid');
const fs = require('fs');

const ENDPOINT = "http://api.sambavideos.sambatech.com/v1/categories";
const ACCESS_TOKEN = "";
const PID = "";

async function main() {
	
	var dataReturn = new Categories();

	req = await axios.request({
		url: ENDPOINT,
		params: {
			access_token: ACCESS_TOKEN,
			pid: PID,
			// Paginação (limite + número da página)
			limit: 100,
			// start: totalLoad++
		}
	});

	var categories = req.data;
	console.log(categories);

	return;
	
	// Loop por categorias existentes
	extractCategories(categories, 0, "", dataReturn);

	// Output
	console.log(JSON.stringify(dataReturn))
	fs.writeFileSync("data/categories.json", JSON.stringify(dataReturn), {encoding:'utf8',flag:'w'})
}

function extractCategories(categories, level, prefixName, addEntry) {
	for (const category of categories) {
		// Checa se não é uma categoria oculta
		if(!category.hidden) {			
			
			// Checa se tem categorias não é vazia
			if(category.mediasCount) {
				var prefix = "";
				// Adiciona prefixo (se não for categoria raiz)
				if(level > 1) {
					prefix = `${prefixName}: `;
				}
				// Cria e adiciona objeto Category
				addEntry.addCategory(new Category(`${prefix}${category.name}`, category.id, null, false));
			}
			
			// Loop por categorias filho
			if(category.children.length) {
				extractCategories(category.children, level+1,category.name, addEntry)
			}
		}	
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