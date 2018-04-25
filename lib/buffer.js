var util = require("util"),
	streamtoarray = require('stream-to-array');

function _streamToBuffer(stream) {
	return streamtoarray(stream)
		.then(function(parts) {
			var buffers = parts.map(function(part) {
				return util.isBuffer(part) ? part : Buffer.from(part);
			});
			return Buffer.concat(buffers);
		});
}

module.exports = _streamToBuffer;
