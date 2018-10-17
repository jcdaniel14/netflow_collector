var express = require("express");
var router = express.Router();
var proxy = require('http-proxy-middleware');
var opts = {
    target: 'http://127.0.0.1:5601',
    changeOrigin: true
};

//Get HomePage 
router.get('/',ensureAuthenticated,function(req,res){
    res.redirect('/app/kibana');
});
//Get Kibana
router.get('/app/kibana',ensureAuthenticated,proxy(opts));
//Get Timelion
router.get('/app/timelion',ensureAuthenticated,proxy(opts));
//Get APM
router.get('/app/apm',ensureAuthenticated,proxy(opts));
//Get Monitoring
router.get('/app/monitoring',ensureAuthenticated,proxy(opts));

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