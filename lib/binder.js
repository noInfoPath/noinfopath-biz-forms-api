var hb = require("handlebars");

function HdocBinder(helpers) {
	if (helpers) {
		Object.keys(helpers).forEach(function (helperName) {
			var helperFn = helpers[helperName];

			hb.registerHelper(helperName, helperFn);
		});
	}

	this.bind = function (model, view) {
		var tmpl = hb.compile(view);
		return tmpl(model);
	};
}

module.exports = HdocBinder;
