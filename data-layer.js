/* global require module*/
/* eslint-disable no-unused-vars */

var sqlite3 = require("sqlite3").verbose();

var getDefaultDBCallBack = function(resolve,reject) {
	return function(err, rows) {
		if (err !== null) {
			console.log(err);
			reject(err);
		} else {
			resolve(rows);
		}
	};
};

function getAll(db, sql) {
	var args = [].slice.call(arguments, 1);
	return new Promise(function(resolve, reject) {
		args.push(getDefaultDBCallBack(resolve, reject));
		db.all.apply(db, args);
	});
}

function getOne(db, sql) {
	var args = [].slice.call(arguments, 1);
	return new Promise(function(resolve, reject) {
		args.push(getDefaultDBCallBack(resolve, reject));
		db.get.apply(db, args);
	});
}

var DataStore = function(dbpath) {
	var db = new sqlite3.Database(dbpath);

	this.getUser = function(user) {
		if (typeof user == "number") {
			return getOne(db, "SELECT * FROM users WHERE user_id=?", user);
		} else {
			return getOne(db, "SELECT users.* FROM users " +
				"JOIN user_logins ON user_logins.user_id = users.user_id " +
				"WHERE auth_source=? and auth_id=?", user.source, user.id);
		}
	};

	this.getShows = function() {
		return getAll(db, "SELECT * FROM shows");
	};

	this.getShow = function(showid) {
		return getOne(db, "SELECT * FROM shows WHERE show_id=?", showid);
	};

	this.getShowSlots = function(showid) {
		return getAll(db, "SELECT show_slots.*, teams.team_name " +
			"FROM show_slots " +
			"LEFT JOIN teams on teams.team_id = show_slots.team_id " +
			"WHERE show_id=?", showid);
	};

	this.getTeamSlots = function(teamid) {
		return getAll(db, "SELECT show_slots.*, shows.* " +
			"FROM show_slots " +
			"JOIN shows ON shows.show_id = show_slots.team_id " +
			"WHERE team_id=?", teamid);
	};

	this.getSlotCast = function(slotid) {
		return getAll(db, "SELECT show_slot_cast.*, users.full_name " +
			"FROM show_slot_cast " +
			"LEFT JOIN users on users.user_id = show_slot_cast.user_id " +
			"WHERE slot_id=? " +
			"ORDER BY users.full_name", slotid);
	};

	this.getTeamSlotCasts = function(teamid) {
		return getAll(db, "SELECT show_slot_cast.* " +
			"FROM show_slot_cast " +
			"JOIN show_slots ON show_slots.slot_id = show_slot_cast.slot_id " +
			"WHERE show_slots.team_id=? " +
			"ORDER BY show_slots.slot_id", teamid);
	};

	this.getTeamCast = function(teamid) {
		return getAll(db, "SELECT users.* " +
			"FROM users " +
			"ORDER BY users.full_name");
	};

	this.getTeamAvailability = function(teamid) {
		return getAll(db, "SELECT * " +
			"FROM cast_availability " +
			"ORDER BY show_id, user_id");
	};

	this.close = function() {
		db.close();
	};
};

module.exports = {
	getDataStore: function(dbpath) {
		return new DataStore(dbpath);
	}
};
