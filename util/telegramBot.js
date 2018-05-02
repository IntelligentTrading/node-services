const TelegramBot = require('node-telegram-bot-api')
const token = process.env.TELEGRAM_BOT_TOKEN
const bot = new TelegramBot(token, { polling: false })

module.exports.bot = bot
module.exports.markdown = {
    parse_mode: "Markdown"
}
module.exports.nopreview_markdown_opts = {
    parse_mode: "Markdown",
    disable_web_page_preview: "true"
}