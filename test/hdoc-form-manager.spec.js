var path = require("path"),
	fs = require("fs-extra"),
	colors = require("colors"),
	chai = require("chai"),
	expect = chai.expect,
	chaiAsPromised = require("chai-as-promised"),
	SecureAppConfig = require("noinfopath-secure-config"),
	HdocFormManager = require("../lib/hdoc-form-manager"),
	testTemplatePath = "/hdocs/nationwide/Affidavit.html",
	testStringUri = "hsl-sop-hdocs/99/51/69/1.html",
	testObjectUri = {
		sop_case_id: 99,
		sop_order_id: 51,
		sop_service_address_id: 69,
		version: 1
	},
	testUriPattern = "hsl-sop-hdocs/{{sop_case_id}}/{{sop_order_id}}/{{sop_service_address_id}}/{{version}}.html",
	_crudClient, _dbSchema, _entityHash;

chai.use(chaiAsPromised);
chai.should();

describe("Testing HdocFormManager", function () {
	var testHtmlFile, formManager, appConfig;

	before(function () {
		appConfig = new SecureAppConfig({
			"projectId": "hsl-sop",
			"gcs": {
				"ops": {
					"bucket": "hsl-sop-bucket",
					"path": "ops/.private.json"
				}
			}
		});

		return appConfig.init()
			.then(function () {


				testHtmlFile = fs.readFileSync("./test/fixtures/Affidavit.html").toString();
				return testHtmlFile;
			});
	});

	it("should have initialized everything before starting tests.", function () {
		appConfig.should.be.an.instanceof(SecureAppConfig)
			.and.include.property("google")
			.and.include.property("gcs")
			.and.not.be.null;

		expect(testHtmlFile);
	});

	it("`new HdocFormManager(options)` should return an instance of HdocFormManager", function () {
		formManager = new HdocFormManager({
			"fileSystemRoot": "./test/fixtures",
			"gcsOptions": {
				"creds": appConfig.google.gcs,
				"bucketName": "hsl-sop-bucket"
			},
			"repoStoragePattern": testUriPattern
		});

		chai.expect(formManager).to.not.be.null;

		formManager.should.be.an.instanceof(HdocFormManager);
	});

	it("should get an HDOC template from the template repository", function () {
		return formManager.getTemplate(testTemplatePath)
			.should.eventually.equal(testHtmlFile);
	});

	it("should write a file to HDOC document repository", function () {
		return formManager.writeHdoc(testHtmlFile, testObjectUri).should.eventually.be.fulfilled;
	});

	it("should get a file from the HDOC document repository using string Uri", function () {
		return formManager.readHdoc(testStringUri)
			.should.eventually.equal(testHtmlFile);
	});

	it("should get a file from the HDOC document repository using object Uri, and Uri pattern", function () {
		return formManager.readHdoc(testStringUri)
			.should.eventually.equal(testHtmlFile);
	});

});
