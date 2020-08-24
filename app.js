// setup npm packages
var express               = require("express"),
    bodyParser            = require("body-parser"),
    app                   = express(),
    session               = require("express-session"),
    mongoose              = require("mongoose"),
    Favourite             = require("./models/favourite"),
    flash                 = require("connect-flash"),
    paypal                = require("paypal-rest-sdk"),
    method_override       = require("method-override"),
    seedDB                = require("./seed"),
    passport              = require("passport"),
    localStrategy         = require("passport-local").Strategy,
    passportLocalMongoose = require("passport-local-mongoose"),
    MongoStore            = require("connect-mongo")(session);


// require models
var Product  = require("./models/product"),
    User     = require("./models/user"),
    Cart     = require("./models/cart"),
    Order    = require("./models/order");
    seedDB();

// require routes
var indexRoute    = require("./routers/index"),
    productRoute  = require("./routers/products"),
    userRoute     = require("./routers/user"),
    cartRoute     = require("./routers/cart"),
    paymentsRoute = require("./routers/payments"),
    infoRoute     = require("./routers/info");

// connect mongoose
mongoose.connect("mongodb://localhost/shopping",{useNewUrlParser: true,useUnifiedTopology: true});


// configure packages
app.use(bodyParser.urlencoded({ extended: true }))
app.set("view engine", "ejs");
app.use(method_override("_method"));
app.use(express.static("public"));
app.use(flash());



// passport configurations
app.use(session({
    secret: "TasSweets",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: {maxAge: 180 * 60 * 1000}
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async function(req,res,next){
  await Favourite.find({user: req.user}, (err, result)=>{
    res.locals.favouriteNum = result.length;
  });
  res.locals.currentUser = req.user;
  res.locals.session     = req.session;
  res.locals.error       = req.flash("error");
  res.locals.success     = req.flash("success");
  next();
});


//-------------------------------
//            Routes
//-------------------------------

app.use(indexRoute);
app.use(productRoute);
app.use(userRoute);
app.use(cartRoute);
app.use(paymentsRoute);
app.use(infoRoute);

// listen to 3000 port
app.listen(3000, "127.0.0.1",function(){
  console.log("server has been started");
});
