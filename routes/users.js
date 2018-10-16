var express = require("express");
var router = express.Router();
var User = require('../models/user');
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;

// //Register 
// router.get('/register',function(req,res){
//     res.render('register');
// });

//Login
router.get('/login',function(req,res){
    res.render('login');
})

// //Register User
// router.post('/register',function(req,res){
//     var name = req.body.name;
//     var email = req.body.email;
//     var username = req.body.username;
//     var password = req.body.password;
//     var password2 = req.body.password2;
    
//     //Validation
//     req.checkBody('name','Name is required').notEmpty();
//     req.checkBody('username','Username is required').notEmpty();
//     req.checkBody('password','Password is required').notEmpty();
//     req.checkBody('password2','Passwords do not match').equals(req.body.password);
//     var errors = req.validationErrors();
    
//     if(errors)
//         res.render('register',{
//             errors:errors
//         });
//     else
//     {
//         var newUser = new User({
//             name: name,
//             username: username,
//             password: password,
//             level: 'Networking'
//         });     
        
//         User.createUser(newUser,function(err,user){
//             if(err) throw err;
//             console.log(user);
//         });
        
//         req.flash('success_msg','You are registered and can now login');
//         res.redirect('/users/login');
//     }
// });

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.getUserByUsername(username,function(err,user){
            if(err) throw err;
            if(!user){
                return done(null,false,{message: 'Usuario desconocido'});
            }
            
            User.comparePassword(password,user.password,function(err, isMatch){
                if(err) throw err;
                if(isMatch)
                    return done(null,user);
                else
                    return done(null,false,{message: 'Password invalido'});
            })
        })
    }
));

router.post('/login',
    passport.authenticate('local',{successRediret:'/app/kibana', failureRedirect:'/users/login',failureFlash:true}),
    function(req, res) {
        res.redirect('/app/kibana');
    }
);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});

router.get('/logout', function(req,res){
    req.logout();
    req.flash('success_msg', 'Has cerrado sesión');
    res.redirect('/users/login');
})

module.exports = router;