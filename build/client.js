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
exports.setupClient = exports.client = exports.rest = void 0;
const rest_1 = require("@discordjs/rest");
const v9_1 = require("discord-api-types/v9");
const discord_js_1 = require("discord.js");
const commands_1 = require("./commands");
exports.rest = new rest_1.REST({ version: '9' });
exports.client = new discord_js_1.Client({
    intents: [
        discord_js_1.Intents.FLAGS.GUILDS,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
});
function setupClient(onReady) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!process.env.DISCORD_CLIENT_ID) {
            throw new Error('Missing DISCORD_CLIENT_ID environment variable');
        }
        if (!process.env.DISCORD_TOKEN) {
            throw new Error('Missing DISCORD_TOKEN environment variable');
        }
        exports.rest.setToken(process.env.DISCORD_TOKEN);
        try {
            console.log('Updating application slash commands...');
            exports.rest
                .put(v9_1.Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands_1.commands })
                .then(() => {
                console.log('Successfully updated application slash commands');
            });
            console.log('Logging in...');
            exports.client.on('ready', () => {
                console.log('Logged in');
                onReady(exports.client);
            });
            yield exports.client.login(process.env.DISCORD_TOKEN);
        }
        catch (error) {
            console.error(error);
        }
    });
}
exports.setupClient = setupClient;
//# sourceMappingURL=client.js.map