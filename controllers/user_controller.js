var database = require("../config/mongoose");
var bcrypt = require("bcrypt");
var nodemailer = require("nodemailer");
var nodemailerFile = require("../config/nodemailer");
var mainURL = "http://localhost:3000";

module.exports.Register = function (request, result) {
  result.render("Register", {
    request: request,
  });
};

module.exports.Create = async function (request, result) {
  var name = request.fields.name;
  var email = request.fields.email;
  var password = request.fields.password;
  var reset_token = "";
  var isVerified = false;
  var verification_token = new Date().getTime();

  var user = await database.collection("users").findOne({
    email: email,
  });

  if (user == null) {
    bcrypt.hash(password, 10, async function (error, hash) {
      await database.collection("users").insertOne(
        {
          name: name,
          email: email,
          password: hash,
          reset_token: reset_token,
          uploaded: [],
          sharedWithMe: [],
          isVerified: isVerified,
          verification_token: verification_token,
        },
        async function (error, data) {
          var transporter = nodemailer.createTransport(
            nodemailerFile.nodemailerObject
          );
          var text =
            "Please verify your account by clicking the following link: " +
            mainURL +
            "/users/verifyEmail/" +
            email +
            "/" +
            verification_token;

          var html =
            "Please verify your account by clicking the following link: <br><br> <a href='" +
            mainURL +
            "/users/verifyEmail/" +
            email +
            "/" +
            verification_token +
            "'>Confirm Email</a> <br><br> Thank You.";

          await transporter.sendMail(
            {
              from: nodemailerFile.nodemailerFrom,
              to: email,
              subject: "Email verification",
              text: text,
              html: html,
            },
            function (error, info) {
              if (error) {
                console.log(error);
              } else {
                console.log("Email sent: ", info);
              }
              request.status = "success";
              request.message =
                "Signed up successfully. An email has been sent to verify your account. Once verified you will be able to login and start sharing file.";

              result.render("Register", {
                request: request,
              });
            }
          );
        }
      );
    });
  } else {
    request.status = "error";
    request.message = "Email already exist";

    result.render("Register", {
      request: request,
    });
  }
};

module.exports.VerifyEmail = async function (request, result) {
  var email = request.params.email;
  var verification_token = request.params.verification_token;

  var user = await database.collection("users").findOne({
    $and: [
      {
        email: email,
      },
      {
        verification_token: parseInt(verification_token),
      },
    ],
  });

  if (user == null) {
    request.status = "error";
    request.message = "Email does not exist or verification link is expired.";

    result.render("Login", {
      request: request,
    });
  } else {
    await database.collection("users").findOneAndUpdate(
      {
        $and: [
          {
            email: email,
          },
          {
            verification_token: parseInt(verification_token),
          },
        ],
      },
      {
        $set: {
          verification_token: "",
          isVerified: true,
        },
      }
    );

    request.status = "success";
    request.message = "Account has been verified. Please try login.";

    result.render("Login", {
      request: request,
    });
  }
};

module.exports.Login = function (request, result) {
  result.render("Login", {
    request: request,
  });
};



module.exports.LoginUser = async function (request, result) {
  var email = request.fields.email;
  var password = request.fields.password;

  var user = await database.collection("users").findOne({
    email: email,
  });

  if (user == null) {
    request.status = "error";
    request.message = "Email does not exist.";
    result.render("Login", {
      request: request,
    });

    return false;
  }

  bcrypt.compare(password, user.password, function (error, isVerify) {
    if (isVerify) {
      if (user.isVerified) {
        request.session.user = user;
        result.redirect("/");
        return false;
      }

      request.status = "error";
      request.message = "Please verify you email.";
      result.render("Login", {
        request: request,
      });
      return false;
    }
    request.status = "error";
    request.message = "Email/password is incorrect";
    result.render("Login", {
      request: request,
    });
  });
};


module.exports.ForgotPassword = function(request, result){
	result.render("ForgotPassword", {
		"request":request
	});
}

