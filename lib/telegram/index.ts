require('dotenv').config()
const ModeratorBot = require('node-telegram-bot-api');
import {CommandCallback} from "../../types";
import * as TelegramBot from "node-telegram-bot-api";
import * as newAccount from "../../lib/telegram/commands/newAccount";
import * as setAccount from "../../lib/telegram/commands/setAccount";
import * as getAccount from "../../lib/telegram/commands/getAccount";
import * as setRules from "../../lib/telegram/commands/setRules";
import * as getRules from "../../lib/telegram/commands/getRules";
import * as ban from "../../lib/telegram/commands/ban";
import * as addEvidence from "../../lib/telegram/commands/addEvidence";
import * as setLanguage from "../../lib/telegram/commands/setLanguage";

const bot = new ModeratorBot(process.env.BOT_TOKEN, {polling: true});

const commands: {regexp: RegExp, callback: CommandCallback}[] = [
    newAccount,
    setAccount,
    getAccount,
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

console.log('Telegram bot ready...');