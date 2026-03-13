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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("./client");
const registry_1 = require("./commands/draft/registry");
const getHandler_1 = require("./commands/getHandler");
const permissions_1 = require("./commands/permissions");
const logging_1 = require("./logging");
dotenv_1.default.config();
function handleInteractions(i) {
    return __awaiter(this, void 0, void 0, function* () {
        if (i.isCommand()) {
            (0, logging_1.logCommand)(i);
            try {
                if (i.commandName === 'draft') {
                    (0, logging_1.sendAuditLogMessage)(i);
                    if (!(yield (0, permissions_1.checkDraftModerator)(i))) {
                        console.log('Cannot run /draft commands, not a draft moderator');
                        return;
                    }
                }
                const handler = (0, getHandler_1.getInteractionHandler)(i);
                if (handler) {
                    yield handler(i);
                }
            }
            catch (e) {
                console.error(e);
            }
        }
    });
}
;
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, client_1.setupClient)((client) => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, registry_1.loadExistingDrafts)(client);
        client.on('interactionCreate', handleInteractions);
    }));
}))();
//# sourceMappingURL=index.js.map