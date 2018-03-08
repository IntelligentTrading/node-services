module.exports = {
    userTemplate: () => {
        return {
            "telegram_chat_id": -1 * process.env.TELEGRAM_TEST_CHAT_ID,
            "eula": false,
            "token": "",
            "settings": {
                "counter_currencies": [
                    0
                ],
                "transaction_currencies": [
                    "BTC"
                ],
                "horizon": "long",
                "is_muted": false,
                "is_crowd_enabled": false,
                "risk": "medium",
                "TwoFASecret": '',
                "is_ITT_team": false,
                "subscription_plan": 0
            }
        }
    },
    cryptoFeed: () => {
        return {
            feedId: -1,
            ittBullish: [],
            ittBearish: [],
            ittImportant: [],
            url: "",
            votes: {
                positive: 100,
                negative: 50,
                important: 1
            },
            timestamp: Date.now(),
            news: "Interesting news"
        }
    },
    cryptoFeedUpdate: () => {
        return {
            feedId: -1,
            ittBullish: [Math.round(Math.random() * -1000)],
            ittBearish: [Math.round(Math.random() * -1000)],
            ittImportant: [Math.round(Math.random() * -1000)],
            url: "",
            votes: {
                positive: 0,
                negative: 0,
                important: 0
            },
            timestamp: Date.now(),
            news: "Interesting news"
        }
    },
    broadcastMessage: () => {
        return {
            "text": "⚙️ *Broadcast Test*\n\n",
            "replace": [{
                "key": "CHAT_ID",
                "value": "telegram_chat_id"
            }],
            "buttons": [
                {
                    text: "OK", callback_data: "IGNORE"
                }
            ]
        }
    }
}
