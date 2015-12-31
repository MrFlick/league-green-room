var express = require("express");
var app = express();

function promiseWrap(x) {
	return new Promise(function(resolve, reject) {
		resolve(x);
	});
};

var data = require("./data-layer").getDataStore("./league.db");
var config = require("/Users/matthew/.greenroom.config");

app.set("views", "./views");
app.set("view engine", "jade");

app.get("/", function(req, res) {
	res.render("layout");
});

app.get("/show", function(req, res) {
	data.getShows().then(function(shows) {
		res.render("shows", {shows: shows});
	});
});

app.get("/show/:id", function(req, res) {
	Promise.all([
		data.getShow(req.params.id),
		data.getShowSlots(req.params.id)
	]).then(function(values) {
		//add cast information for League Slots
		return Promise.all(values[1].map(function(x) {
			if (x.team_id == 1) {
				return data.getSlotCast(x.slot_id).then(function(y) {x.cast=y; return x});
			} else {
				return promiseWrap(x);
			}
		})).then(function(x) {
			values[1] = x;
			return values;
		});
	}).then(function(values) {
		res.render("show", {show: values[0], slots: values[1]});
	});
});

var server = app.listen(8080, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log("Example app listening at http://%s:%s", host, port);
});
