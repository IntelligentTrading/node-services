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
    },
    etherTx: () => {
        return {
            testTx: process.env.LOCAL_ENV ? '0x83a0ec1fba17af5ee1b4e9db47e3caa17d686af4caef28321af0ac68baed1674' : '0x97e52d6a21e94566b1174e5adb0b853a3fde7434031a99cdae10eff2300d33c8',
            ittTokenSent: process.env.LOCAL_ENV ? 1 : 37102.93,
            rawData: process.env.LOCAL_ENV ? "0000000000000000000000001fd19a3fb5ec2d73440b908c8038333aefad83bc0000000000000000000000000000000000000000000000000de0b6b3a7640000" : "000000000000000000000000ad02a40a543b396d2c7a598c63a391a7afbf157f0000000000000000000000000d6b5a54f940bf3d52e438cab785981aaefdf40c0000000000000000000000000000000000000000000000000000035fdeb23f40",
            rawAddress: process.env.LOCAL_ENV ? '0000000000000000000000001fd19a3fb5ec2d73440b908c8038333aefad83bc' : '0000000000000000000000000d6b5a54f940bf3d52e438cab785981aaefdf40c'
        }
    }
}
