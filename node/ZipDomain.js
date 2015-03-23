/*jslint node: true */

"use strict";

var Archiver = require("archiver"),
    extract  = require("extract-zip"),
    fs       = require("fs-extra"),
    path     = require("path");

var DOMAIN_NAME = "brackets-zip";

function zip(inputPath, outputPath, callback) {
    var archive = new Archiver("zip"),
        output = fs.createWriteStream(outputPath);

    output.on("close", function () {
        callback();
    });
    archive.on("error", function (error) {
        callback({ error: error.message || error });
    });
    archive.pipe(output);

    if (/\/$/.test(inputPath)) {
        archive.directory(inputPath, "/");
    } else {
        archive.file(inputPath, { name: path.basename(inputPath) });
    }
    archive.finalize();
}

function unzip(inputPath, outputPath, callback) {
    if (!fs.existsSync(inputPath)) {
        callback({ error: "The file doesn't exist!" });
        return;
    }

    extract(inputPath, { dir: outputPath }, callback);
}

function init(domainManager) {
    if (!domainManager.hasDomain(DOMAIN_NAME)) {
        domainManager.registerDomain(DOMAIN_NAME, { major: 0, minor: 1 });
    }

    domainManager.registerCommand(
        DOMAIN_NAME,
        "zip",
        zip,
        true,
        "Compress a file or a folder.",
        [{
            name: "inputPath",
            type: "string",
            description: "File or folder's path."
        }, {
            name: "outputPath",
            type: "string",
            description: "Output file's path."
        }]
    );

    domainManager.registerCommand(
        DOMAIN_NAME,
        "unzip",
        unzip,
        true,
        "Unzip a file.",
        [{
            name: "inputPath",
            type: "string",
            description: "File's path."
        }, {
            name: "outputPath",
            type: "string",
            description: "Output directory."
        }]
    );
}

exports.init = init;