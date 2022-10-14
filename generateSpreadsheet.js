const videos = require('./data/videos');
const fs = require('fs');

const report = fs.openSync("eadf-iesplay-videos.csv", 'w');

function outputLog(msg) {
	console.log(msg);
	fs.writeSync(report, msg + '\r\n');
}

// Cabeçalho
fs.writeFileSync(report, "id\tdescricao\tcategoria-anterior\tdata-hora\tvideo\r\n" )

// Loop por vídeos
for (const category of videos.categories) {
	for (const video of category.videos) {
		outputLog(`${video.id}\t${video.excerpt}\t${category.categoria.name}\t${new Date(video.date).toLocaleString()}\t${video.title}`)
	}
}