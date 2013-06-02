var oauth = require('oauth-client');
var http = require('http');
var Canvas = require('canvas');
var colors = require('./colors');

var MIN_SLEEP = 1 * 60 * 60 * 1000;
var MAX_SLEEP = 3 * 60 * 60 * 1000;

loop();

function loop() {
	getImage(function(src) {
		var img = new Canvas.Image();
		img.src = src;
		var canvas = new Canvas();

		var color = colors.getSkyColor(img, canvas);
		var hex = colors.hex(color);
		var name = colors.findNearest(color);

		tweet(name + ' #' + hex);
		updateColors(hex);
	});

	var sleep = Math.round(MIN_SLEEP + Math.random() * (MAX_SLEEP - MIN_SLEEP));
	console.log('sleeping ' + (sleep / 60 / 1000) + ' minutes, see you at ' +
							new Date(sleep + new Date().valueOf()).toString());
	setTimeout(loop, sleep);
}

function getImage(callback) {
	var url = 'http://www.met.fu-berlin.de/wetter/webcam/Cam00_prev.jpg';
	var req = http.get(url, function(res) {
		if(res.statusCode == 200) {
			var chunks = [];
			res.on('data', function(chunk) {
				chunks.push(chunk);
			});
			res.on('end', function() {
				var src = Buffer.concat(chunks);
				callback(src);
			});
		} else {
			console.error('http error fetching image: ' + res.statusCode);
		}
	});
	req.on('error', function(e) {
		console.error('error fetching image: ' + e.message);
	});
}

function updateColors(color) {
	twitter('account/update_profile_colors.json', {
		profile_background_color: color
	});
}

function tweet(text) {
	twitter('statuses/update.json', {status: text});
}

function twitter(path, body) {
	var signer = oauth.createHmac(
		oauth.createConsumer(process.env.CONSUMER_KEY, process.env.CONSUMER_SECRET),
		oauth.createToken(process.env.TOKEN, process.env.TOKEN_SECRET)
	);

	var request = {
			port: 443,
			host: 'api.twitter.com',
			https: true,
			path: '/1.1/' + path,
			oauth_signature: signer,
			method: 'POST',
			body: body
	};

	var req = oauth.request(request, function(res) {
		if(res.statusCode != 200) {
			console.log('http error on ' + path, body, res.statusCode);
			res.setEncoding('utf8');
			res.on('data', function(chunk) {
				console.log(chunk);
			});
		} else {
			console.log('success ' + path, body);
		}
	});
	req.write(body);
	req.end();

	req.on('error', function(e) {
		console.error('request error: ' + e.message);
	});
}

