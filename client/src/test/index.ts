"use strict";

import * as testRunner from "vscode/lib/testrunner";

testRunner.configure({
    timeout: 100000,
    ui: "bdd",
    useColors: true,
});

module.exports = testRunner;
