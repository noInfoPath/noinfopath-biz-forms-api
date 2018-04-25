var path = require("path"),
	fs = require("fs-extra"),
	colors = require("colors"),
	chai = require("chai"),
	expect = chai.expect,
	chaiAsPromised = require("chai-as-promised"),
	SecureAppConfig = require("noinfopath-secure-config"),
	GoogleCloudStorageAdaptor = require("../lib/adaptors/gcs-client.js"),
	_crudClient, _dbSchema, _entityHash;

chai.use(chaiAsPromised);
chai.should();

describe("Testing GoogleCloudStorageAdaptor", function () {



	var testHtmlFile, gcsAdaptor, appConfig;

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
				testHtmlFile = fs.readFileSync("./test/fixtures/hdoc-affidavit.html").toString();
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

	it("`new GoogleCloudStorageAdaptor(config)` should return an instance of GoogleCloudStorageAdaptor", function () {
		var gcsOptions = {
			creds: appConfig.google.gcs,
			bucketName: "hsl-sop-bucket"
		};

		gcsAdaptor = new GoogleCloudStorageAdaptor(gcsOptions);

		chai.expect(gcsAdaptor).to.not.be.null;

		gcsAdaptor.should.be.an.instanceof(GoogleCloudStorageAdaptor);
	});

	it("should write a file to GCS", function () {
		return gcsAdaptor.write(testHtmlFile, "testfile.html")
			.should.eventually.be.fulfilled;
	});

	it("should read a file to GCS", function () {
		return gcsAdaptor.read("testfile.html")
			.should.eventually.equal(testHtmlFile);
	});
});
