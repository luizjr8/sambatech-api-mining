const axios = require('axios').default;
const progressBar = require("progress-bar-cli");
const async = require('async');

const ENDPOINT = "http://api.sambavideos.sambatech.com/v1/medias";
const ACCESS_TOKEN = "";
const PID = "";

// Vars (Editar aqui)
const CATEGORYtoTAG = "";
const TAGtoADD = ""

async function main() {
	let totalLoad = 0;
	var videos = [];

	// Loop por requisições da API de vídeos
	do {
		req = await axios.request({
			url: ENDPOINT,
			params: {
				access_token: ACCESS_TOKEN,
				pid: PID,
				categoryId: CATEGORYtoTAG,
				// Paginação (limite + número da página)
				limit: 100,
				start: totalLoad++
			}
		});

		// Concatena resultados ao já lido anteriormente
		videos = videos.concat(req.data);

	} while (req && req.data.length);

	console.log(videos.length);
	let startTime = new Date();

	await async.eachOfLimit(videos, 1, (video, key, next) => {
		try {
			progressBar.progressBar(key, videos.length, startTime);
			if (!video.tags.includes('uninassau')) {
				axios.put(`${ENDPOINT}/${video.id}`,
					{
						"tags": [
							TAGtoADD
						]
					},
					{
						params: {
							access_token: ACCESS_TOKEN,
							pid: PID,
						},
						timeout: 1000 * 5
					})
					.then((data) => {
						next();
					})
					.catch((error) => {
						console.log(`Erro no vídeo ${video.title} (${video.id});`)
						console.log(error);
						next();
					});
			}
		} catch (error) {
			console.log(error);
		}
	})
}

main();