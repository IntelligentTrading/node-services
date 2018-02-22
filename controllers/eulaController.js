var dbapi = require('../api/db').database
var marketApi = require('../api/market').api

const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: false });
const markdown_opts = {
    parse_mode: "Markdown"
};

module.exports = {
    render: (request, response) => {
        var chat_id = request.query.u;
        var eula_url = `/eula_confirm?u=${chat_id}`;
        response.render('eula', { eula_url: eula_url });
    },
    confirm: (request, response) => {
        var chat_id = request.query.u;

        return dbApi.findUserByChatId(chat_id)
            .then(userMatches => {

                if (!userMatches || userMatches.length > 0) {
                    return null;
                }
                else {

                    return marketApi.tickers().then(tkrs => {
                        var tickersSymbols = tkrs.map(tkr => tkr.symbol);
                        var ccs = marketApi.counterCurrencies();

                        var settings = {
                            counter_currencies: [0, 2],//ccs.map(cc => ccs.indexOf(cc)), // BTC and USDT only
                            transaction_currencies: tickersSymbols,
                            horizon: 'medium',
                            is_muted: false,
                            is_crowd_enabled: true,
                            is_ITT_team: false,
                            subscription_plan: 0
                        }

                        var document = {
                            telegram_chat_id: chat_id,
                            eula: true,
                            settings: settings
                        }

                        return dbApi.addUser(document)
                    })
                }
            })
            .then((newUser) => {
                response.render('eula_done');
                if (newUser)
                    return 'Thanks for accepting EULA, you can now subscribe with `/token user_token` or keep using the bot with the free plan.';
                else
                    return 'You already accepted the EULA, you can now subscribe with `/token user_token` or keep using the bot with the free plan.';
            }).then(eula_message => {
                var opts =
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[{
                                "text": "Yes",
                                "callback_data": "wizard.NAV:RUN_true"
                            },
                            {
                                "text": "No",
                                "callback_data": "wizard.NAV:RUN_false"
                            }]]
                        }
                    }
                bot.sendMessage(chat_id, eula_message, markdown_opts).then(() => {
                    bot.sendMessage(chat_id, '💡*Hint*\nWe can walk through few configuration steps or you can do it using a /wizard. Do you wanna do it now?', opts);
                })
            }).catch(reason => {
                bot.sendMessage(chat_id, 'Something went wrong while accepting EULA, please retry or contact us!');
                console.log(reason)
            })
    }
}