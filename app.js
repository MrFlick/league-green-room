var express = require("express");
var app = express();

app.set("views", "./views");
app.set("view engine", "jade");

app.get("/", function(req, res) {
	res.render("login");
});

var server = app.listen(8080, function() {
	var host = server.address().address;
	var port = server.address().port;
	console.log(server.address());

	console.log("Example app listening at http://%s:%s", host, port)
});
