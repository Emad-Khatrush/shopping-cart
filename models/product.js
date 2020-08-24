var mongoose = require("mongoose");

var productSchema = new mongoose.Schema({
  name: String,
  image: String,
  descripton: String,
  price: Number
});

module.exports = mongoose.model("Product", productSchema);
