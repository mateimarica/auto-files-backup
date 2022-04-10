require('dotenv').config();
const fs = require('fs'),
      archiver = require('archiver'),
      path = require("path"),
      XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest,
	  request = require('request');

if (process.argv.length != 4) {
	console.log('- ERROR! Required format:\nnpm run prod <relativeSrcDir> <intervalInHours>\n');
	return;
}

const relativeSrcDir = process.argv[2],
      intervalInHours = process.argv[3],
      dirToZipName = path.basename(relativeSrcDir),
	  outputZipAbsolutePath = path.join(__dirname, dirToZipName + '.zip');

console.log('relativeSrcDir=' + relativeSrcDir);
console.log('absolutePathToSrcDir=' + path.join(__dirname, relativeSrcDir));
console.log('intervalInHours=' + intervalInHours);
console.log('dirToZipName=' + dirToZipName);
console.log('outputZipAbsolutePath=' + outputZipAbsolutePath);


setInterval(doBackup, intervalInHours * 60 * 60 * 1000);

function doBackup() {
	const output = fs.createWriteStream(outputZipAbsolutePath);
	const archive = archiver('zip', {
		zlib: { level: 9 } // Sets the compression level.
	});

	output.on('close', () => {
		console.log(archive.pointer() + ' total bytes. All zipped up.');
		login();
	});

	archive.on('error', (err) => {
		throw err;
	});

	// pipe archive data to the file
	archive.pipe(output);

	// append files from a sub-directory and naming it `new-subdir` within the archive
	archive.directory(path.join(__dirname, relativeSrcDir), dirToZipName);

	// finalize the archive (ie we are done appending files but streams have to finish yet)
	archive.finalize();
}

function login() {
	const headers = {
		'Username': process.env.USERNAME,
		'Authorization': btoa(process.env.PASSWORD)
	}

	sendHttpRequest('POST', 'https://files.mateimarica.dev/login', {headers: headers}, (http) => {
		switch (http.status) {
			case 200:
				upload(http.getResponseHeader('Authorization'));
				break;
			case 401:
				console.log('Invalid credentials, try again.');
				break;
			case 429:
				console.log('Too many failed attempts. Try again later.');
				break;
			case 500:
			case 502:
				console.log('Server error. Try again later.');
				break;
			default:
				console.log('Something went wrong. Status code: ' + http.status);
		}
	});
}

function upload(sessionId) {
	const options = {
		url: 'https://files.mateimarica.dev/upload',
		headers: {
			'Authorization': sessionId
		}
	};

	let req = request.post(options, (err, resp, body) => {
		if (err) {
			console.log('Error!');
		}
	});

	req.form().append('files', fs.createReadStream(outputZipAbsolutePath));
}


/** {headers: {'Content-Type': 'application/json', 'Header1':'value'}, responseType: 'type', data: 'some data'} */
function sendHttpRequest(method, url, options, callback) {
	const http = new XMLHttpRequest();
	http.addEventListener('load', (e) => callback(http, e)); // If ready state is 4, do async callback

	http.open(method, url, async=true);

	if (options.headers)
		for (let key in options.headers) {
			http.setRequestHeader(key, options.headers[key]);
		}

	if (options.responseType)
		http.responseType = options.responseType;

	http.send(options.data ?? null);
}

