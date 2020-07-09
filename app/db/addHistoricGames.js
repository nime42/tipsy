var sqlite3 = require('better-sqlite3');

var db = new sqlite3('./resources/tipsy.db');
db.pragma("foreign_keys = ON");

function addHistoricGame(groupId,user,product,date,systemSize,nrOfRights,extraBet,cost,profit) {
    let sql="select * from v_userinfo where username=? or userid=? or name=?";
    let userinfo=db.prepare(sql).get(user,user,user);
    if(userinfo===undefined) {
        console.log("Failed to find user "+user);
        return;
    }

    user=(userinfo.name!=="")?userinfo.name:userinfo.username;

    sql="INSERT INTO draws(groupid,drawnumber,product,drawstate,regclosetime,rowprice,created_by,created_by_name,created,systemsize,extra_bet,nrofrights) values(?,-1,?,'Finalized',?,1,?,?,?,?,?,?)";
    let res=db.prepare(sql).run(groupId,product,date,userinfo.userid,user,date,systemSize,extraBet,nrOfRights);
 
    let drawId=res.lastInsertRowid;

    sql="insert into events(groupid,eventtype,eventtime,userid,username,profit,cost,drawid) values(?,?,?,?,?,?,?,?)";
    db.prepare(sql).run(groupId,extraBet?"EXTRA BET":"BET",date,userinfo.userid,user,profit,cost,drawId);


}

function addPayment(groupId,user,date,profit) {
    let sql="select * from v_userinfo where username=? or userid=? or name=?";
    let userinfo=db.prepare(sql).get(user,user,user);
    if(userinfo===undefined) {
        console.log("Failed to find user "+user);
        return;
    }

    user=(userinfo.name!=="")?userinfo.name:userinfo.username;

    sql="insert into events(groupid,userid,username,eventtype,eventtime,profit,created) values(?,?,?,'PAYMENT',?,?,?)";
    db.prepare(sql).run(groupId,userinfo.userid,user,date,-profit,date);


}

addHistoricGame(4,'Robban',"Stryktipset","2019-11-23",256,7,0,256,0);
addHistoricGame(4,'Jocke',"Stryktipset","2019-11-30",256,10,0,256,42);
addHistoricGame(4,'Jocke',"Topptipset","2019-12-07",42,7,1,42,0);
addHistoricGame(4,'nisse',"Stryktipset","2019-12-07",256,9,0,256,0);
addHistoricGame(4,'Niclas',"Stryktipset","2019-12-14",256,6,0,256,0);
addHistoricGame(4,'Henkejonne',"Stryktipset","2019-12-21",256,9,0,256,0);
addHistoricGame(4,'Jesper',"Stryktipset","2019-12-28",256,7,0,256,0);
addHistoricGame(4,'sejensjo',"Stryktipset","2020-01-04",256,9,0,256,0);
addHistoricGame(4,'Kenneth',"Stryktipset","2020-01-11",256,9,0,256,0);
addHistoricGame(4,'Jenz',"Stryktipset","2020-01-18",256,7,0,256,0);

addHistoricGame(4,'Robban',"Stryktipset","2020-01-25",256,6,0,256,0);
addHistoricGame(4,'Jocke',"Stryktipset","2020-02-01",256,9,0,256,0);
addHistoricGame(4,'nisse',"Stryktipset","2020-02-08",256,8,0,256,0);
addHistoricGame(4,'Niclas',"Stryktipset","2020-02-15",256,3,0,256,0);
addHistoricGame(4,'Henkejonne',"Stryktipset","2020-02-22",256,13,0,256,10103);
addHistoricGame(4,'Henkejonne',"Stryktipset","2020-02-29",256,13,1,256,246);
addHistoricGame(4,'Jesper',"Stryktipset","2020-02-29",256,7,0,256,0);
addHistoricGame(4,'Henkejonne',"Stryktipset","2020-03-07",256,9,1,256,0);
addHistoricGame(4,'sejensjo',"Stryktipset","2020-03-07",256,11,0,256,766);
addHistoricGame(4,'Henkejonne',"Stryktipset","2020-05-16",256,8,1,256,0);
//addHistoricGame(4,'Henkejonne',"Stryktipset","2020-04-12",200,8,1,200,0);
addHistoricGame(4,'sejensjo',"Stryktipset","2020-05-16",256,9,1,256,0);
addHistoricGame(4,'Kenneth',"Stryktipset","2020-05-16",256,7,0,256,0);
addHistoricGame(4,'Jenz',"Stryktipset","2020-05-23",256,7,0,256,0);
addHistoricGame(4,'Robban',"Stryktipset","2020-05-30",256,10,0,256,0);
addHistoricGame(4,'Jocke',"Stryktipset","2020-06-06",256,8,0,256,0);
addHistoricGame(4,'nisse',"Stryktipset","2020-06-13",256,9,0,256,0);
addHistoricGame(4,'Niclas',"Stryktipset","2020-06-20",256,5,0,256,0);
addHistoricGame(4,'Henkejonne',"Stryktipset","2020-06-20",256,5,1,256,0);

addPayment(4,'Henkejonne','2020-02-23',9200);
