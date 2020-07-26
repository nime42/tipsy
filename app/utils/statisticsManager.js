var geoip = require('geoip-lite');
var lineReader = require('line-reader');
var db=require('../db/dbFunctions_better.js');

var stats = {};

var ipInfo = {};

function gatherStatistics(file, callback = console.log) {
    stats = {};
    ipInfo = {};

    var general={}
    general.nrOfGroups=db.getDbInstance().prepare("select count(*) as nrofgroups from groups").get().nrofgroups;
    general.nrOfUsers=db.getDbInstance().prepare("select count(*) as nrofusers from users").get().nrofusers;

    lineReader.eachLine(file, function (line, last) {
        //console.log(line);
        parseLine(line);
        // do whatever you want with line...
        if (last) {
            callback({stats:stats,general:general});
        }
    });



}

function lookupIP(ip) {
    if (ipInfo[ip]) {
        return ipInfo[ip];
    } else {
        ipInfo[ip] = geoip.lookup(ip);
        return ipInfo[ip];
    }
}


function parseDate(date) {
    let [day, month, year] = date.match(/(.*)\/(.*)\/([^:]*):/).splice(1);
    return new Date(month + " " + day + ", " + year).toLocaleString("se");
}

function parseLine(line) {
    let ip = line.match(/^([^ ]*) /)[1];
    let date = line.match(/\[(.*)\]/)[1];
    let dateString = parseDate(date);
    if (stats[dateString] === undefined) {
        stats[dateString] = { uniqueIP: {}, uniqueLogin: {}, totalLogins: 0 };
    }
    if (stats[dateString].uniqueIP[ip] === undefined) {
        stats[dateString].uniqueIP[ip] = lookupIP(ip);
    }
    if (line.match(/"POST \/login HTTP\/1.1" 200/) != null) {
        if (stats[dateString].uniqueLogin[ip] === undefined) {
            stats[dateString].uniqueLogin[ip] = lookupIP(ip);
        }
        stats[dateString].totalLogins++;
    }
}

module.exports={
    gatherStatistics:gatherStatistics
}