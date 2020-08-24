var mongoose = require("mongoose");

var favSchema = new mongoose.Schema({
  user: {type: mongoose.Schema.Types.ObjectId, ref: "user"},
  product: {type: Object, required: true}
});

module.exports = mongoose.model("favourite", favSchema);
