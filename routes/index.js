var express = require("express");
var router = express.Router();
var proxy = require('http-proxy-middleware');
var opts = {
    target: 'http://127.0.0.1:5601',
    changeOrigin: true
};

//Get HomePage 
router.get('/',ensureAuthenticated,function(req,res){
    res.render('index');
});
//Get Kibana
router.get('/app/kibana',ensureAuthenticated,proxy(opts));

function ensureAuthenticated(req,res,next){
    if(req.isAuthenticated())
        return next();
    else
    {
        req.flash('error_msg','Aun no has iniciado sesión');
        res.redirect('/users/login');
    }
}

module.exports = router;