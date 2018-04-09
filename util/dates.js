module.exports = {
    daysToMillis: (d) => {
        return 24 * 60 * 60 * 1000 * d
    },
    getDaysLeftFrom: (expirationDate) => {
        var _MS_PER_DAY = 1000 * 60 * 60 * 24
        var now = new Date()
        var utc1 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
        var expDate = new Date(expirationDate)
        var utc2 = Date.UTC(expDate.getFullYear(), expDate.getMonth(), expDate.getDate(), expDate.getHours())
    
        return ((utc2 - utc1) / _MS_PER_DAY).toFixed(2)
    }
}