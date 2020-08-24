var express    = require("express"),
    router     = express.Router(),
    Product    = require("../models/product"),
    Cart       = require("../models/cart");
    middleware = require("../middleware/index");
//-------------------------------
//            Shopping cart Route
//-------------------------------

// add product to the cart
router.get("/add-to-cart/:id/:qty", (req,res)=>{
  var qty = req.params.qty;
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
   Product.findById(productId, function(err,product){
    if(err){
      req.flash("error",err.message);
      return res.redirect("/");
    }
    for (var i = 0; i < qty; i++) {
      cart.add(product, product.id);
    }
    req.session.cart = cart;

    req.flash("success","Item added to the cart successfully");
    if (req.session.oldUrl) {
      var oldUrl = req.session.oldUrl;
      req.session.oldUrl = null
      res.redirect(oldUrl);
    }else {
      res.redirect("/");
    }
  });
});

// reduce OR add by one
router.post("/reduce/:id", (req,res)=>{
  var productId = req.params.id;
  var qty = req.body.qty;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.addOrReduce(productId, qty);
  req.session.cart = cart;
  res.redirect("/mycart");
});

// delete product from cart
router.post("/delete/:id", (req,res)=>{
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.productDelete(productId);
  if (middleware.isEmpty(cart.items)) {
    delete req.session.cart
    res.redirect("/mycart");
  }else {
    req.session.cart = cart
    res.redirect("/mycart");
  }
});

router.get("/mycart",(req,res)=>{
  if (!req.session.cart) {
    res.render("./shop/shoping-cart", {products: null});
  }else {
    var cart = new Cart(req.session.cart);
    res.render("./shop/shoping-cart", {products: cart.generateArray(), totalPrice: cart.totalPrice});
  }
});

module.exports = router;
