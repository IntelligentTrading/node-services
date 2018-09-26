require('./extensions')
var tickersController = require('../controllers/tickersController')
var _ = require('lodash')

var counter_currencies = undefined

function loadCounterCurrencies() {
  if (counter_currencies) return Promise.resolve(counter_currencies)
  else {
    return tickersController.counterCurrencies().then(json_counter_currencies => {
      counter_currencies = JSON.parse(json_counter_currencies)
      return counter_currencies
    })
  }
}

loadCounterCurrencies().then(() => console.log('Signal helper initialized'))

function applyTemplate(message_data) {

  return getBaseSignalTemplate(message_data)
    .then((bst) => {

      var telegram_signal_message;

      if (message_data.signal == 'SMA' || message_data.signal == 'EMA') {

        var sma = getSMATemplate(message_data);
        telegram_signal_message = `${sma.sma_header_emoji} ${bst.header}\n${bst.price_change_text}, ${bst.price_text}\n${sma.trend_sentiment} ${sma.trend_strength}\n${bst.horizon_text}\n${sma.trend_traversal}\n`;
      }

      if (message_data.signal == 'RSI') {
        var rsi = getRsiSmaTemplate(message_data);
        telegram_signal_message = `${rsi.rsi_header_emoji} ${bst.wiki_header} ${bst.price_text}\n${rsi.rsi_text}\n${bst.trend} - ${bst.horizon_text}`;
      }

      if (message_data.signal == 'RSI_Cumulative') {
        var rsi_sma = getRsiSmaTemplate(message_data);
        telegram_signal_message = `${rsi_sma.rsi_header_emoji_pro} ${bst.wiki_header} ${bst.price_text}\n${rsi_sma.premium}\n${bst.trend} - ${bst.horizon_text}`;
      }

      if (message_data.signal == 'kumo_breakout') {
        var kumo = getKumoTemplate(message_data);
        telegram_signal_message = `${kumo.ichimoku_header_emoji} ${bst.wiki_header} ${bst.price} ${bst.currency_symbol}\n${kumo.ichimoku_text}${bst.trend} - ${bst.horizon_text}`;
      }

      if (message_data.signal == 'ANN_Simple') {
        var ann_simple = getAnnSimpleTemplate(message_data)
        telegram_signal_message = `${ann_simple.ann_simple_header_emoji} ${bst.wiki_header} ${bst.price} ${bst.currency_symbol}\n${ann_simple.ann_simple_text}\n${bst.trend} - ${bst.horizon_text}`;
      }

      if (message_data.signal == 'VBI') {
        var vbi = getVBITemplate(message_data)
        telegram_signal_message = `${vbi.header_emoji} ${bst.wiki_header} ${bst.price} ${bst.currency_symbol}\n${vbi.vbi_text}\n${bst.trend} - ${bst.horizon_text}`;
      }

      return telegram_signal_message;
    })
}


function getVBITemplate(message_data) {

  var vbi = {
    header_emoji: '📶',
    vbi_text: `#Volume Alert`,
  }
  return vbi;
}

function getSMATemplate(message_data) {

  var trend_traversal_progress = message_data.strength_value < 3 ? `Confirmation ${message_data.strength_value} out of 3` : `Confirmed`;
  var trend_traversal_sign = `${(message_data.trend == -1 ? 'Negative' : 'Positive')}`;

  var sma_template = {
    sma_header_emoji: '🔔',
    trend_sentiment: `${(message_data.trend == -1 ? 'Bearish' : 'Bullish')}`,
    trend_strength: `${(message_data.trend == -1 ? '🔴' : '🔵').repeat(message_data.strength_value)}${'⚪️'.repeat(message_data.strength_max - message_data.strength_value)}`,
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
    rsi_header_emoji_pro: '🔰',
    premium: '#Proprietary1 (RSI + SMA)',
    rsi_text: `#RSI = *${parseInt(message_data.rsi_value)}* ${rsi_strength_values[parseInt(message_data.strength_value) - 1]} ${rsi_trend[parseInt(message_data.trend) + 1]} ${rsi_emoji}`,
    rsi_itt_bias: `Trend reversal to the *${(message_data.trend == 1 ? 'upside' : 'downside')}* is near.`,
  }

  return rsi_sma;
}

function getKumoTemplate(message_data) {

  var ichi_emoji = `${(message_data.trend == -1 ? '🆘' : '✅')}`;
  var ichi_breakout = `${(message_data.trend == -1 ? 'Negative' : 'Positive')}`;

  var ichimoku = {
    ichimoku_header_emoji: 'ℹ️',
    ichimoku_text: `#Ichimoku: ${ichi_breakout} Cloud Breakout ${ichi_emoji}\n`,
  }

  return ichimoku;
}

function getAnnSimpleTemplate(message_data) {
  var formatted_up = '*' + (message_data.probability_up * 100).toFixed(1) + '%* ▲'
  var formatted_down = '*' + (message_data.probability_down * 100).toFixed(1) + '%* 🔻'

  var probability = `${message_data.probability_up > message_data.probability_down ? formatted_up : formatted_down}`
  var description = `#AI: new price trend prediction`
  var ann_simple = {
    ann_simple_header_emoji: '🤖',
    ann_simple_text: `${description}\n${probability}`
  }

  return ann_simple;
}

