var sqlite3 = require('better-sqlite3');
fs = require('fs');

var db = new sqlite3('./resources/tipsy.db');
db.pragma("foreign_keys = ON");

const demogroup = fs.readFileSync('misc/create_demo.sql', 'utf8');
db.exec(demogroup);