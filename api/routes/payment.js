var express = require("express");
var router = express.Router();
var paymentCtrl = require("../../controllers/paymentController");
var solve = require("../../util/solver");

router.post("/verifyTransaction", (req, res) => {
  solve(paymentCtrl.verifyTransaction(req.body), res);
});

router.post("/verifyEthTransaction", (req, res) => {
  solve(paymentCtrl.verifyEthTransaction(req.body), res);
});

router.get("/status/:telegram_chat_id", (req, res) => {
  solve(paymentCtrl.getUserStatus(req.params.telegram_chat_id), res);
});

router.post("/register/:telegram_chat_id", (req, res) => {
  solve(
    paymentCtrl.registerPaymentByUserId(
      req.params.telegram_chat_id,
      req.body.txHash,
      req.body.amount,
      req.body.symbol
    ),
    res
  );
});
module.exports = router;
