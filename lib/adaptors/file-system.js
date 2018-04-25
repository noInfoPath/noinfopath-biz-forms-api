/**
 * ## FileSystemAdaptor
 */
var path = require("path"),
	fs = require("fs-extra");

function FileSystemAdaptor(fileSystemRoot) {
	this.__fileSystemRoot = fileSystemRoot;

	/*
	 * ### write
	 *
	 * Whites an HTML document to a Google Cloud Storage (GCS) Bucket Path.
	 *
	 * #### Remarks
	 *
	 * ##### sharingFormat
	 *
	 * It is recommended to use a shared index structure to the file path. The
	 * path will be compiled using `mustache` to compile the path with the
	 * optionally provided data object.
	 *
	 * **Example**
	 *
	 * 	//hsl-sop-hdocs/{{sop_case_id}}/{{sop_order_id}}/{{sop_service_address_id}}
	 *
	 *	#### Properties
	 *
	 * |Name|Type|Description|
	 * |----|----|-----------|
	 * |hdocHtml|String|HTML5 document. `text/html`|
	 * |path|String|Location in bucket to store the document.|
	 * |data|Object|(optional) Contains data used to create the path to the document.|
	 *
	 * #### Returns a Promise<Object>
	 *
	 */
	this.write = function (file, filePath) {
		return Promise.resolve(fs.writeFileSync(path.join(this.__fileSystemRoot || "", filePath), file));
	}

	/*
	 * ### read
	 *
	 * Writes an HTML document to a Google Cloud Storage (GCS) Bucket Path.
	 *
	 * #### Remarks
	 *
	 * ##### sharingFormat
	 *
	 * It is recommended to use a shared index structure to the file path. The
	 * path will be compiled using `mustache` to compile the path with the
	 * optionally provided data object.
	 *
	 * **Example**
	 *
	 * //hsl-sop-hdocs/{{sop_case_id}}/{{sop_order_id}}/{{sop_service_address_id}}
	 *
	 *	#### Properties
	 *
	 * |Name|Type|Description|
	 * |----|----|-----------|
	 * |hdocHtml|String|HTML5 document. `text/html`|
	 * |path|String|Location in bucket to store the document.|
	 *
	 * #### Returns a Promise<Object>
	 *
	 */
	this.read = function (filePath) {
		return Promise.resolve(fs.readFileSync(path.join(this.__fileSystemRoot || "", filePath)).toString());
	}

}

module.exports = FileSystemAdaptor;
