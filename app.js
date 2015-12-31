var express = require("express");
var app = express();

var data = require("./data-layer").getDataStore("./league.db");
var config = require("/Users/matthew/.greenroom.config");

app.set("views", "./views");
app.set("view engine", "jade");

app.get("/", function(req, res) {
	res.render("layout");
});

app.get("/show", function(req, res) {
	var shows = data.getShows(function(shows) {
		res.render("shows", {shows: shows});
	});
});

var server = app.listen(8080, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log("Example app listening at http://%s:%s", host, port);
});
