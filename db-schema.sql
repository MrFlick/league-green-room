CREATE TABLE users (
	user_id INTEGER PRIMARY KEY,
	full_name TEXT NOT NULL,
	display_name TEXT,
	email TEXT,
	fb_user_id TEXT UNIQUE
);

CREATE TABLE teams (
	team_id INTEGER PRIMARY KEY,
	team_name TEXT NOT NULL UNIQUE
);

CREATE TABLE shows (
	show_id INTEGER PRIMARY KEY,
	start_time TEXT
);

CREATE TABLE show_slots (
	slot_id INTEGER PRIMARY KEY,
	show_id INTEGER NOT NULL,
	team_id INTEGER,
	set_order INTEGER NOT NULL,
	cue_time INTEGER
);

CREATE TABLE show_slot_cast (
	slot_id NOT NULL,
	user_id NOT NULL,
	PRIMARY KEY (slot_id, user_id)
);

CREATE TABLE cast_availability (
	show_id INTEGER NOT NULL,
	user_id INTEGER NOT NULL,
	status INTEGER,
	PRIMARY KEY (show_id, user_id)
);
