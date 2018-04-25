var path = require("path"),
	cheerio = require("cheerio"),
	binder = require("./binder");

function HdocFactory(hdocHeader, hdocDatum) {
	if (!hdocHeader) throw new TypeError("hdocHeader is a required parameter.");
	if (!hdocDatum) throw new TypeError("hdocDatum is a required parameter.");

	this._hdocHeader = hdocHeader;
	this._hdocDatum = hdocDatum;

	Object.defineProperties(this, {
		header: {
			get: function () {
				return this._hdocHeader;
			}
		},
		data: {
			get: function () {
				return this._hdocDatum;
			}
		},
		path: {
			get: function () {
				return path.join(".", this._hdocHeader.path);
			}
		},
		master: {
			get: function () {
				return this._hdocMaster;
			}
		},
		template: {
			get: function () {
				return this._hdocTemplate;
			}
		}
	});

	this._hdocMaster = fs.readFileSync("hdocs/master.html").toString();

	this._hdocTemplate = fs.readFileSync(this.path).toString();


	this._toCreateHdoc = function (resolve, reject) {
		try {
			var $ = cheerio.load(this.master),
				final = "";

			$("affidavit-viewer").append(this.template);

			final = binder(this.data, $.html());

			fs.writeFileSync("junk/hdoc-affidavit.html", final);

			resolve(final);
		} catch (err) {
			reject(err);
		}
	};

	this.render = function () {
		return new Promise(this._toCreateHdoc.bind(this));
	}
}

module.exports = HdocFactory;
