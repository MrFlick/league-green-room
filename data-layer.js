var sqlite3 = require('sqlite3').verbose();

var DataStore = function(dbpath) {
    var db = new sqlite3.Database(dbpath);

    this.getShows = function(cb) {
        db.all("SELECT * FROM shows", function(err, rows) {
            if (err !== null) {
                console.log(err);
            } else  {
                cb(rows);
            }
        })
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
