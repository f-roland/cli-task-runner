const R = require("ramda");
const { taskRunner } = require("./taskRunner");

/**
 * @typedef {Object} command - follows the rules of the commander package command syntax
 * https://www.npmjs.com/package/commander
 * @typedef {String} command.syntax: syntax of the command. Can contain arguments, the last one being optionnaly
 * variadic (i.e. fn(arg1, arg2, ...arg3))
 * @typedef {Array} command.options: options available for the command - each command is an array represening the
 * arguments to pass to program.option()
 * @typedef {Function} command.action: function to execute when the command is invoked in the CLI tool.
 * The signature of the function contains the arguments passed to the CLI tool, and an object containing all the
 * options passed like function commandAction(...cliArgs, cliOptions) {}
 */

/**
 * creates a function that can register commands with a given commander program
 *
 * @param {Object} program: a commander program instance
 * @return {Function}
 */
function registerCommand(program) {
  /**
   * takes a commander command declaration and registers
   * it with the commander module
   * Equivalent to running
   * program.command(command.syntax).option(...options).action(taskRunner(action))
   * @param {Object} command: a command is an object with three properties
   * @param {String} command.syntax: declaration of the command syntax
   * @param {Array} command.options: optional arguments required for the command
   * @param {Function} command.action : action to perform when this command is invoked
   */
  return function(command) {
    const { syntax, action, options } = command;

    return R.compose(
      R.invoker(1, "action")(taskRunner(action)),
      R.reduce((_program, option) => _program.option(...option), R.__, options),
      R.invoker(1, "command")(syntax)
    )(program);
  };
}

module.exports = registerCommand;
