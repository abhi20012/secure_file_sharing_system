module.exports.index = function(request, result){
	result.render("index", {
		"request": request
	});
}