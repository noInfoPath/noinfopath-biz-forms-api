var path = require("path"),
	fs = require("fs-extra"),
	colors = require("colors"),
	chai = require("chai"),
	expect = chai.expect,
	chaiAsPromised = require("chai-as-promised"),
	FileSystemAdaptor = require("../lib/adaptors/file-system.js"),
	_crudClient, _dbSchema, _entityHash;

chai.use(chaiAsPromised);
chai.should();

describe("Testing FileSystemAdaptor", function () {

	var testHtmlFile, fsAdaptor, appConfig;

	before(function () {
		fs.emptyDirSync("./test/temp");
	});

	it("should have initialized everything before starting tests.", function () {
		expect(testHtmlFile);
	});

	it("`new FileSystemAdaptor(config)` should return an instance of FileSystemAdaptor", function () {
		fsAdaptor = new FileSystemAdaptor(".");

		chai.expect(fsAdaptor).to.not.be.null;

		fsAdaptor.should.be.an.instanceof(FileSystemAdaptor);
	});

	it("should read a file from FS", function () {
		return fsAdaptor.read("/test/fixtures/master.html")
			.then(function (resp) {
				testHtmlFile = resp;
				return resp;
			})
			.should.eventually.not.be.null;
	});

	it("should write a file to fs", function () {
		return fsAdaptor.write(testHtmlFile, "/test/temp/testfile.html")
			.should.eventually.be.fulfilled;
	});

	it("should read a file from FS", function () {
		return fsAdaptor.read("/test/temp/testfile.html")
			.should.eventually.equal(testHtmlFile);
	});

});
