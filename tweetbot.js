var oauth = require('oauth-client');
var http = require('http');
var Canvas = require('canvas');
var colors = require('./colors');

getImage(function(src) {
	var img = new Canvas.Image();
	img.src = src;
	var canvas = new Canvas();

	var color = colors.getSkyColor(img, canvas);
	var hex = colors.hex(color);
	var name = colors.findNearest(color);

	tweet(name + ' ' + hex);
});

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

function tweet(text) {
	var signer = oauth.createHmac(
		oauth.createConsumer(process.env.CONSUMER_KEY, process.env.CONSUMER_SECRET),
		oauth.createToken(process.env.TOKEN, process.env.TOKEN_SECRET)
	);

	var body = {
		status: text
	};

	var request = {
			port: 443,
			host: 'api.twitter.com',
			https: true,
			path: '/1.1/statuses/update.json',
			oauth_signature: signer,
			method: 'POST',
			body: body
	};

	var req = oauth.request(request, function(res) {
		if(res.statusCode != 200) {
			console.log('http error: ' + res.statusCode);
		} else {
			console.log('tweeted: ' + text);
		}
	});
	req.write(body);
	req.end();

	req.on('error', function(e) {
		console.error('request error: ' + e.message);
	});
}

