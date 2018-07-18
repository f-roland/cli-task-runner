const R = require("ramda");

/**
 * module file
 * @module cli-task-runner/utils/file
 */

const { writeFile, readdir, copyFile, copyFileSync } = require("fs");
const { promisify } = require("util");
const { join } = require("path");

const writeFileAsync = promisify(writeFile);
const readdirAsync = promisify(readdir);
const copyFileAsync = promisify(copyFile);

/**
 * Writes a pretty-printed json file from a javascript object
 * @param {String} path : path of the file to write
 * @param {Object} object : object to write to the file
 * @returns {Promise}
 */
async function writeJsonToFile(path, object) {
  return await writeFileAsync(path, JSON.stringify(object, null, 2));
}

/**
 * Copies files from one folder to another
 * @param {String} source path
 * @param {String} destination path
 * @param {Function} fileNameMapper function to map overfile names. Defaults to R.identity
 * @returns {Promise[]} array of promises with the status of the copied files
 */
async function copyFolder(source, destination, fileNameMapper = R.identity) {
  const files = await readdirAsync(source);
  return copyFiles(source, files, destination, fileNameMapper);
}

/**
 * Copies an array of files from a folder to another
 *
 * @param {String} source folder of the files
 * @param {String[]} files list of the files
 * @param {String} destination path
 * @param {Function} fileNameMapper function to map overfile names. Defaults to R.identity
 * @returns {Promise[]} array of promises with the status of the copied files
 */
function copyFiles(source, files, destination, fileNameMapper = R.identity) {
  return R.map(
    file =>
      copyFileSync(join(source, file), fileNameMapper(join(destination, file))),
    files
  );
}

module.exports = {
  writeFileAsync,
  copyFileAsync,
  writeJsonToFile,
  copyFolder,
  copyFiles,
};
