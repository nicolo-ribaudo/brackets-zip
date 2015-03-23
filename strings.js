define(function (require, exports, module) {
    "use strict";

    var _           = brackets.getModule("thirdparty/lodash"),
        CoreStrings = brackets.getModule("strings");

    var ExtensionStrings = require("i18n!nls/strings");

    module.exports = _.extend(ExtensionStrings, CoreStrings);
});