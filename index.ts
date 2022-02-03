require('dotenv').config()
const ModeratorBot = require('node-telegram-bot-api');
import {CommandCallback} from "./types";
import * as TelegramBot from "node-telegram-bot-api";
import * as addMod from "./lib/commands/addMod";
import * as removeMod from "./lib/commands/removeMod";
import * as setRules from "./lib/commands/setRules";
import * as getRules from "./lib/commands/getRules";
import * as ban from "./lib/commands/ban";
import * as addEvidence from "./lib/commands/addEvidence";
import * as setLanguage from "./lib/commands/setLanguage";

const bot = new ModeratorBot(process.env.BOT_TOKEN, {polling: true});

const commands: {regexp: RegExp, callback: CommandCallback}[] = [
    {regexp: addMod.regexpReply, callback: addMod.callbackReply},
    {regexp: addMod.regexpUserId, callback: addMod.callbackUserId},
    {regexp: removeMod.regexpReply, callback: removeMod.callbackReply},
    {regexp: removeMod.regexpUserId, callback: removeMod.callbackUserId},
    setRules,
    getRules,
    ban,
    addEvidence,
    setLanguage,
];

commands.forEach((command) => {
    bot.onText(
        command.regexp,
        (msg: TelegramBot.Message, match: string[]) => {
            command.callback(bot, msg, match)
        }
    )
})

console.log('Bot ready...');