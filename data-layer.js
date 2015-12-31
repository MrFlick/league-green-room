var sqlite3 = require('sqlite3').verbose();

var DataStore = function(dbpath) {
    var db = new sqlite3.Database(dbpath);

    this.getShows = function() {
        return new Promise(function(resolve, reject) {
            db.all("SELECT * FROM shows", function(err, rows) {
                if (err !== null) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    };

    this.getShow = function(showid) {
        return new Promise(function(resolve, reject) {
            db.get("SELECT * FROM shows WHERE show_id=?", showid, function(err, row) {
                if (err !== null) {
                    console.log(err);
                    reject(err);
                } else  {
                    resolve(row);
                }
            });
        });
    };

    this.getShowSlots = function(showid) {
        return new Promise(function(resolve, reject) {
            db.all("SELECT show_slots.*, teams.team_name " +
            "FROM show_slots " +
            "LEFT JOIN teams on teams.team_id = show_slots.team_id " +
            "WHERE show_id=?", showid, function(err, rows) {
                if (err !== null) {
                    console.log(err);
                    reject(err);
                } else  {
                    resolve(rows);
                }
            });
        });
    };

    this.getSlotCast = function(slotid) {
        return new Promise(function(resolve, reject) {
            db.all("SELECT show_slot_cast.*, users.full_name " +
            "FROM show_slot_cast " +
            "LEFT JOIN users on users.user_id = show_slot_cast.user_id " +
            "WHERE slot_id=? " +
            "ORDER BY users.full_name", slotid, function(err, rows) {
                if (err !== null) {
                    console.log(err);
                    reject(err);
                } else  {
                    resolve(rows);
                }
            });
        });
    };


    this.close = function() {
        db.close();
    }
}

module.exports = {
    getDataStore: function(dbpath) {
        return new DataStore(dbpath);
    }
};
