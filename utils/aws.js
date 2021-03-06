/**
 * module AWS
 * @module cli-task-runner/utils/aws
 */

const AWS = require("aws-sdk");
const R = require("ramda");
const { readFileSync } = require("fs");

/**
 * returns the aws credentials - from the aws-cli credentials file,
 * or environment variables.
 * @returns {Object} { aws_access_key_id, aws_secret_access_key } awsCredentials
 */
function getAWSCredentials() {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

  if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
    return {
      aws_access_key_id: AWS_ACCESS_KEY_ID,
      aws_secret_access_key: AWS_SECRET_ACCESS_KEY,
    };
  }

  try {
    return R.compose(
      R.fromPairs,
      R.map(R.split(" = ")),
      R.slice(1, 3),
      R.split("\n"),
      R.toString,
      readFileSync
    )(`${process.env.HOME}/.aws/credentials`);
  } catch (e) {
    throw new Error(
      "An Error occured when trying to retrieve aws credentials. run aws-cli configure and try again"
    );
  }
}

const { aws_access_key_id, aws_secret_access_key } = getAWSCredentials();

const s3 = new AWS.S3({
  params: { Bucket: "assets-production.applicaster.com" },
  accessKeyId: aws_access_key_id,
  secretAccessKey: aws_secret_access_key,
  region: "us-east-1",
});

/**
 * Promisifies aws-sdk methods
 * @param {String} method : name of the method to promisify
 * @param {any} args : arguments to pass to the aws method
 * @returns {Promise} Promise which resolves / reject with the response from the aws method
 */
function awsPromise(method, args) {
  return new Promise((resolve, reject) =>
    s3[method](args, (err, data) => (err ? reject(err) : resolve(data)))
  );
}

/**
 * lists objects contained in a bucket, at a specific path
 * @param {string} [Prefix=""] : path to list
 * @returns {Promise} aws response
 */
function list(Prefix = "") {
  return awsPromise("listObject", { Prefix }).then(
    R.ifElse(R.has("Contents"), R.prop("Contents"), R.empty)
  );
}

/**
 * returns the data contained in a bucket at a specific key
 * @param {String} Key : path to the object to retrieve
 * @returns {Promise} aws response
 */
function get(Key) {
  return awsPromise("getObject", { Key });
}

/**
 * gets the content of an s3 object
 * @param {String} Key : path of the object
 * @returns {Promise} content of object
 */
function getContent(Key) {
  return get(Key).then(
    R.ifElse(R.has("Body"), R.compose(R.toString, R.prop("Body")), R.empty)
  );
}

/**
 * Gets the ETag of an s3 object
 * @param {String} Key : path of the object
 * @returns {Promise} ETag of the object
 */
function getEtag(Key) {
  return get(Key).then(R.ifElse(R.has("ETag"), R.prop("ETag"), R.empty));
}

/**
 * Sets an object in a s3 bucket
 * @param {String} Key : path to the resource to set
 * @param {any} data : data to set
 * @returns {Promise}
 */
const set = R.curry(function(Key, data, ACL = "public-read") {
  return awsPromise("putObject", {
    Key,
    Body: Buffer.from(data),
    ACL,
  });
});

/**
 * Deletes an s3 object
 * @param {String} Key : path to the object
 * @returns {Promise} aws response
 */
function remove(Key) {
  return awsPromise("deleteObject", { Key });
}

module.exports = {
  s3, // exported for tests
  list,
  getContent,
  getEtag,
  set,
  remove,
};
