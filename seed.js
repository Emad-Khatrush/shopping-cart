var Product = require("./models/product");
var mongoose = require("mongoose");

function seed()
{
  Product.remove(function(err){
    if (err) {
      console.log(err);
    }else {
      console.log("removes all old imgs");
      for (var i = 0; i < 8; i++) {
        var product = new Product({
          name: "candy",
          image: "./img/product/product-11.jpg",
          descripton: "wooow awesome",
          price: 10
        });
        console.log("product added");
        product.save();
      }
    }
  });
}

module.exports = seed;
