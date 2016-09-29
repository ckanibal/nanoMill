ace.define("ace/theme/textmate",["require","exports","module","ace/lib/dom"], function(require, exports, module) {
"use strict";

exports.isDark = false;
exports.cssClass = "ace-tm";
exports.cssText = "";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});
