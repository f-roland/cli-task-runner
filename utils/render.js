const { resolve } = require("path");
const ejs = require("ejs");
const { promisify } = require("util");

/**
 * module render
 * @module cli-task-runner/utils/render
 */

const { writeFileAsync } = require("../file");
const ejsAsync = promisify(ejs.renderFile);

/**
 * Renders a template to a specific path
 *
 * @param {String} template to render (full path)
 * @param {String} filePath to save the rendered file (full path)
 * @param {String} renderData to inject into the template
 * @returns result of file write operation
 */
async function renderFile(template, filePath, renderData) {
  const fileData = await ejsAsync(resolve(template), renderData);
  return await writeFileAsync(filePath, fileData);
}

module.exports = renderFile;
