define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        NodeDomain     = brackets.getModule("utils/NodeDomain");

    var _nodeDomain = new NodeDomain("brackets-zip", ExtensionUtils.getModulePath(module, "node/ZipDomain.js"));

    function _exec(command, from, to) {
        return _nodeDomain.exec(command, from, to).then(function (message) {
            if (message && message.error) {
                return $.Deferrred().reject(message.error).promise();
            }
        });
    }

    function zip(from, to) {
        return _exec("zip", from, to);
    }

    function unzip(from, to) {
        return _exec("unzip", from, to);
    }

    exports.zip = zip;
    exports.unzip = unzip;
});