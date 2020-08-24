var express        = require("express"),
    router         = express.Router(),
    User           = require("../models/user"),
    Order          = require("../models/order"),
    Product        = require("../models/product"),
    Favourite      = require("../models/favourite"),
    Cart           = require("../models/cart"),
    middleware     = require("../middleware/index");
//-------------------------------
//            Profile Route
//-------------------------------

// profile get: route
router.get("/profile", middleware.isLogin , (req,res)=>{
  res.render("./userInfo/profile");
});

// edit info Post: route
router.put("/profile/edit",middleware.isLogin,(req,res)=>{
  var user = {
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    gender: req.body.gender
  }
  User.findByIdAndUpdate(req.user._id,user, function(err,updatedUser){
    if (err) {
        console.log(err.message);
        req.flash("error", err.message);
        res.redirect("/profile");
    }
    req.flash("success", "Edit Information successfully");
    res.redirect("/profile");
  });
});

// order Get:route
router.get("/orders", middleware.isLogin,(req,res)=>{
  Order.find({user: req.user}, function(err, orders){
    if (err) {
      console.log(err);
      res.redirect("/");
    }else {
      var cart;
      if (middleware.isEmpty(orders)) {
        res.render("./payments/orders",{orders: null});
      }else{
        orders.forEach((order) => {
          cart = new Cart(order.cart);
          order.items = cart.generateArray();
        });
        res.render("./payments/orders",{orders: orders});
      }
    }
  });
});
// favourite route
router.get("/favourite",middleware.isLogin ,(req,res)=>{
  req.session.oldUrl = req.url;
  Favourite.find({user: req.user}, (err, favourites)=>{
    if (err) {
      console.log(err.message);
      req.flash("error", err.message);
      res.redirect("/");
    }else {
      if (middleware.isEmpty(favourites)) {
        res.render("./userInfo/favourite", {favourites: null});
      }else {
        res.render("./userInfo/favourite", {favourites: favourites});
      }
    }
  });

});
router.get("/favourite/:id", middleware.isLogin,(req, res)=>{
  var id = req.params.id;
  var sameProduct = false;
   Product.findById(id, (err, product)=>{
    if (err) {
      console.log(err.message);
      req.flash("error", err.message);
      res.redirect("/");
    }else {
        Favourite.find({user: req.user}, (err,result)=>{
          result.forEach((item) => {
            if (item.product._id == id) {
                sameProduct = true
            }
          });
          if (sameProduct) {
            req.flash("error", "You already have this product in your favourite list");
            if (req.session.oldUrl) {
              var oldUrl = req.session.oldUrl;
              req.session.oldUrl = null;
              res.redirect(oldUrl);
            }else {
                  res.redirect("/");
              }
          }else {
            var favourite = new Favourite({
              user: req.user,
              product: product
            });
            favourite.save(function(err,product){
              if (err) {
                console.log(err.message);
                req.flash("error",err.message);
                res.redirect("/");
              }else {
                req.flash("success", "Added to favourite list");
                if (req.session.oldUrl) {
                  var oldUrl = req.session.oldUrl;
                  req.session.oldUrl = null;
                  res.redirect(oldUrl);
                }else {
                      res.redirect("/");
                  }
                }
             })
            }
          })
        }
      })
    });

router.delete("/products/:id", (req,res)=>{
  var id = req.params.id;
  var deletedId;
  Favourite.find({user: req.user}, (err,result)=>{
    if (err) {
      req.flash("error", err.message);
      res.redirect("/favourite");
    }else {
      result.forEach((item, i) => {
        if (item.product._id == id) {
          deletedId = result[i]._id;
        }
      });
      Favourite.findByIdAndRemove(deletedId, (err,deletedItem)=>{
        if (err) {
          req.flash("error", err.message);
          res.redirect("/favourite");
        }else {
          req.flash("success", "Product deleted from list");
          res.redirect("/favourite");
        }
      });
    }
  });
});

router.get("*", (req, res)=>{
  req.flash("error", "No page found");
  if (req.session.oldUrl) {
    var oldUrl = req.session.oldUrl;
    req.session.oldUrl = null;
    return res.redirect(oldUrl);
  }
  res.redirect("back");
});

module.exports = router;
