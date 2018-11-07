var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var exphbs = require("express-handlebars");
var expressValidator = require("express-validator");
var flash = require("connect-flash");
var session = require("express-session");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var csurf = require('csurf');
var helmet = require('helmet');
var client = require('redis').createClient();
var https = require('https');
var fs = require('fs');
var morgan = require('morgan');
var rfs = require('rotating-file-stream');
var logDirectory = path.join(__dirname,'log');

//Ensure log directory exists
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

//Init Express
var app = express();

//Connect Flash
app.use(flash());

//Routes Variables
var routes = require('./routes/index');
var users = require('./routes/users');


//Proxy Variables
var proxy = require('http-proxy-middleware');
var opts = {
    target: 'http://127.0.0.1:5601',
    changeOrigin: true
};

//DB Variables
var mongo = require("mongodb");
var mongoose = require("mongoose");
mongoose.connect('mongodb://admin:MonG00s3$!@localhost/sso',{ useNewUrlParser: true });
var db = mongoose.connection;


//Hardening
app.use(helmet());
var limiter = require('express-limiter')(app,client);
limiter({
  path: '/users/login',
  method: 'post',
  lookup: ['connection.remoteAddress'],
  // 150 requests per hour
  total: 150,
  expire: 1000 * 60 * 60
});

//Proxying static files and APIs from Kibana
app.use('/bundles/**',proxy(opts));
app.use('/plugins/**',proxy(opts));
app.use('/api/**',proxy(opts));
app.use('/ui/**',proxy(opts));
app.use('/elasticsearch/**',proxy(opts));

//View Engine
app.set('views', path.join(__dirname,'views'));
app.engine('handlebars',exphbs({defaultLayout:'layout'}));
app.set('view engine','handlebars');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//Public Folders
app.use(express.static(path.join(__dirname, 'public')));

//Logging - Create a rotating write stream
var accessLogStream = rfs('access.log', {
  interval: '7d', // rotate weekly
  path: logDirectory
});
morgan.token('date', function() {
    var p = new Date().toString().replace(/[A-Z]{3}\+/,'+').split(/ /);
    return( p[2]+'/'+p[1]+'/'+p[3]+':'+p[4]+' '+p[5] );
});
app.use(morgan(':date :remote-addr :method :url :status :response-time ms', {stream: accessLogStream }));

//Express Session
app.use(session({
    name: 'session',
    secret:'mapacheonlyauthorizeduser',
    cookie: {
        secure:true,
        httpOnly:true,
	maxAge: 7200000
    },
    saveUninitialized:true,
    resave:true,
    expires: 9600
}));

//Passport init
app.use(passport.initialize());
app.use(passport.session());

app.use(expressValidator({
    errorFormatter: function(param,msg,value){
        var namespace = param.split('.')
        , root = namespace.shift()
        , formParam = root;
        
        while(namespace.length){
            formParam += '[' +namespace.shift() + ']';
        }
        return {
            param : formParam,
            msg : msg,
            value: value
        };
    }
}));

//Global Vars
app.use(function(req,res,next){
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
});

app.use('/',routes);
app.use('/users',users);

// Handle 404
app.use(function(req, res) {
 res.send('404: Page not Found', 404);
});

//Hardening
var csrfProtection = csurf({ cookie: true })
app.use(csrfProtection);
app.use(function(req,res,next){
    //res.setHeader("Pragma","no-cache");
    //res.setHeader("Expires","0"); Older browsers
    res.locals.csrftoken = req.csrfToken();
    next();
});

//Set Port
//app.set('port', (process.env.PORT || 80));
https.createServer({
    ca: fs.readFileSync('certs/netflow.ca-bundle'),
    key: fs.readFileSync('certs/netflow.key'),
    cert: fs.readFileSync('certs/netflow.crt')
}, app).listen(443,function(){
    console.log('Server Started at port 443!');
});

//Redirect
var http = require('http');
http.createServer(function(req,res){
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    console.log('Redirecting!');
    res.end();
}).listen(80);


