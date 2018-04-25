(function () {

	"use strict";

	function homeController(authService, hdocsDataSource) {

		var vm = this;

		hdocsDataSource.init("https://restapi.sop.hsl.test:8443", localStorage.access_token);

		vm.auth = authService;
		vm.test = {
			hdocsDS: {
				getLibraryDirectory: function () {
					hdocsDataSource.getLibraryDirectory()
						.then(console.log.bind(console))
				}
			}
		}
	}

	angular
		.module("app")
		.controller("HomeController", ["authService", "hdocsDataSource", homeController]);



})();
