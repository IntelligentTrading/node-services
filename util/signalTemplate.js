module.exports = {
    applyTemplate: (signalObject) => parseSignal(signalObject)
}

var counter_currencies = ['BTC', 'ETH', 'USDT']
var horizons = ['Short', 'Medium', 'Long']

function parseSignal(signalObject) {

    var bst = getBaseSignalTemplate(signalObject)

    var telegram_signal_message;
    if (signalObject.signal == 'SMA' || signalObject.signal == 'EMA') {

        var sma = getSMATemplate(signalObject);
        telegram_signal_message = `${sma.sma_header_emoji} ${bst.header}\n${bst.price_change_text}, ${bst.price_text}\n${sma.trend_sentiment} ${sma.trend_strength}\n${bst.horizon_text}\n${sma.trend_traversal}\n`;
    }

    if (signalObject.signal == 'RSI') {
        var rsi = getRsiSmaTemplate(signalObject);
        telegram_signal_message = `${rsi.rsi_header_emoji} ${bst.wiki_header} ${bst.price} ${bst.currency_symbol}\n${rsi.rsi_text}\n${rsi.rsi_itt_bias} (${horizons[signalObject.horizon]} horizon)`;
    }

    if (signalObject.signal == 'RSI_Cumulative') {
        var rsi_sma = getRsiSmaTemplate(signalObject);
        telegram_signal_message = `${rsi_sma.rsi_header_emoji} ${bst.wiki_header} ${bst.price} ${bst.currency_symbol}\n${rsi_sma.rsi_general_trend}\n${rsi_sma.rsi_text}\n${rsi_sma.rsi_itt_bias} (${horizons[signalObject.horizon]} horizon)`;
    }

    if (signalObject.signal == 'kumo_breakout') {
        var kumo = getKumoTemplate(signalObject);
        telegram_signal_message = `${kumo.ichimoku_header_emoji} ${bst.wiki_header} ${bst.price} ${bst.currency_symbol}\n${kumo.ichimoku_text} (${bst.horizon_text})`;
    }

    return telegram_signal_message;
}

function getSMATemplate(signalObject) {

    var trend_traversal_progress = signalObject.strength_value < 3 ? `Confirmation ${signalObject.strength_value} out of 3` : `Confirmed`;
    var trend_traversal_sign = `${(signalObject.trend == -1 ? 'Negative' : 'Positive')}`;

    var sma_template = {
        sma_header_emoji: '🔔',
        trend_sentiment: `${(signalObject.trend == -1 ? 'Bearish' : 'Bullish')}`,
        trend_strength: `${(signalObject.trend == -1 ? '🔴' : '🔵').repeat(signalObject.strength_value)}${'⚪️'.repeat(signalObject.strength_max - signalObject.strength_value)}`,
        trend_traversal: `(${trend_traversal_sign} trend reversal - ${trend_traversal_progress})`
    }

    return sma_template;
}

function getRsiSmaTemplate(message_data) {

    if (message_data.rsi_value < 1 || message_data.rsi_value > 100)
        throw new Error('Invalid RSI value');

    var rsi_emoji = `${(message_data.trend == 1 ? '⚠️' : '🆘')}`;
    var rsi_strength_values = ['', 'Very', 'Extremely']
    var rsi_trend = ['Overbought', 'Neutral', 'Oversold'];

    var rsi_sma = {
        rsi_header_emoji: 'ℹ️',
        rsi_general_trend: `General trend: *${(message_data.trend == 1 ? 'Bullish' : 'Bearish')}*`,
        rsi_text: `RSI: *${rsi_trend[parseInt(message_data.trend) + 1]}* (${parseInt(message_data.rsi_value)}) ${rsi_emoji}`,
        rsi_itt_bias: `ITF Bias: Trend reversal to the *${(message_data.trend == 1 ? 'upside' : 'downside')}* is near.`,
    }

    return rsi_sma;
}


function getKumoTemplate(signalObject) {

    var ichi_emoji = `${(signalObject.trend == -1 ? '🆘' : '✅')}`;
    var ichi_breakout = `${(signalObject.trend == -1 ? 'Negative' : 'Positive')}`;
    var ichi_bias = `${(signalObject.trend == -1 ? 'Bear' : 'Bull')}`;

    var ichimoku = {
        ichimoku_header_emoji: 'ℹ️',
        ichimoku_text: `Ichimoku: ${ichi_breakout} Cloud Breakout ${ichi_emoji}\nITF Bias: ${ichi_bias} trend continuation likely.`
    }

    return ichimoku;
}

function getBaseSignalTemplate(signalObject) {

    console.log(signalObject);

    var counter_currency_index = parseInt(signalObject.counter_currency);

    // Let's round to the appropriate digits according to each counter currency
    var rounding_digits = [8, 5, 5, 5]
    var price = (signalObject.price / 100000000).toFixed(rounding_digits[counter_currency_index]);

    var currency_symbol = counter_currencies[counter_currency_index];
    var price_change = signalObject.price_change;
    var wiki_url = ""

    var base_template = {
        horizon_text: `${horizons[signalObject.horizon]} horizon`,
        header: `[${signalObject.transaction_currency}](${wiki_url}) on *${signalObject.timestamp.toString().split('.')[0]} UTC*`,
        price_change_text: `*${price_change >= 0 ? '+' : ''}${(price_change * 100).toFixed(2)}%*`,
        price_text: price == undefined ? "" : `price: ${currency_symbol} ${price}`,
        currency_symbol: currency_symbol,
        price: price,
        wiki_header: `[${signalObject.transaction_currency}](${wiki_url})`
    }
    return base_template;

}