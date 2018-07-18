const shell = require("shelljs");
const { merge } = require("ramda");

const defaultShellOptions = {
  async: false,
  silent: false,
};

/**
 * wraps shelljs exec function in a promise
 * @param {string} cmd command to run
 * @param {object} options shell.js.exec options to use
 * @returns {Promise<stdout|stderr>}
 */
function exec(cmd, options = {}) {
  const shellOptions = merge(defaultShellOptions, options);

  return new Promise((resolve, reject) => {
    const callback = (code, stdout, stderr) => {
      if (code > 0) {
        return reject(new Error(stderr));
      }
      return resolve(stdout);
    };

    const args = [cmd, shellOptions];

    if (shellOptions.async) {
      args.push(callback);
    }

    const { code, stdout, stderr } = shell.exec.apply(null, args);

    if (!shellOptions.async) {
      callback(code, stdout, stderr);
    }
  });
}

/**
 * run any npm commands
 * @param {string} command to run
 * @param {string} cwd current working directory : where the npm commands should be ran
 * @param {object} options options to pass to the cli
 */
function npm(command, cwd, options = {}) {
  const { code } = shell.exec(`yarn ${command}`, { cwd, ...options });
  if (code > 0) {
    throw new Error("failed to run yarn " + command);
  }
}

module.exports = { exec, npm };
