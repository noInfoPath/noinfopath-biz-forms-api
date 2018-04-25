var hb = require("handlebars");

module.exports = function (model, view) {
	var tmpl = hb.compile(view);
	return tmpl(model);
};
