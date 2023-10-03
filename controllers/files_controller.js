const database = require('../config/mongoose');
const {ObjectId} = require('mongodb');
var fileSystem = require('fs');


function recursiveGetFolder(files, _id){
	var singleFile = null;

	for(var a=0; a < files.length; a++){
		const file = files[a];

		//return if file type is folder and ID is found
		if(file.type == "folder"){
			if(file._id == _id){
				return file;
			}

			if(file.files.length > 0){
				singleFile = recursiveGetFolder(file.files, _id);

				if(singleFile != null){
					return singleFile;
				}
			}
		}
	}
}

function getUpdatedArray(arr, _id, uploadedObj){
	for(var a=0; a<arr.length; a++){
		if(arr[a].type == "folder"){
			if(arr[a]._id == _id){
				arr[a].files.push(uploadedObj);
				arr[a]._id = new ObjectId(arr[a]._id);
			}
	
			if(arr[a].files.length>0){
				arr[a]._id = new ObjectId(arr[a]._id);
				getUpdatedArray(arr[a].files, _id, uploadedObj);
			}
		}
	}
	return arr;
}


module.exports.MyUploads = async function(request, result){
	const _id = request.params._id;
	if(request.session.user){
		var user = await database.collection('users').findOne({
			"_id": new ObjectId(request.session.user._id)
		});

		var uploaded = null;
		var folderName = "";
		var createdAt = "";
		if(typeof _id == "undefined"){
			uploaded = user.uploaded;
		}else{
			var folderObj = await recursiveGetFolder(user.uploaded, _id);

			if(folderObj == null){
				request.status="error";
				request.message="Folder not found";
				result.render("MyUploads", {
					"request":request
				});
				return false
			}
			uploaded = folderObj.files;
			folderName = folderObj.folderName;
			createdAt = folderObj.createdAt;
		}
		if(uploaded == null){
			request.status = "error";
			request.message = "Directory not found";
			result.render("MyUploads", {
				"request":request
			});
			return false;
		}

		result.render("MyUploads", {
			"request":request,
			"uploaded":uploaded,
			"_id":_id,
			"folderName":folderName,
			"createdAt":createdAt
		});
		return false;
	}
	result.redirect("/users/Login");
}

module.exports.CreateFolder = async function(request, result){
	const name = request.fields.name;
	const _id = request.fields._id;

	if(request.session.user){
		var user = await database.collection('users').findOne({
			"_id": new ObjectId(request.session.user._id)
		});

		var uploadedObj = {
			"_id": ObjectId(),
			"type": "folder",
			"folderName": name,
			"files": [],
			"folderPath": "",
			"createdAt": new Date().getTime()
		};

		var folderPath = "";
		var updatedArray = [];
		if(_id == ""){
			folderPath = "public/uploads/"+user.email+"/"+name;
			uploadedObj.folderPath = folderPath;

			if(!fileSystem.existsSync("public/uploads/"+user.email)){
				fileSystem.mkdirSync("public/uploads/"+user.email);
			}
		}else{
			var folderObj = await recursiveGetFolder(user.uploaded, _id);
			uploadedObj.folderPath = folderObj.folderPath+"/"+name;
			updatedArray = await getUpdatedArray(user.uploaded, _id, uploadedObj);
		}

		if(uploadedObj.folderPath == ""){
			request.session.status = "error";
			request.session.message = "Folder name must not be empty.";
			result.redirect("/files/MyUploads");
			return false;
		}

		if(fileSystem.existsSync(uploadedObj.folderPath)){
			request.session.status = "error";
			request.session.message = "Folder with same name already exist.";
			result.redirect("/files/MyUploads");
			return false;
		}

		if(_id == ""){
			await database.collection('users').updateOne({
				"_id": new ObjectId(request.session.user._id)
			}, {
				$push:{
					"uploaded":uploadedObj
				}
			});
		} else{
			for(var a = 0; a<updatedArray.length; a++){
				updatedArray[a]._id = new ObjectId(updatedArray[a]._id);
			}

			await database.collection('users').updateOne({
				"_id": new ObjectId(request.session.user._id)
			}, {
				$set:{
					"uploaded":updatedArray
				}
			});
		}
		result.redirect("/files/MyUploads/"+_id);
		return false;
	}

	result.redirect("/users/Login");
}


module.exports.UploadFile = async function(request, result){
	if(request.session.user){
		var user = await database.collection('users').findOne({
			"_id":ObjectId(request.session._id)
		});

		if(request.files.file.size > 0){
			const _id = request.fields._id;

			var uploadedObj = {
				"_id":ObjectId(),
				"size":request.files.file.size,
				"name":request.files.file.name,
				"type":request.files.file.type,
				"filePath":"",
				"createdAt": new Date().getTime()
			};

			var filePath = "";

			if(_id == ""){
				filePath = "public/uploads/" + user.email + "/" + new Date().getTime() + "-" + request.files.file.name;
				uploadedObj.filePath = filePath;
				if(!fileSystem.existsSync("public/uploads/"+user.email)){
					fileSystem.mkdirSync("public/uploads/"+user.email);
				}

				fileSystem.readFile(request.files.file.path, function(err, data){
					if(err){
						throw err;
					}
					console.log("File read");

					fileSystem.writeFile(filePath, data, async function(err){
						if(err) throw err;

						console.log("File written");

						await database.collection('users').updateOne({
							"_id":ObjectId(request.session.user._id)
						}, {
							$push: {
								"uploaded":uploadedObj
							}
						});
						result.redirect("/files/MyUploads/"+_id);
					});
					fileSystem.unlink(request.files.file.path, function(err){
						if(err) throw err;
						console.log("File deleted");
					});
				});
			}else{
				var folderObj = await recursiveGetFolder(user.uploaded, _id);

				uploadedObj.filePath = folderObj.folderPath + "/" + request.files.file.name;

				var updatedArray = await getUpdatedArray(user.uploaded, _id, uploadedObj);

				//read the file
				fileSystem.readFile(request.files.file.path, function(err, data){
					if(err) throw err;
					console.log("file read");

					//write the file
					fileSystem.writeFile(uploadedObj.filePath, data, async function(err){
						if(err) throw err;
						console.log("File written");

						for(var a=0; a<updatedArray.length; a++){
							updatedArray[a]._id = ObjectId(updatedArray[a]._id);
						}

						await database.collection('users').updateOne({
							"_id":ObjectId(request.session.user._id)
						}, {
							$set: {
								"uploaded":updatedArray
							}
						});
						result.redirect("/files/MyUploads/"+_id);
					});
					//delete the file

					fileSystem.unlink(request.files.file.path, function(err){
						if(err) throw err;
						console.log("File deleted");
					});
				});
			}
		}else{
			request.status="error";
			request.message="Please select a valid image.";

			result.render("MyUploads", {
				"request":request
			});
		}
		return false;
	}
	result.render("/users/Login");
}