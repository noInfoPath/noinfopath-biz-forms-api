/**
 * ## NoInfoPathBizForms
 */
//Global Dependencies
var util = require("util"),
	gcsInit = require("./gcs-client"),
	HdocFactory = require("./hdoc-factory"),
	HdocDatum = require("./hdoc-datum"),
	HdocDataSource = require("./hdoc-data-source"),
	odata = require("../../no-odata"),
	buffer = require("./buffer"),
	binder = require("./binder"),
	_save = require("../save"),
	path = require("path"),
	fs = require("fs"),
	cheerio = require("cheerio"),
	// company = require("../company"),
	moment = require("moment"),
	hslUtils = require("hsl-sop-utils"),
	makeDatePath = hslUtils.makeDatePath,
	template = fs.readFileSync(path.join(__dirname, "template.html"), {
		encoding: 'utf8'
	}),
	HDOC_FUNCTIONS = {
		"POST": _hdocPost,
		"GET": _hdocGet,
		"PUT": _hdocPut,
		"DELETE": _hdocDelete
	},
	gcsClient, sopData, emailConfig, app;

function NoInfoPathBizForms() {
	/*
	 * ### _hdocs
	 *
	 * - Use function hash to perform proper method based on method.
	 * - All responses need to be an object.
	 * - POST returns html, hdoc
	 * - GET returns html, optionally hdoc (Depending if it's getting a template or an existing document)
	 * - PUT returns html, hdoc
	 * - DELETE returns ???. Probably do not support proper deletes. Probably just sets an archive flag on the record. Not supported.
	 */
	function _hdoc(crud, schema, req, res, next) {

		HDOC_FUNCTIONS[req.method](crud, schema, req, res, next)
			.then(function (resp) {
				res.contentType = "text/html";
				res.send(200, resp);
			})
			.catch(function (err) {
				console.error(err);
				res.send(500, err);
			});
	}

	function _hdocGet(crud, schema, req, res, next) {
		var hdocFactory = null,
			data = req.body;

		if (req.params.hdid) {
			return _hdocGetExisting(crud, schema, req, res, next);
		} else if (req.params.tdid) {
			return _hdocGetNew(crud, schema, req, res, next);
		} else {
			return _hdocGetFieldSheet(crud, schema, req, res, next);
		}
	}

	function _hdocGetNew(crud, schema, req, res, next) {
		var ds = new HdocDataSource(crud, process.hsl.dbSchema);

		return ds.serviceData(req.params)
			.then(function (hdocData) {
				var datum = new HdocDatum(hdocData),
					hdoc = new HdocFactory(hdocData.template, datum);

				return hdoc.render();
			})
	}


	function _constructPath(record) {
		return record.bucket_url + record.version + ".html";
	}

	function _getFile(fileName) {
		return new Promise(function (resolve, reject) {
			// Assume we are saving the document like "/hdoc/texas/*.html"
			fs.readFile("." + fileName, 'utf8', function (err, data) {
				if (err) {
					reject(err);
				}
				resolve(data);
			});
		});
	}

	function _hdocPost(crud, schema, req, res, next) {
		// This is only for new documents
		var data = req.body,
			hdoc = {},
			hdocQuery = {
				"query": {
					"$select": "id",
					"$orderby": "id desc",
					"$top": 1
				}
			},
			store = {},
			$ = cheerio.load(template);

		data.html = unescape(Buffer.from(data.html, "base64").toString());
		$("title").text(req.body.title);
		$("body").append(data.html);

		odata("odata-v4-mysql", hdocQuery);
		return noREST.get(crud, req.noDbSchemas.hdoc_latest, hdocQuery)
			.then(function (resp) {
				store.latest = resp[0] || 0;
				// return appConfig.get(["hsl_sop_gcs_service_account"])
				// 	.then(function(resp){
				gcsClient = gcsInit(req.appConfig.hsl_sop_gcs_service_account);

				var bucketpath = data.sop_case_id + "/" + data.sop_order_id + "/" + data.sop_service_id + "/" + (store.latest.id + 1) + "/1.html";

				// hdoc.bucket_url = "http://storage.googleapis.com/hsl-sop-hdocs/" + bucketpath;
				hdoc.bucket_url = bucketpath;
				hdoc.sop_service_id = data.sop_service_id;
				hdoc.sop_document_template_id = data.sop_document_template_id;
				hdoc.title = data.title;
				hdoc.CreatedBy = data.user;
				hdoc.ModifiedBy = data.user;

				return gcsClient.uploadHDoc($.html(), bucketpath)
					.then(function (resp) {
						return noREST.post(crud, req.noDbSchemas.service_hdocs, {
								body: hdoc
							})
							.then(function (resp) {
								hdoc.id = store.latest.id + 1;
								return hdoc;
							})
							.catch(function (err) {
								console.error(err);
							});
					})
					.catch(function (err) {
						console.error(err);
					});
			})
			.catch(function (err) {
				console.error(err);
			});
		// })
		// .catch(function(err){
		// 	console.error(err);
		// });
	}


	function MarkTime(name) {
		var _startTime, _endTime,
			_name = name;

		this.start = function () {
			_startTime = new Date();
		};
		this.end = function () {
			_endTime = new Date();
		};
		this.report = function () {
			this.end();
			console.log(name + " took " + (_endTime - _startTime) + " ms");
		};
	}

	function _getService(crud, req, store, sid) {
		var sreq = {
			query: {
				$filter: "id eq " + sid
			}
		};

		odata("odata-v4-mysql", sreq);

		var sObj = new MarkTime("_getService");
		sObj.start();
		return crud.service_summary.get(crud, req.noDbSchemas.service_summary, sreq)
			.then(function (resp) {
				sObj.report();
				store.service = resp[0];
			});
	}

	function _getAssignment(crud, req, store, aid) {
		var areq = {
			query: {
				$filter: "sop_assignment_id eq " + aid
			}
		};

		odata("odata-v4-mysql", areq);

		return noREST.get(crud, req.noDbSchemas.assignments, areq)
			.then(function (resp) {
				store.assignment = resp[0];
			});
	}

	function _getCasePeople(crud, req, store, cid) {
		var cpreq = {
			query: {
				$filter: "sop_case_id eq " + cid
			}
		};
		odata("odata-v4-mysql", cpreq);
		var sObj = new MarkTime("_getCasePeople");
		sObj.start();

		return noREST.get(crud, req.noDbSchemas.case_people, cpreq)
			.then(function (resp) {
				store.case_people = resp;
				store.defendants = [];
				store.plaintiffs = [];
				store.witnesses = [];
				store.otherPersona = [];

				resp.forEach(function (el) {
					switch (el.sop_persona_type_id) {
					case 1:
						store.plaintiffs.push(el);
						break;
					case 2:
						store.defendants.push(el);
						break;
					case 3:
						store.witnesses.push(el);
						break;
					case 4:
						store.otherPersona.push(el);
						break;
					default:
						// Ignore bad data case.
						break;
					}
				});
				sObj.report();
			});
	}

	function _getCourt(crud, req, store, cid) {
		var creq = {
			query: {
				$filter: "sop_court_id eq " + cid
			}
		};
		odata("odata-v4-mysql", creq);
		return noREST.get(crud, req.noDbSchemas.court_address, creq)
			.then(function (resp) {
				store.j_court_address = resp[0];

				var areq = {
					query: {
						$filter: "id eq " + store.j_court_address.hsl_address_id
					}
				};

				odata("odata-v4-mysql", areq);

				return noREST.get(crud, req.noDbSchemas.address, areq)
					.then(function (resp) {
						store.court_address = resp[0];
					});
			});
	}

	function _getDocuments(crud, req, store, jcid) {
		var dreq = {
			query: {
				$filter: "j_case_person_id eq " + jcid
			}
		};
		odata("odata-v4-mysql", dreq);

		return noREST.get(crud, req.noDbSchemas.address_documents, dreq)
			.then(function (resp) {
				store.documents = resp;
			});
	}

	function _getOrder(crud, req, store, oid) {
		var creq = {
			query: {
				$filter: "id eq " + oid
			}
		};
		odata("odata-v4-mysql", creq);
		return noREST.get(crud, req.noDbSchemas.service_orders, creq)
			.then(function (resp) {
				store.order = resp[0];
			});
	}

	function _getServer(crud, req, store, uid) {
		var creq = {
			query: {
				$filter: "id eq " + uid
			}
		};
		odata("odata-v4-mysql", creq);
		var sObj = new MarkTime("_getServer");
		sObj.start();
		return noREST.get(crud, req.noDbSchemas.users, creq)
			.then(function (resp) {
				store.server = resp[0];
				sObj.report();
			});
	}

	function _getServerCompany(crud, req, store) {
		// console.log(store.server);
		var serverMetadata = JSON.parse(store.server.metadata),
			companyid = serverMetadata && serverMetadata.sop_company_id ? serverMetadata.sop_company_id : 1106,
			creq = {
				query: {
					$filter: "sop_company_id eq " + companyid
				}
			};

		odata("odata-v4-mysql", creq);
		req.params.id = companyid;
		var sObj = new MarkTime("_getServerCompany");
		sObj.start();
		// return company._getByCompanyId(crud, req)
		return noREST.get(crud, req.noDbSchemas.company_primary, creq)
			.then(function (resp) {
				store.serverCompany = resp[0];
				sObj.report();
			});
	}

	function _getRequester(crud, req, store, rid) {
		// req.params.id = rid;
		var creq = {
			query: {
				$filter: "id eq " + rid
			}
		};
		odata("odata-v4-mysql", creq);
		var sObj = new MarkTime("_getRequester");
		sObj.start();
		// return company._getByCompanyId(crud, req)
		// 	.then(function(resp){
		// 		store.requester = resp;
		// 		sObj.report();
		// 	});

		return noREST.get(crud, req.noDbSchemas.company_contacts, creq)
			.then(function (resp) {
				store.requester = resp[0];
				sObj.report();
			})
			.catch(function (err) {
				throw err;
			});
	}

	function _getRequesterCompany(crud, req, store) {
		// console.log(store.server);
		var creq = {
			query: {
				$filter: "sop_company_id eq " + store.requester.sop_company_id
			}
		};

		odata("odata-v4-mysql", creq);
		// req.params.id = companyid;
		var sObj = new MarkTime("_getRequesterCompany");
		sObj.start();
		// return company._getByCompanyId(crud, req)
		return noREST.get(crud, req.noDbSchemas.company_primary, creq)
			.then(function (resp) {
				store.requesterCompany = resp[0];
				sObj.report();
			});
	}

	function _getAttempts(crud, req, store, sid) {
		var creq = {
			query: {
				$filter: "sop_service_id eq " + sid
			}
		};
		odata("odata-v4-mysql", creq);
		var sObj = new MarkTime("_getAttempts");
		sObj.start();
		return noREST.get(crud, req.noDbSchemas.service_attempts, creq)
			.then(function (resp) {
				for (var i = 0; i < resp.length; i++) {
					var a = resp[i];

					a.timestamp = moment(a.timestamp).format("LLL");

					store.latestAttempt = a;
				}
				store.attempts = resp;
				sObj.report();
			});
	}



	function _hdocGetFieldSheet(crud, schema, req, res, next) {
		var store = {},
			$ = cheerio.load(template);
		return _getFile("/hdocs/fieldsheets/fieldsheet.html")
			.then(function (resp) {
				$("body").append(resp);
				$("title").append("Fieldsheet");
				return _getService(crud, req, store, req.params.sid)
					.then(function (resp) {
						return _getRequester(crud, req, store, store.service.sop_company_contact_id);
					})
					.then(function (resp) {
						return _getServer(crud, req, store, store.service.assignee_id);
					})
					.then(function (resp) {
						return _getDocuments(crud, req, store, req.params.sid);
					})
					.then(function (resp) {
						var r = _parseNew(store);
						r.order.service_type = r.order.service_type === "Rush" ? "Rush" : "";

						return {
							data: r,
							html: binder(r, $.html())
						};
					});
			});
	}

	function _hdocGetExisting(crud, schema, req, res, next) {
		var data = req.body,
			store = {},
			dreq = {
				query: {
					$filter: "id eq " + req.params.hdid
				}
			};

		console.log(req.params.hdid);

		odata("odata-v4-mysql", dreq);
		var latestTimer = new MarkTime("Latest Hdoc Record");
		latestTimer.start();
		return noREST.get(crud, req.noDbSchemas.hdoc_latest, dreq)
			.then(function (resp) {
				store.latestVersion = resp[0];
				latestTimer.report();

				// var appTimer = new MarkTime("appConfig");
				// appTimer.start();
				// return appConfig.get(["hsl_sop_gcs_service_account"])
				// 	.then(function(resp){
				// 		appTimer.report();
				gcsClient = gcsInit(req.appConfig.hsl_sop_gcs_service_account);
				var gcsPath, savedRecord,
					sreq = {
						query: {
							$filter: "id eq " + store.latestVersion.sop_service_id
						}
					};

				odata("odata-v4-mysql", sreq);
				var stimer = new MarkTime("service_summary");
				stimer.start();
				return noREST.get(crud, req.noDbSchemas.service_summary, sreq)
					.then(function (resp) {
						store.service = resp[0];
						stimer.report();
						var mtimer = new MarkTime("Hdoc Download");
						mtimer.start();
						// var t = "106/94/35/23/1.html";
						return gcsClient.downloadHDoc(req, store.latestVersion.bucket_url)
							.then(function (resp) {
								var file = resp.toString();

								mtimer.report();

								store.sop_case_id = store.service.sop_case_id;
								store.sop_order_id = store.service.sop_order_id;
								store.sop_service_id = store.service.id;

								return {
									data: store,
									html: file
								};
							})
							.catch(function (err) {
								console.error(err);
							});
					})
					.catch(function (err) {
						console.error(err);
					});
				// })
				// .catch(function(err){
				// 	console.error(err);
				// });
			})
			.catch(function (err) {
				console.error(err);
			});
	}

	function _hdocPut(crud, schema, req, res, next) {
		// This is only for new documents
		var data = req.body,
			hdoc = {},
			hdocQuery = {
				"query": {
					"$filter": "id eq " + data.id
				}
			},
			store = {},
			$ = cheerio.load(template);

		data.html = unescape(Buffer.from(data.html, "base64").toString());
		$("body").append(data.html);

		odata("odata-v4-mysql", hdocQuery);
		return noREST.get(crud, req.noDbSchemas.hdoc_latest, hdocQuery)
			.then(function (resp) {
				store.latest = resp[0] || 0;
				gcsClient = gcsInit(req.appConfig.hsl_sop_gcs_service_account);

				var bucketpath = data.sop_case_id + "/" + data.sop_order_id + "/" + data.sop_service_id + "/" + data.id + "/" + (store.latest.version + 1) + ".html";

				hdoc.bucket_url = bucketpath;
				hdoc.sop_service_id = data.sop_service_id;
				hdoc.sop_document_template_id = data.sop_document_template_id;
				hdoc.title = data.title;
				hdoc.id = data.id;
				hdoc.ModifiedBy = data.user;

				return gcsClient.uploadHDoc($.html(), bucketpath)
					.then(function (resp) {
						return noREST.putByPrimaryKey(crud, req.noDbSchemas.service_hdocs, {
								body: hdoc
							})
							.then(function (resp) {
								return hdoc;
							})
							.catch(function (err) {
								console.error(err);
							});
					})
					.catch(function (err) {
						console.error(err);
					});
			})
			.catch(function (err) {
				console.error(err);
			});
	}

	function _hdocDelete(crud, schema, req, res, next) {
		throw "Deletes Not Implemented Exception";
	}


	function _uploadRequestDoc(crud, schema, req, res, next) {
		var data = req.body;
		//
		// odata("odata-v4-mysql", hdocQuery);
		// return noREST.get(crud, req.noDbSchemas.hdoc_latest, hdocQuery)
		// 	.then(function(resp){
		// 		store.latest = resp[0] || 0;
		gcsClient = gcsInit(req.appConfig.hsl_sop_gcs_service_account);
		var bucketpath = makeDatePath(new Date());


		return gcsClient.uploadHDoc(data.file, bucketpath)
			.then(function (resp) {
				console.log(resp);
			});
		// 			.catch(function(err){
		// 				console.error(err);
		// 			});
		// 	}
	}

}





// function _requestDoc(crud, schema, req, res, next) {
// 	switch (req.method) {
// 		case "POST":
// 			var gcsClient = gcsInit(req.appConfig.hsl_sop_gcs_service_account),
// 				data = req.body,
// 				docPath;
//
// 			_getRequest(crud, req, store, data.sop_service_id)
// 				.then(function(resp){
// 					res.send(200, resp);
// 				});
//
// 			break;
// 		default:
// 			throw "Method Not Supported";
// 	}
// }
//
// function _getRequest(crud, schema, store, rid) {
//
// }

module.exports = {
	hdoc: _hdoc,
	uploadRequestDoc: _uploadRequestDoc
	// requestDoc: _requestDoc
};