module.exports.RecoveryLink = async function(request, result){
	var email = request.fields.email;
	var user = await database.collection('users').findOne({
		"email":email
	});

	if(user == null){
		request.status="error";
		request.message="Email does not exist";

		result.render("ForgotPassword", {
			"request":request
		});
		return false;
	}

	var reset_token = new Date().getTime();
	await database.collection('users').findOneAndUpdate({
		"email":email
	}, {
		$set:{
			"reset_token":reset_token
		}
	});

	var transporter = nodemailer.createTransport(nodemailerFile.nodemailerObject);

	var text = "Please click the following link to reset your password:" + mainURL + "/users/ResetPassword/" + email + "/" + reset_token;
	
	var html = "Please click the following link to reset your password: <br><br>  <a href= '" + mainURL + "/users/ResetPassword/" + email + "/" + reset_token +"'>Reset Password</a> <br> <br> Thank you.";

	transporter.sendMail({
		from:nodemailerFile.nodemailerFrom,
		to:email,
		subject:"Reset Password",
		text:text,
		html:html,
	}, function(error, info){
		if(error){
			console.error(error);
		}else{
			console.log("Email send: " + info.response);
		}

		request.status="success";
		request.message="Password recovery mail is sent."

		result.render("ForgotPassword", {
			"request":request
		});
	});
}

module.exports.ResetPassword = async function(request, result){
	var email = request.params.email;
	var reset_token = request.params.reset_token;

	var user = await database.collection('users').findOne({
		$and:[{
			"email":email
		}, {
			"reset_token":parseInt(reset_token)
		}]
	});
	if(user == null){
		request.status="error";
		request.message="Link is expired";
		result.render("Error", {
			"request":request
		});
		return false;
	}
	result.render("ResetPassword", {
		"request":request,
		"email":email,
		"reset_token":reset_token
	});
}

module.exports.ResetPasswordLink = async  function(request, result){
	var email = request.fields.email;
	var reset_token = request.fields.reset_token;
	var new_password = request.fields.new_password;
	var confirm_password = request.fields.confirm_password;

	if(new_password != confirm_password){
		request.status="error";
		request.message="Enter same password";

		result.render("ResetPassword", {
			"request":request,
			"email":email,
			"reset_token":reset_token
		});
		return false;
	}
	var user = await database.collection("users").findOne({
		$and:[{
			"email":email,
		}, {
			"reset_token": parseInt(reset_token)
		}]
	});

	if(user == null){
		request.status="error";
		request.message="Email does not exist. Or recovery link is expired."

		result.render("ResetPassword", {
			"request":request,
			"email":email,
			"reset_token":reset_token
		})
		return false;
	}

	bcrypt.hash(new_password, 10, async function(error, hash){
		await database.collection('users').findOneAndUpdate({
			$and:[{
				"email":email
			}, {
				"reset_token":parseInt(reset_token)
			}]
		}, {
			$set:{
				"reset_token":"",
				"password":hash
			}
		});

		result.status="success";
		result.message="Password has been changed. Please try login again!."

		result.render("Login", {
			"request":request
		});
	});
}

module.exports.Logout = function(request, result){
	request.session.destroy();
	result.redirect("/");
};

module.exports.GetUser =async function(request, result){
  const email = request.fields.email;

  if(request.session.user){
    var user = await database.collection('users').findOne({
      "email":email
    })

    if(user == null){
      result.json({
        "status":"error",
        "message":"User " + email + "does not exist"
      });
      return false;
    }

    if(!user.isVerified){
      result.json({
        "status":"error",
        "message":"User " + user.name + " account is not verified."
      });
      return false;
    }
    result.json({
      "status":"error",
      "message":"Data has been fetched.",
      "user":{
        "_id":user._id,
        "name":user.name,
        "email":user.email
      }
    });
    return false;
  }

  result.json({
    "status":"error",
    "message":"Please login to perform this action"
  });
  return false;
}