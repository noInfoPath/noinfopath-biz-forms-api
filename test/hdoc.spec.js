var path = require("path"),
	fs = require("fs-extra"),
	colors = require("colors"),
	chai = require("chai"),
	chaiAsPromised = require("chai-as-promised"),
	HdocFactory = require("../lib/hdoc-factory"),
	HdocDatum = require("../lib/hdoc-datum"),
	HdocDataSource = require("../lib/hdoc-data-source"),
	expectedHdocHeader = require("./fixtures/hdoc-header"),
	expectedHdocDatumProperties = require("./fixtures/hdoc-datum-empty"),
	hdocDataFixture = require("./fixtures/hdoc-data"),
	appConfig = require("hsl-sop-app-config"),
	sqlClientInit = require("noinfopath-sql-client"),
	noDbSchemaInit = require("noinfopath-dbschema"),
	uriExpander = require("hsl-sop-restapi/sys/rest-uri-expander"),
	restDefs = require("hsl-sop-restapi/restapi-definitions"),
	serviceDataFixture = require("./fixtures/hdoc-data"),
	hdocDatumFixture = require("./fixtures/hdoc-datum"),
	_appConfig, _crudClient, _dbSchema, _entityHash;

chai.use(chaiAsPromised);
chai.should();

describe("Testing HDOCS", function () {
	var hdocFactory = null,
		hdocDatum = null,
		hdocDataSource = null,
		hdocData = null;


	describe("HdocDataSource Class", function () {
		before(function () {
			return appConfig()
				.then(function (ac) {
					_appConfig = ac;
					_crudClient = sqlClientInit("mysql", _appConfig.db.conn)
					return noDbSchemaInit(_appConfig.db.conn)
						.then(function (transformed) {
							_dbSchema = [];
							_entityHash = uriExpander(_crudClient, restDefs, transformed);
							for (var e in _entityHash) {
								_dbSchema.push(_entityHash[e]);
							}
							_crudClient = Object.assign(_crudClient, _entityHash);

							// Object.keys(_entityHash).sort().forEach(function (e) {
							// 	var entity = _entityHash[e];
							//
							// 	console.log('{"schemaName": "%s", "uri": "%s", "entityName": "%s" }', e, entity.uri, entity.entityName);
							// });
						})
						.catch(function (err) {
							throw err;
						});
				})
				.catch(console.error.bind(console))
		});

		it("should have initialized everything before starting tests.", function () {
			_appConfig.should.not.equal(undefined);
			_crudClient.should.not.equal(undefined);
			_dbSchema.should.not.equal(undefined);
		});

		it("`new HdocDataSource(db)` should return an instance of HdocDataSource", function () {
			hdocDataSource = new HdocDataSource(_crudClient);

			chai.expect(hdocDataSource).to.not.be.null;

			hdocDataSource.should.be.an.instanceof(HdocDataSource);
		});

		it("`HdocDataSource.serviceData(sid, tdid)` should resolve with expected data.", function () {
			// hdocDataSource.should.eventually.deep.equal(serviceDataFixture);
			return hdocDataSource.serviceData(356, 3)
				.then(function (r) {
					hdocData = JSON.parse(JSON.stringify(r));
					//fs.writeJsonSync("junk/hdoc-data.json", r);
					return hdocData;
				})
				.should.eventually.deep.equal(hdocDataFixture);

		});

	})

	describe("HdocDatum Class", function () {
		it("`new HdocDatum(hdocData := undefined)` should return an instance of HdocData.", function () {
			hdocDatum = new HdocDatum();
			hdocDatum.should.be.an.instanceof(HdocDatum)
		});

		it("should have initialized an empty HdocDatum object", function () {
			hdocDatum.should.deep.include(expectedHdocDatumProperties);
		});

		it("`new HdocDatum(hdocData)` should return an instance of HdocData.", function () {
			hdocDatum = new HdocDatum(hdocData);
			hdocDatum.should.be.an.instanceof(HdocDatum)

			//console.log(hdocDatum);

			//fs.writeJsonSync("test/fixtures/hdoc-datum.json", hdocDatum)
		});

		it("should have initialized an hdocData HdocDatum object", function () {
			hdocDatum.should.deep.include(hdocDatumFixture);
		});
	});

	describe("HdocFactory Class", function () {

		it("`new` HdocFactory(hdocHeader) should return an instance of HdocFactory.", function () {
			hdocFactory = new HdocFactory(hdocData.template, hdocDatum);
			hdocFactory.should.be.an.instanceof(HdocFactory);
		});

		it("`HdocFactory.header` should have a reference to an hdocHeader.", function () {
			hdocFactory.should.have.a.property("header")
				.and.deep.equal(expectedHdocHeader);
		});

		it("`HdocFactory.path` should return a valid hdoc path.", function () {
			var expectedPath = "hdocs/nationwide/Affidavit.html";

			hdocFactory.should.have.a.property("path")
				.and.deep.equal(expectedPath);
		});

		it("`HdocFactory.data` should return a valid HDocDatum object.", function () {
			hdocFactory.should.have.a.property("data")
				.and.be.and.instanceof(HdocDatum)
				.and.deep.equal(hdocDatum);
		});

		it("`HdocFactory.master` should return `master.html`", function () {
			var expectedMaster = fs.readFileSync("./test/fixtures/master.html").toString();

			hdocFactory.master.should.equal(expectedMaster);
		});

		it("`HdocFactory.template` should return a hdoc template.", function () {
			var expectedTemplate = fs.readFileSync("./test/fixtures/Affidavit.html").toString();

			hdocFactory.template.should.equal(expectedTemplate);
		});

		it("`HdocFactory.render()` should resolve with a fully rendered HTML document", function () {
			var expectedHdocAffidavit = fs.readFileSync("./test/fixtures/hdoc-affidavit.html").toString();

			return hdocFactory.render().then(function (r) {
				fs.writeFileSync("./test/fixtures/hdoc-affidavit.html", r);
				return r;
			}).should.eventually.equal(expectedHdocAffidavit);
		});
	});
});
