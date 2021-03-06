/* global require */
/* eslint-disable no-unused-vars */

var express = require("express"),
	session = require("express-session");

var app = express();

function promiseWrap(x) {
	return new Promise(function(resolve) {
		resolve(x);
	});
}

var data = require("./data-layer").getDataStore("./league.db");
var config = require("/Users/matthew/.greenroom.config");

app.set("views", "./views");
app.set("view engine", "jade");
app.use(session({secret: config.sessionSecret,
	resave: false,
	saveUninitialized : false
}));

require("./auth").initAuth(app, config, data);

app.get("/", function(req, res) {
	res.render("login");
});

app.get("/gcaltest", function(req, res) {
	res.render("google-cal-test", {auth:config.google});
});

app.get("/fbtest", function(req, res) {
	res.render("fb-auth-test", {auth:config.facebook});
});

app.get("/show", function(req, res) {
	data.getShows().then(function(shows) {
		res.render("shows", {user:req.user, shows: shows});
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
				return data.getSlotCast(x.slot_id).then(function(y) {x.cast=y; return x;});
			} else {
				return promiseWrap(x);
			}
		})).then(function(x) {
			values[1] = x;
			return values;
		});
	}).then(function(values) {
		console.log(req.user);
		res.render("show", {user:req.user, show: values[0], slots: values[1]});
	});
});

app.get("/castgrid/:teamid", function(req, res) {
	Promise.all([
		data.getTeamCast(req.params.teamid),
		data.getTeamSlots(req.params.teamid),
		data.getTeamSlotCasts(req.params.teamid),
		data.getTeamAvailability(req.params.teamid)
	]).then(function(values) {
		var users = values[0];
		var slots = values[1];
		var casts = values[2];
		var avail = values[3];
		// merge cast info into slot data
		var slotLookup = new Map(slots.map(function(x) {
			x.cast = new Set();
			return [x.slot_id,x];
		}));
		casts.forEach(function(x) {
			slotLookup.get(x.slot_id).cast.add(x.user_id);
		});
		// merge availablity into user data
		var userLookup = new Map(users.map(function(x) {
			x.availability = new Map();
			return [x.user_id,x];
		}));
		avail.forEach(function(x) {
			userLookup.get(x.user_id).availability.set(x.show_id, x);
		});
		return({cast:users, slots:slots});
	}).then(function(x) {
		res.render("castgrid", x);
	});
});

var server = app.listen(8080, function() {
	var host = server.address().address;
	var port = server.address().port;

	console.log("Example app listening at http://%s:%s", host, port);
});
