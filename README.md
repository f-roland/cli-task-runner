# CLI Task Runner

## Requirements

* node ^8.0.0

## Usage

Create an entry point for the cli tool. Usually it will be `index.js` at the root of your package
in your package.json file, specify the "bin" property, with the name of your cli tool, and the file to run.
Typically it would be

```javascript
// in package.json

"bin": {
  "my-cli": "node ./index.js"
}
```

then you can invoke your tool with `my-cli [command] <arg> -o ...`

In your index.js file, do the following :

```javascript
// first create your task

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

const myTask = {
  name: "My Task",
  startMessage: "Running my task. Bear with us",
  prerequisitesChecker({ cliArgs, cliOptions }) {
    /* checks env or anything else - throws if not ok, returns true if ok */
  },
  configurator({ cliArgs, cliOptions }) {
    /* builds a configuration object based on cliArgs & cliOptions.
                            the config object is passed to each step below */
  },
  steps: [
    {
      start: "Running first step",
      run(config) {
        /* this is where you actually do something */
      },
      error: "Could not run the step ! 😱",
      completion: "step done !",
    },
    {
      start: "Running step 2",
      run(config) {
        /* this is where you actually do something */
      },
      error: "Nope, didn't work",
      completion: "Yay !",
    },
  ],
};

// Then register your commands.

/**
 * @typedef {Object} command - follows the rules of the commander package command syntax
 * https://www.npmjs.com/package/commander
 * @typedef {String} command.syntax: syntax of the command. Can contain arguments, the last one being optionally
 * variadic (i.e. fn(arg1, arg2, ...arg3))
 * @typedef {Array} command.options: options available for the command - each command is an array representing the
 * arguments to pass to program.option()
 * @typedef {Function} command.action: function to execute when the command is invoked in the CLI tool.
 * The signature of the function contains the arguments passed to the CLI tool, and an object containing all the
 * options passed like function commandAction(...cliArgs, cliOptions) {}
 */

const commands = [
  {
    syntax: "my task <arg1>",
    options: [
      ["-o, --cli-option", "This one has no type so it will be a boolean"],
      [
        "-d, --destination-path [path]",
        "Define a custom output path for the template project",
      ],
    ],
    action: myTask,
  },
];

// Last but not least, import the function from this package

const runCLI = require("cli-task-runner");
const version = require("./package.json"); // version can be a string but it's good practice to pull it from package.json

runCLI(commands, version); // that's it !
```

Cherry on top, your CLI tool can use some of the utility packages
