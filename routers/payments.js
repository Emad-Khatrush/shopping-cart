var express    = require("express"),
    router     = express.Router(),
    middleware = require("../middleware/index"),
    Product    = require("../models/product"),
    Cart       = require("../models/cart"),
    Order      = require("../models/order"),
    paypal     = require("paypal-rest-sdk");

// This is your real test secret API key.
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require("stripe")(stripeSecretKey);
// configure paypal
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AQFXFb7F_sOjyzYg4fhX6ov8Cj44acH0sHuIXm6VKIP4TMhp6WB6sxC3keaH4qles1IlaFwRjlIRppHz',
  'client_secret': process.env.PAYPAL_CLIENT_SECRET_ID
});
//-------------------------------
//            checkout Route
//-------------------------------
router.get("/checkout", middleware.isLogin,async (req,res)=> {
  try {
    if (!req.session.cart) {
      res.render("./payments/shoping-cart", {products: null});
    }
    var cart = new Cart(req.session.cart);

    const customer = await stripe.customers.create({
      email: req.user.username,
      phone: req.user.phone
    });

    const paymentIntent = await stripe.paymentIntents.create({
     amount: cart.totalPrice * 100,
     currency: "usd",
     customer: customer.id
   });
    res.render("./payments/checkout", {total: cart.totalPrice, clientSecret: paymentIntent.client_secret, intent_id: paymentIntent.id, products: cart.generateArray()});
  } catch (err) {
    req.flash("error", "Something went wrong.");
    res.redirect("/");
  }

});

router.post("/create-payment-intent", middleware.isLogin, async (req, res) => {

  if (!req.session.cart) {
    res.redirect("/checkout", {products: null});
  }

  var cart = new Cart(req.session.cart);
  var work = true;
    try {
      var intent = await stripe.paymentIntents.retrieve(req.body.intent_id);
      if(intent.status === "succeeded")
      {
        var order = new Order({
          user: req.user,
          cart: cart,
          address: req.body.address,
          name: req.body.firstName + " " + req.body.lastName,
          paymentId: intent.payment_method,
          status: "processing",
          note: req.body.note
        });
        order.save(function(err,order){
          if (err) {
            console.log(err.message);
            req.flash("error",err.message);
            res.redirect("/checkout");
          }
          req.session.cart = null;
          res.render("./payments/completed");
        });
      }else if (intent.status === "requires_action") {
        while (work) {
          intent = await stripe.paymentIntents.retrieve(req.body.intent_id);
          if (intent.status === "succeeded") {
            work = false;
            var order = new Order({
              user: req.user,
              cart: cart,
              address: req.body.address,
              name: req.body.firstName + " " + req.body.lastName,
              paymentId: intent.payment_method,
              status: "processing",
              note: req.body.note
            });
            order.save(function(err,order){
              if (err) {
                console.log(err.message);
                req.flash("error",err.message);
                res.redirect("/checkout");
              }
              req.session.cart = null;
              res.render("./payments/completed");
            });
          }else if (intent.status === "requires_payment_method") {
            work = false;
            req.flash("error", "Your card declined, please try again later.");
            res.redirect("/checkout");
          }
        }
      }else if(intent.status === "requires_payment_method")
      {
        console.log(intent);
        req.flash("error", intent.last_payment_error.message);
        res.redirect("/checkout");
      }
    }catch{
      req.flash("error", intent.last_payment_error.message);
      res.redirect("/");
    }
  });

  //-------------------------------
  //            Paypal Route
  //-------------------------------

// paypal route: POST
router.post("/pay",(req,res)=>{
  req.session.oldUrl = null;
  var cart = new Cart(req.session.cart);

  var create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/success",
        "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Sat-sweets",
                "sku": "Candy",
                "price": cart.totalPrice,
                "currency": "GBP",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "GBP",
            "total": cart.totalPrice
        },
        "description": "This is the payment description."
    }]

};
order = new Order({
  user: req.user,
  cart: cart,
  address: req.body.address,
  name: req.body.firstName + " " + req.body.lastName,
  note: req.body.note
});



paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        throw error;
    } else {
        for (let i = 0; i < payment.links.length; i++) {
          if (payment.links[i].rel === "approval_url") {
            res.redirect(payment.links[i].href);
          }
        }
    }
  });
});

// success payment in paypal
router.get("/success", middleware.isLogin,(req,res)=>{
  if (!req.session.cart) {
    req.flash("error","you can't reach to this page.");
    res.redirect("/");
  }else{
      const payerId = req.query.PayerID;
      const paymentId = req.query.paymentId;
      var cart = new Cart(req.session.cart);
      const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "GBP",
                "total": cart.totalPrice
            }
        }]
      };

        paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            req.flash("error", "you can't reach to this page.");
            res.redirect("/");
        } else {
            console.log(JSON.stringify(payment));
            console.log(req.query.paymentId);
            order.paymentId = req.query.paymentId;
            order.status    = "processing";
            order.save(function(err,order){
              if (err) {
                console.log(err.message);
                res.redirect("/checkout");
              }
              req.session.cart = null;
              res.render("./payments/completed");
            });
        }
    });
  }

});

router.get("/cancel",middleware.isLogin,(req,res)=>{
  if (req.session.oldUrl) {
    var oldUrl = req.session.oldUrl;
    req.session.oldUrl = null
    req.flash("error", "you can't reach to this page.");
    res.redirect(oldUrl);
  }else {
    req.flash("error","payment canceled, please try again...");
    res.redirect("/checkout");
  }

});

module.exports = router;
