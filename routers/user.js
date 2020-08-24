var express    = require("express"),
    router     = express.Router(),
    passport   = require("passport"),
    User       = require("../models/user"),
    async      = require("async"),
    nodemailer = require("nodemailer"),
    crypto     = require("crypto");

//-------------------------------
//            Login Route
//-------------------------------

// login GET: route
router.get("/login", (req,res)=>{
  res.render("./userInfo/login");
});

// login POST: route
router.post("/login",
passport.authenticate("local",{
  failureRedirect: "/login",
  failureFlash: true
}),
function(req,res){
  req.flash("success", "Wellcome " + req.user.firstName);
  if (req.session.oldUrl) {
    var oldUrl = req.session.oldUrl;
    req.session.oldUrl = null
    res.redirect(oldUrl);
  }else {
    res.redirect("/");
  }
});
// logout route
router.get("/logout",function(req,res){
  req.logout();
  req.flash("success", "Logout successfully");
  res.redirect("/");
});

//-------------------------------
//            Register Route
//-------------------------------

// register GET: route
router.get("/register", (req,res)=>{
  res.render("./userInfo/register");
});
//register POST: route
router.post("/register", (req,res)=>{
  var newUser = new User({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    phone: req.body.phone,
    gender: req.body.gender
  });
  User.register(newUser,req.body.password,function(err,user){
    if(err)
    {
      console.log(err.message);
      req.flash("error", err.message);
      return res.redirect("/register");
    }
      passport.authenticate("local")(req,res,function(){
        req.flash("success", "Wellcome to home " + req.user.firstName);
        if (req.session.oldUrl) {
          var oldUrl = req.session.oldUrl;
          req.session.oldUrl = null
          res.redirect(oldUrl);
        }else {
          res.redirect("/");
        }
        });
  });
});

// forgot form
router.get("/reset-password", (req,res)=>{
  res.render("./userInfo/reset");
});

// reset-password Post request
router.post("/reset-password",(req,res,next)=>{

  async.waterfall([
   function(done) {
     crypto.randomBytes(20, function(err, buf) {
       var token = buf.toString('hex');
       done(err, token);
     });
   },
   function(token, done) {
     User.findOne({ username: req.body.email }, function(err, user) {
       if (!user) {
         req.flash('error', 'No account with that email address exists.');
         return res.redirect('/reset-password');
       }

       user.resetPasswordToken = token;
       user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

       user.save(function(err) {
         done(err, token, user);
       });
     });
   },
   function(token, user, done) {
     var smtpTransport = nodemailer.createTransport({
       service: 'Gmail',
       auth: {
         user: 'medokhatrush@gmail.com',
         pass: process.env.GMAILPW
       }
     });
     var mailOptions = {
       to: user.username,
       from: 'medokhatrush@gmail.com',
       subject: 'Password Reset',
       text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
         'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
         'http://' + req.headers.host + '/reset/' + token + '\n\n' +
         'If you did not request this, please ignore this email and your password will remain unchanged.\n'
     };
     smtpTransport.sendMail(mailOptions, function(err) {
       console.log('mail sent');
       req.flash('success', 'An e-mail has been sent to ' + user.username + ' with further instructions.');
       done(err, 'done');
     });
   }
 ], function(err) {
   if (err) return next(err);
   res.redirect('/reset-password');
 });

});

// reset password token: GET
router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/reset-password');
    }
    res.render('./userInfo/reset-password', {token: req.params.token});
  });
});

// reset password token: POST
router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'medokhatrush@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.username,
        from: 'medokhatrush@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.username + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});

module.exports = router;
