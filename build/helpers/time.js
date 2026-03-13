"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTime = void 0;
const date_fns_1 = require("date-fns");
function parseTime(s) {
    if ((0, date_fns_1.isMatch)(s, 'HH:mm')) {
        return (0, date_fns_1.parse)(s, 'HH:mm', new Date());
    }
    else if ((0, date_fns_1.isMatch)(s, 'HH:mm:ss')) {
        return (0, date_fns_1.parse)(s, 'HH:mm:ss', new Date());
    }
    return new Date();
}
exports.parseTime = parseTime;
//# sourceMappingURL=time.js.map