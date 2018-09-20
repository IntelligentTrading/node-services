String.prototype.toSentenceCase = function () {
    var upperCaseNotAvailable = "0123456789!'?^|[]@#-.,"; //! And other...
    if (upperCaseNotAvailable.indexOf(this[0]) < 0)
        return this[0].toUpperCase() + this.slice(1);

        return this;
}