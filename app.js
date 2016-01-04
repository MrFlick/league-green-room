/* global require */
/* eslint-disable no-unused-vars */

var express = require("express"),
	session = require("express-session"),
	passport = require("passport"),
	FacebookStrategy = require("passport-facebook").Strategy,
	GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

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

passport.use(new FacebookStrategy({
	clientID: config.facebook.clientID,
	clientSecret: config.facebook.clientSecret,
	callbackURL: config.facebook.callbackURL
}, function(accessToken, refreshToken, profile, done) {
	console.log(accessToken, refreshToken, profile);
	return done(null, profile);
}));
passport.use(new GoogleStrategy({
	clientID: config.google.clientID,
	clientSecret: config.google.clientSecret,
	callbackURL: config.google.callbackURL
}, function(accessToken, refreshToken, profile, done) {
	console.log(accessToken, refreshToken, profile);
	return done(null, profile);
}));
GoogleStrategy.prototype.userProfile = function(accessToken, done) {
	this._oauth2.get("https://www.googleapis.com/plus/v1/people/me/openIdConnect", accessToken, function(err, body, res) {
		if (err) {
			return done(err);
		}

		try {
			var json = JSON.parse(body),
				i, len;

			var profile = {
				provider: "google"
			};
			profile.id = json.id;
			profile.displayName = json.displayName;
			if (json.name) {
				profile.name = {
					familyName: json.name.familyName,
					givenName: json.name.givenName
				};
			}
			if (json.emails) {
				profile.emails = [];
				for (i = 0, len = json.emails.length; i < len; ++i) {
					profile.emails.push({
						value: json.emails[i].value,
						type: json.emails[i].type
					});
				}
			}
			if (json.image) {
				profile.photos = [{
					value: json.image.url
				}];
			}
			profile.gender = json.gender;

			profile._raw = body;
			profile._json = json;

			done(null, profile);
		} catch (e) {
			done(e);
		}
	});
};

passport.serializeUser(function(user, done) {
	done(null, user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
});
app.use(passport.initialize());
app.use(passport.session());

app.get("/auth/facebook", passport.authenticate("facebook"));
app.get("/auth/facebook/callback", passport.authenticate("facebook", {
	successRedirect: "/show",
	failureRedirect: "/login"
}), function(req, res) {
	res.redirect("/");
});

app.get("/auth/google", passport.authenticate("google", { scope: ["openid","profile","email"] }));
app.get("/auth/google/callback", passport.authenticate("google", {
	successRedirect: "/show",
	failureRedirect: "/login"
}), function(req, res) {
	res.redirect("/");
});

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
				return data.getSlotCast(x.slot_id).then(function(y) {x.cast=y; return x;});
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
