var express = require("express"),
    router  = express.Router(),
    Product = require("../models/product");


//-------------------------------
//         Index Routes
//-------------------------------

// index route
router.get("/", (req,res)=>{
  req.session.oldUrl = req.url;
  Product.find(function(err,products){
    if (err) {
      console.log(err);
      req.flash("error",err.message);
      res.redirect("/");
    }else {
      res.render("./shop/index", {products: products});
    }
  });
});

// contact route
router.get("/contact", (req,res)=>{
  res.render("./shop/contact");
});


module.exports = router;
