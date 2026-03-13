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
exports.handleTeamTemplate = exports.handleSkillTemplate = void 0;
const skills_1 = require("../../skills");
function handleSkillTemplate(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const code = i.options.getString('code', true);
        const hideSkillInfo = i.options.getBoolean('hide_skill_info') || false;
        const skillbar = (0, skills_1.decodeTemplate)(code);
    });
}
exports.handleSkillTemplate = handleSkillTemplate;
function handleTeamTemplate(i) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = [];
        for (let j = 1; j <= 8; j++) {
            const code = i.options.getString(String(j));
            if (code) {
                const skillbar = (0, skills_1.decodeTemplate)(code);
                if (skillbar) {
                }
            }
        }
        yield i.reply({ content: 'Team build', files });
    });
}
exports.handleTeamTemplate = handleTeamTemplate;
//# sourceMappingURL=handlers.js.map