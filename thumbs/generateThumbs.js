const ffmpeg = require("fluent-ffmpeg");
const async = require('async');
const _ = require("lodash");
const progressBar = require("progress-bar-cli");
const sharp = require('sharp');

const videos = require("../data/videos-all.json");
let startTime = new Date();

async.eachOfLimit(videos, 20, (video, key, next) => {
	try {
		progressBar.progressBar(key, videos.length, startTime);	
	} catch (error) {}
	ffmpeg(video.video_url)
	.on('end', () => {
		sharp(`./.cache/thumbs/thumb_${video.id}_hq_2.png`)
		.jpeg({ quality: 90 })
		.toFile(`./thumbs/thumb_${video.id}_hq.jpg`, function(err) {
			next();
		});
	})
	.screenshots({
		// count: 1,
		timestamps: ['40%'],
		folder: "./.cache/thumbs/",
		filename: `thumb_${video.id}_hq_2`,
		size: "1280x?"
	});
}, (err) => {
	if(err) console.log("Erro: ", err);
	console.log('>> Todos os thumbs foram salvos!');
});