
function generateUniqueCode() {
    return (Math.round(Math.random() * 100000) * process.env.A_PRIME_NUMBER).toString(16)
}

module.exports = {
    subscription: {
        generate: (plan) => {
            return {
                plan: plan,
                code: generateUniqueCode(),
                creation_date: Date.now()
            }
        },
        checkMathematicalCorrectness: (licenseCode) => {
            return parseInt(licenseCode, 16) % parseInt(process.env.A_PRIME_NUMBER) == 0
        }
    },
    isITTMember: (token) => {
        var team_emojis = process.env.TEAM_EMOJIS.split(',');
        return team_emojis.indexOf(token) >= 0;
    }
}