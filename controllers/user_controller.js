var database = require('../config/mongoose');
var bcrypt = require('bcrypt');
var nodemailer = require('nodemailer');
var nodemailerFile = require('../config/nodemailer');
var mainURL = "http://localhost:3000";





module.exports.Register = function(request, result){
	result.render('Register', {
		"request":request
	});
};

module.exports.Create = async function(request, result){
	var name = request.fields.name;
	var email = request.fields.email;
	var password = request.fields.password;
	var reset_token = "";
	var isVerified = false;
	var verification_token = new Date().getTime();

	var user = await database.collection('users').findOne({
		'email':email
	});

	if(user == null){
		bcrypt.hash(password, 10, async function(error, hash){
			await database.collection('users').insertOne({
				"name":name,
				"email":email,
				"password":hash,
				"reset_token":reset_token,
				"uploaded":[],
				"sharedWithMe":[],
				"isVerified":isVerified,
				"verification_token":verification_token,
			}, async function(error, data){
				var transporter = nodemailer.createTransport(nodemailerFile.nodemailerObject);
				var text = "Please verify your account by clicking the following link: " + mainURL + "/users/verifyEmail/" + email + "/" + verification_token;

				var html = "Please verify your account by clicking the following link: <br><br> <a href='"+mainURL+"/users/verifyEmail/"+email+"/" + verification_token + "'>Confirm Email</a> <br><br> Thank You."

				await transporter.sendMail({
					from: nodemailerFile.nodemailerFrom,
					to:email,
					subject:"Email verification",
					text:text,
					html:html
				}, function(error, info){
					if(error){
						console.log(error);
					}else{
						console.log("Email sent: ", info);
					}
					request.status = "success";
					request.message = "Signed up successfully. An email has been sent to verify your account. Once verified you will be able to login and start sharing file."

					result.render('Register', {
						"request":request
					});
				});
			});
		});
	}else{
		request.status="error";
		request.message="Email already exist";

		result.render("Register", {
			"request":request
		});
	}
}	

module.exports.VerifyEmail = function(request, result){

}