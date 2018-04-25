/* |data|Object|(optional) Contains data used to create the path to the document.|*/
var bind = require("./binder"),
	SecureAppConfig = require("noinfopath-secure-config"),
	GoogleCloudStorageAdaptor = require("../lib/adaptors/gcs-client.js"),
	FileSystemAdaptor = require("../lib/adaptors/file-system.js");

/**
 * {
 *     "fileSystemRoot": "/path/to/where/hdocs/templates/are"
 *     "gcsOptions": {
 *          "creds": {},
 *          "bucketName": "hsl-sop-bucket"
 *      }
 * }
 */
function HdocFormManager(options) {
	this.__gcsAdaptor = new GoogleCloudStorageAdaptor(options.gcsOptions);
	this.__fsAdaptor = new FileSystemAdaptor(options.fileSystemRoot);
	this.__repoStoragePattern = options.repoStoragePattern;

	this.getTemplate = function (templatePath) {
		return this.__fsAdaptor.read(templatePath);
	}

	this.readHdoc = function (hdocUri) {
		var hdocPath;
		if (typeof hdocUri === "object") {
			hdocPath = bind(hdocUri, this.__repoStoragePattern);
		} else if (typeof hdocUri === "string") {
			hdocPath = hdocUri;
		} else {
			throw new TypeError("Invalid hdocUri");
		}

		return this.__gcsAdaptor.read(hdocPath);
	}

	this.writeHdoc = function (hdoc, hdocDatum) {
		var hdocPath = bind(hdocDatum, this.__repoStoragePattern);

		return this.__gcsAdaptor.write(hdoc, hdocPath);
	}
}

module.exports = HdocFormManager;
