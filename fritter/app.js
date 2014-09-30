var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// New Code
var mongo = require('mongodb');
var monk = require('monk');
//var db = monk('localhost/fritter'); //localhost:27017/fritter'

//to add mongo
var connection_string = 'localhost/saadiyahfritter';

if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
  connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ':' +
        process.env.OPENSHIFT_MONGODB_DB_PASSWORD + '@' +
        process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
        process.env.OPENSHIFT_MONGODB_DB_PORT + '/saadiyahfritter';
}

var db = monk(connection_string);

var routes = require('./routes/index');
var users = require('./routes/users');
//added a posts js file
var posts = require('./routes/posts');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser("secretTockenHere"));
//session
app.use(session({secret: "secretTockenHere", resave :true, saveUninitialized: true})); //to be modified later

app.use(express.static(path.join(__dirname, 'public')));

// Make our db accessible to our router my app stops working when i use session in here
app.use(function(req,res,next){
    req.db = db;        //WHY DO I NOT USE SESSION HERE??????
    next();
});

app.use('/posts', posts);
app.use('/', routes);
app.use('/users', users);

//to make db work
var port = process.env.OPENSHIFT_NODEJS_PORT;
var ip = process.env.OPENSHIFT_NODEJS_IP;

app.listen(port || 8080, ip);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
