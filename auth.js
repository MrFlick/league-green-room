/* global require module process */

var passport = require("passport"),
	FacebookStrategy = require("passport-facebook").Strategy,
	GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

 function initAuth (app, config, data) {
	passport.use(new FacebookStrategy({
		clientID: config.facebook.clientID,
		clientSecret: config.facebook.clientSecret,
		callbackURL: config.facebook.callbackURL
	}, function(accessToken, refreshToken, profile, done) {
		console.log(profile);
		process.nextTick(function() {
			data.getUser({source: "facebook", id: profile.id}).then(function(user) {
				console.log(user);
				return done(null, user);
			}, function(err) {console.log(err);});
		});
	}));
	passport.use(new GoogleStrategy({
		clientID: config.google.clientID,
		clientSecret: config.google.clientSecret,
		callbackURL: config.google.callbackURL
	}, function(accessToken, refreshToken, profile, done) {
		console.log(profile);
		process.nextTick(function() {
			data.getUser({source: "google", id: profile.id}).then(function(user) {
				console.log(user);
				return done(null, user);
			}, function(err) {console.log(err);});
		});}));
	GoogleStrategy.prototype.userProfile = function(accessToken, done) {
		//this._oauth2.get("https://www.googleapis.com/plus/v1/people/me/openIdConnect", accessToken, function(err, body, res) {
		this._oauth2.get("https://www.googleapis.com/oauth2/v3/userinfo", accessToken, function(err, body) {
			if (err) {
				return done(err);
			}

			try {
				var json = JSON.parse(body);

				var profile = {
					provider: "google"
				};
				profile.id = json.sub;
				profile.displayName = json.name;
				if (json.name) {
					profile.name = {
						familyName: json.family_name,
						givenName: json.given_name
					};
				}
				if (json.email) {
					profile.emails = [];
					profile.emails.push({
						value: json.email,
						type: json.email_verified
					});
				}
				if (json.picture) {
					profile.photos = [{
						value: json.picture
					}];
				}
				if (json.gender) {
					profile.gender = json.gender;
				}

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

	app.get("/auth/facebook", passport.authenticate("facebook", {scope: ["public_profile","email"]}));
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
}

module.exports = {initAuth: initAuth};
