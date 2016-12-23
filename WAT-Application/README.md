# Build the plugins
To build the project run the "grunt" command, this will run the tests and build two Google Chrome plugins
into the build folder.

# Other options are:

    grunt build: Only build the plugins.
    grunt test: Only run the tests
    grunt watch: Build the plugins each time a change is made in any js file.

# Project folders:
## build:
   Where the chrome plugins are created.

## chrome_frame:
   Contains the structure of each Chrome plugin (without the js code) that will be copied into the build folder.

## dist:
   Contains the compiled js code that its created here before being copied into the build folder.

## src:
   Contains the js code that will be concatenated and minified into the dist folder.

## tests:
   Contains html files, each one with QUnit tests for some of the Js files contained in the src folder.

## vendors:
   Other js vendors files.

# Js code structure:

    The file src/wat.js implements a dependency injection framework, you can specified a new module by calling the
    WAT.module(ID,[deps],callback).
        ID: a string to identified the module.
        [deps]: a vector of other module's IDs.
        callback: a function which params are all the dependencies specified in the [deps] vector in the same order.

   Modules are loaded after all its dependencies have been loaded.
   After running the grunt command, all the JS files are put together in a single minified file. The dependency
   injection framework described in the wat.js file allows to run the code properly regarding the order in which each
   file is stored into the minified file.