function getBaseSignalTemplate(message_data) {

  console.log(message_data);

  var counter_currency_index = parseInt(message_data.counter_currency);

  // Let's round to the appropriate digits according to each counter currency
  var rounding_digits = [8, 5, 5, 5]
  var price = (message_data.price / 100000000).toFixed(rounding_digits[counter_currency_index]);
  var currency_symbol = counter_currencies.filter(cc => cc.index == counter_currency_index)[0].symbol;
  var price_change = message_data.price_change;

  return tickersController.tickers()
    .then((tkrs) => {
      const coinmarketcap_url = "https://coinmarketcap.com/currencies/";
      if (tkrs == undefined || tkrs.length <= 0)
        return coinmarketcap_url;

      var matching_tkrs = tkrs.filter(t => t.symbol == message_data.transaction_currency);
      currency_wiki_data = matching_tkrs[0];
      if (currency_wiki_data == undefined) return coinmarketcap_url;

      return `${coinmarketcap_url}${currency_wiki_data.name}`;

    }).then((wiki_url) => {

      var validities = ['1hr', '4hr', '24hr']
      var horizons = ['short', 'medium', 'long']

      var base_template = {
        horizon_text: message_data.horizon ? `valid for #${validities[horizons.indexOf(message_data.horizon)]}` : message_data.horizon,
        header: `[${message_data.transaction_currency}](${wiki_url}) on *${message_data.timestamp.toString().split('.')[0]} UTC*`,
        price_change_text: `*${price_change >= 0 ? '+' : ''}${(price_change * 100).toFixed(2)}%*`,
        price_text: price == undefined ? "" : `${price} ${currency_symbol}`,
        currency_symbol: currency_symbol,
        price: price,
        wiki_header: `$${message_data.transaction_currency}`,//`[$${message_data.transaction_currency}](${wiki_url})`,
        source: message_data.source ? `on #${message_data.source.toSentenceCase()}` : '',
        trend: `${(message_data.trend == -1 ? '#Bearish' : '#Bullish')} ${message_data.source ? 'on #' + message_data.source.toSentenceCase() : ''}`
      }

      return base_template;
    });
}

function decodeMessage(message_body) {

  var message_data_64 = message_body;
  try {
    var message_data_string = Buffer.from(message_data_64, 'base64').toString();
    return JSON.parse(message_data_string);
  }
  catch (err) {
    console.log(err);
    return;
  }
}

var sorted_messages_cache = [];

function sortedSignalInsertion(newSignal) {
  sorted_messages_cache.splice(_.sortedIndexBy(sorted_messages_cache, newSignal, function (signal) { signal.timestamp }), 0, newSignal);
}

function cleanSortedCache() {
  while (sorted_messages_cache.length > 50)
    sorted_messages_cache.pop();
}

function checkTimestamp(messageBody) {

  return messageBody != undefined &&
    messageBody.sent_at != undefined &&
    Date.now() - Date.parse(messageBody.sent) < 20 * 60000;
}

function checkDuplicates(messageId, signalId) {

  cleanSortedCache();

  if (sorted_messages_cache.filter(record => record.messageId == messageId || record.signalId == signalId).length <= 0) {
    sortedSignalInsertion({ messageId: messageId, signalId: signalId, timestamp: Date.now() });
    return false;
  }

  return true;
}

function checkSignalValues(decoded_message_body) {
  var signalCheckResult = { hasMeaning: true, rejectionMessage: '' }
  if (decoded_message_body.signal == 'ANN_Simple') {
    signalCheckResult.hasMeaning = Math.abs(parseFloat(decoded_message_body.probability_up) - parseFloat(decoded_message_body.probability_down)) > 0.035
    signalCheckResult.rejectionMessage = signalCheckResult.hasMeaning ? '' : 'AI probabilities difference lower than 3.5%'
  }

  return signalCheckResult
}

// If the counter and transaction currencies are the same, skip
function checkCounterCurrency(messageBody) {
  return messageBody.transaction_currency == counter_currencies.filter(cc => cc.index == parseInt(messageBody.counter_currency))[0].symbol
}

function checkValidity(message) {
  var decoded_message_body = decodeMessage(message.Body)

  var hasValidTimestamp = checkTimestamp(decoded_message_body)
  var isCounterCurrency = checkCounterCurrency(decoded_message_body)
  var isDuplicateMessage = checkDuplicates(message.MessageId, decoded_message_body.id)
  var signalPayload = checkSignalValues(decoded_message_body)

  var isValid = hasValidTimestamp && !isDuplicateMessage && !isCounterCurrency && signalPayload.hasMeaning
  var validity = { isValid: isValid, reasons: '', decoded_message_body: decoded_message_body }

  if (!isValid) {
    var invalidReasonsList = [];
    if (!hasValidTimestamp)
      invalidReasonsList.push('is too old');
    if (isDuplicateMessage)
      invalidReasonsList.push('is a duplicate');
    if (isCounterCurrency)
      invalidReasonsList.push('is counter currency');
    if (!signalPayload.hasMeaning)
      invalidReasonsList.push(signalPayload.rejectionMessage)

    validity.reasons = invalidReasonsList.join(',')
  }

  return validity
}

module.exports = {
  init: () => loadCounterCurrencies(),
  applyTemplate: (message) => applyTemplate(message),
  checkValidity: (message) => checkValidity(message)
}
