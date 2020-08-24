var mongoose = require("mongoose");

var orderSchema = new mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  cart: {type: Object, required: true},
  address: {type: String, required: true},
  name: {type: String, required: true},
  status: {type: String, required: true},
  note: {type: String},
  paymentId: {type: String, required: true}
});

module.exports = mongoose.model("Order", orderSchema);
