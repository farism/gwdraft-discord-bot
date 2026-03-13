"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePreferencesView = exports.handlePreferencesClear = exports.handlePreferencesSet = void 0;
const firebase_1 = require("../../firebase");
function handlePreferencesSet(i) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const preferences = [];
        for (let j = 0; j < 10; j++) {
            const pref = (_b = (_a = i.options.get(String(j + 1))) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : null;
            preferences[j] = pref;
        }
        const doc = firebase_1.players.doc(i.user.id);
        i.reply({ content: 'used /preferences set', ephemeral: true });
    });
}
exports.handlePreferencesSet = handlePreferencesSet;
function handlePreferencesClear(i) {
    return __awaiter(this, void 0, void 0, function* () {
        i.reply({ content: 'used /preferences clear', ephemeral: true });
    });
}
exports.handlePreferencesClear = handlePreferencesClear;
function handlePreferencesView(i) {
    return __awaiter(this, void 0, void 0, function* () {
        i.reply({ content: 'used /preferences view', ephemeral: true });
    });
}
exports.handlePreferencesView = handlePreferencesView;
//# sourceMappingURL=handlers.js.map