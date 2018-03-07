module.exports = {
    daysToMillis: (d) => {
        return 24 * 60 * 60 * 1000 * d
    },
    getDaysLeftFrom: (expirationDate) => {
        // Discard the time and time-zone information.
        var _MS_PER_DAY = 1000 * 60 * 60 * 24;
        var now = new Date()
        var utc1 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        var utc2 = Date.UTC(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());

        return Math.floor((utc2 - utc1) / _MS_PER_DAY);
    }
}