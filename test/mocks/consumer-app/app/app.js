(function () {

	'use strict';

	angular
		.module('app', ['auth0.auth0', 'ui.router', "noinfopath-biz-forms"])
		.config(config);

	config.$inject = [
		'$stateProvider',
		'$locationProvider',
		'$urlRouterProvider',
		'angularAuth0Provider'

	];

	function config(
		$stateProvider,
		$locationProvider,
		$urlRouterProvider,
		angularAuth0Provider
	) {

		$stateProvider
			.state('home', {
				url: '/',
				controller: 'HomeController',
				templateUrl: 'app/home/home.html',
				controllerAs: 'vm'
			})
			.state('callback', {
				url: '/callback',
				controller: 'CallbackController',
				templateUrl: 'app/callback/callback.html',
				controllerAs: 'vm'
			})
			.state('hdocs', {
				url: '/hdocs',
				controller: 'hdocsController',
				templateUrl: 'app/hdocs/index.html',
				controllerAs: 'hdocs'
			})
			.state('tests', {
				url: '/tests',
				controller: 'hdocsTestController',
				templateUrl: 'app/hdocs/test.html',
				controllerAs: 'hdocsTest'
			});

		// Initialization for the angular-auth0 library
		angularAuth0Provider.init({
			clientID: AUTH0_CLIENT_ID,
			domain: AUTH0_DOMAIN,
			responseType: 'token id_token',
			audience: "https://restapi.sop.heavensentlegal.com",
			redirectUri: AUTH0_CALLBACK_URL,
			scope: 'openid'
		});

		$urlRouterProvider.otherwise('/');

		$locationProvider.hashPrefix('');

		/// Comment out the line below to run the app
		// without HTML5 mode (will use hashes in routes)
		$locationProvider.html5Mode(true);
	}

})();
