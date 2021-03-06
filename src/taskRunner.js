/**
 * module taskRunner
 * @module cli-task-runner/src/taskRunner
 * Creates a function which runs a task, (see task typedef below)
 */

const R = require("ramda");
const logger = require("../utils/logger");

/**
 * @typedef step
 * @type {Object}
 * @property {String} step.start: start message for the step
 * @property {Function} step.run: function to perform the task, invoked with the task configuration
 * @property {String} step.error: error message to display when the step fails
 * @property {String} step.completion: completion message to display when the step ends
 */

/**
 * @typedef task
 * @type {Object}
 * @property {String} task.name : name of the task
 * @property {String?} task.startMessage: optional message to display when the task starts
 * @property {Function?} task.prerequisiteChecker: optional predicate function to evaluate whether the task can run
 * invoked with { cliArgs, cliOptions }
 * @property {Function} task.configurator: Function which takes the cli arguments and returns a configuration object
 * for the task. invoked with { cliArgs, cliOptions }
 * @property {step[]} task.steps: array of steps to perform
 * @property {Function?} task.cleanup: Optional cleanup function to run after the task is finished
 */

/**
 * Parses the arguments passed to the command action, and returns separately the CLI arguments & options
 * @param {any[]} args : arguments passed to the command action
 * @returns {Object} : object containing cliArgs & cliOptions
 */
function parseCLIArgs(args) {
  return {
    cliArgs: R.init(args),
    cliOptions: R.last(args),
  };
}

/**
 * Runs a(n async) predicate function to evaluate if all prerequisites are met to run the task
 * This function can either return false or throw to interrupt the CLI action if prerequisites are not met
 * Throwing an error in the prerequisites function will terminate the CLI script
 * @param {Function} prerequisitesChecker: (async) predicate function to run
 * @param {any} cliArgs : cli Arguments
 * @param {any} cliOptions : cli options
 * @returns {Boolean} the result of the prerequisite check, or an error if thrown.
 */
async function checkForPrerequisites(
  prerequisitesChecker,
  { cliArgs, cliOptions }
) {
  try {
    return await prerequisitesChecker({ cliArgs, cliOptions });
  } catch (e) {
    logger.error(e.message, e);
  }
}

/**
 * Puts together a configuration object to be passed to each step function in the task
 * @param {Function} configurator function to run
 * @param {Object} { cliArgs, cliOptions } CLI arguments & options
 * @returns {any} configuration object
 */
async function gatherConfiguration(configurator, { cliArgs, cliOptions }) {
  try {
    const configuration = await configurator({ cliArgs, cliOptions });

    if (cliOptions.verbose) {
      logger.log({ configuration });
    }

    return configuration;
  } catch (e) {
    logger.error(e.message, e);
  }
}

/**
 * Runs a step within a given task
 * @param {Object} configuration object built from the configurator function above
 * @param {step} step within a task - see typedef above
 * @returns {Void} returns void to make sure async steps run sequentially
 */
async function runStep(configuration, step) {
  logger.startStep(step.start);

  try {
    await step.run(configuration);
  } catch (e) {
    logger.error(step.error || e.message, e);
  }

  logger.endStep(step.completion);

  return true;
}

/**
 * Runs a task
 * @param {task} task
 */
function taskRunner(task, packageName, version) {
  const {
    name,
    startMessage,
    prerequisitesChecker = R.T,
    configurator = function() {},
    steps,
    cleanUp,
  } = task;

  return async function(...args) {
    logger.welcome({ packageName, version, scriptName: name }, startMessage);

    const { cliArgs, cliOptions } = parseCLIArgs(args);

    logger.startStep("checking prerequisites...");

    const proceed = await checkForPrerequisites(prerequisitesChecker, {
      cliArgs,
      cliOptions,
    });

    if (!proceed) {
      logger.error("Prerequisites are not satisfied", new Error());
    }

    logger.endStep("All good - moving on");

    logger.startStep("Gathering configuration");

    const configuration = await gatherConfiguration(configurator, {
      cliArgs,
      cliOptions,
    });

    logger.endStep("configuration retrieved");

    for (const step of steps) {
      await runStep(configuration, step);
    }

    if (cleanUp) {
      logger.log("cleaning up...");
      await cleanUp(configuration);
      logger.success("done !");
    }
  };
}

module.exports = {
  taskRunner,
};
