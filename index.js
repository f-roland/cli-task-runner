/**
 * Entry point for the zapplicaster-cli tool
 * it uses commander to expose the different actions which can be performed via the cli
 * Each command is declared in ./src/commands.js, and points to a dedicated function
 * in the ./src/command folder
 */

const program = require("commander");
const { forEach, map, merge } = require("ramda");

const registerCommand = require("./src/registerCommand");

/**
 *
 *
 */
function runCLI(commands, packageName, version) {
  /* iterating over commands to register them */
  forEach(
    registerCommand(program),
    map(merge({ packageName, version }), commands)
  );

  /* pass program version and parse cli argmuents */
  program.version(version).parse(process.argv);
}

module.exports = runCLI;
