var request = require("request"),
	restClient,
	_interface = {},
	config;

module.exports = function(cfg){
	config = cfg;
	restClient = require("noinfopath-rest-client")(cfg);

	return _interface;
};
