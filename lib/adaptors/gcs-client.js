var gcs = require('@google-cloud/storage');

/**
 */
function GoogleCloudStorageAdaptor(options) {
	/*
	 * ### constructor
	 */
	gcsClient = gcs({
		projectId: options.creds.project_id,
		credentials: options.creds
	});

	this.bucket = gcsClient.bucket(options.bucketName);

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
	this.write = function _uploadHDoc(hdocHtml, path) {
		var file = this.bucket.file(path),
			options = {
				metadata: {
					contentType: 'text/html',
				}
			},
			buffer = Buffer.from(hdocHtml);

		return file.save(buffer, options)
			.then(function (resp) {
				return resp[0];
			});


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
	this.read = function _getHDoc(path) {
		return this.bucket.file(path)
			.download()
			.then(function (resp) {
				return resp[0].toString();
			})
			.catch(function (err) {
				throw err;
			});
	}
}

module.exports = GoogleCloudStorageAdaptor;
