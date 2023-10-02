var nodemailer = require('nodemailer');

var nodemailerFrom = "kashyapabhinav777@gmail.com";
var nodemailerObject = {
	service:"gmail",
	host:"smtp.gmail.com",
	port:465,
	secure:true,
	auth:{
		user:"kashyapabhinav777@gmail.com",
		pass:"vhhvtnahcovepynm"
	}
};

module.exports = {
	nodemailerFrom,
	nodemailerObject
};
