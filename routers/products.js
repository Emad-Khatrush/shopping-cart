var express = require("express"),
    router  = express.Router(),
    Product = require("../models/product");


// Products route
router.get("/products", (req,res)=>{
  req.session.oldUrl = req.url;
  Product.find({},(err, products)=>{
    if (err) {
      req.flash("error", err.message);
      res.redirect("/");
    }else {
      res.render("./shop/shop-products",{products: products, productsNum: products.length});
    }
  });

});

// show product route
router.get("/products/:id", (req,res)=>{
  req.session.oldUrl = req.url;
  var id = req.params.id;
  Product.findById(id, function(err,product){
    if (err) {
      console.log(err);
      req.flash("error", err.message);
      res.redirect("/products");
    }else {
      res.render("./shop/shop-details",{product: product});
    }
  });
});

module.exports = router;
