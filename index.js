var express = require('express');
var app = express();

var httpObj = require('http');
var http = httpObj.createServer(app);
var database = require('./config/mongoose');

var mainURL = "http://localhost:3000";

app.set('view engine', 'ejs');
app.set('views', './views');

app.use("/public/css", express.static(__dirname + "/public/css"))
app.use("/public/js", express.static(__dirname + "/public/js"))
app.use("/public/font-awesome-4.7.0", express.static(__dirname + "/public/font-awesome-4.7.0"))

var session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(session({
	name:'file_transfer',
	secret:"Demokey",
	saveUninitialized:false,
	resave:false,
	cookie:{
		maxAge:(1000*60*100)
	},
	store: MongoStore.create({
		mongoUrl: 'mongodb://0.0.0.0:27017/file_transfer',
		mongooseConnection: database,
		autoRemoved:'disabled'
	}, 
		function(err){
			console.log(err || "connect-mongo setup ok")
		}
	)
}));

app.use(function(request, result, next){
	request.mainURL = mainURL;
	request.isLogin = (typeof request.session.user !== "undefined");
	request.user = request.session.user;

	next();
})

app.use('/', require('./routes'));

http.listen(3000, function(err){
	if(err){
		console.log(`Error in creating the server ${err}`);
	}else{
		console.log(`Server is up and running at ${mainURL}`);
	}
})