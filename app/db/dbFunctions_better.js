var crypto = require('crypto');
var sqlite3 = require('better-sqlite3');

var path = require('path');
const { debugPort } = require('process');
var db = new sqlite3('./resources/tipsy.db');
db.pragma("foreign_keys = ON");

var salt = "nimeproject";


function hashPassword(password) {
    var hash = crypto.createHash('sha256');
    hash.update(password);
    hash.update(salt);
    return hash.digest('hex');
}

function authenticateUser(username, password, callback=console.log) {
    var hashed = hashPassword(password);
    db.prepare("select * from v_userinfo where (lower(username)=lower(?) or lower(email)=lower(?)) and password=?").get(username,username, hashed);
    const row=db.prepare("select * from v_userinfo where (lower(username)=lower(?) or lower(email)=lower(?)) and password=?").get(username,username, hashed);
        if (!row) {
            callback(false);
        } else {
            callback(true, row.userid);
        }
}


function createUser(username, callback=console.log) {
    try {
        const res = db.prepare("insert into users(username) values(?)").run(username);
        callback(true, res.lastInsertRowid, null);
    } catch (err) {
        callback(false, -1, err);
    }

}


function updateUserInfo(userid, userprops, callback=console.log) {
    userprops.userid = userid;
    if (userprops.password) {
        userprops.password = hashPassword(userprops.password);
    } else {
        userprops.password=null;
    }

    let sql = "INSERT INTO userinfo(userid,password,email,phonenr,name) VALUES(@userid,@password,@email,@phonenr,@name)\
        ON CONFLICT(userid) DO UPDATE SET password=coalesce(excluded.password,password),email=excluded.email,phonenr=excluded.phonenr,name=excluded.name";

    try {
        const res = db.prepare(sql).run(userprops);
        callback(true, null);
    } catch (err) {
        callback(false, err);
    }    
}



function getUserInfo(userId, callback=console.log) {
    const row = db.prepare('SELECT * FROM v_userinfo WHERE userid = ?').get(userId);
    if (row !== undefined) {
        delete row.password;
        callback(true, row);
    } else {
        callback(false);
    }
}

function getUserInfoByUserNameOrEmailOrPhone(userName,email,phonenr, callback=console.log) {
    email=(email===""?undefined:email);
    phonenr=(phonenr===""?undefined:phonenr);
    const row=db.prepare('SELECT distinct * FROM v_userinfo WHERE lower(username)=lower(?) or lower(email) = lower(?) or phonenr=?').get(userName, email,phonenr);
    if(row!==undefined) {
        delete row.password;
        callback(true, row);
    } else {
        callback(false);
    }
 
}


function createGroup(userId,groupName,callback=console.log) {
    let groupId=-1;
    try {
        db.transaction(() => {

            let res = db.prepare("insert into groups(groupname) values(?)").run(groupName);
            groupId = res.lastInsertRowid;
            res = db.prepare("insert into group_members(userid,groupid,sortorder,admin) values(?,?,0,true)").run(userId, groupId);
            callback(true,groupId,null);

        })();
    } catch (err) {
        callback(false,-1,err);
    }
}


function getGroupInfo(groupId,groupAdmin,callback=console.log) {
    var sql="select groupid,groupname,username,email,name from v_group_members where groupid=? and userid=? and admin=true";
    const row=db.prepare(sql).get(groupId,groupAdmin);
    if(row!=undefined) {
        callback(true,row);
    } else {
        callback(false);
    }

} 


function updateGroup(userId,groupId,groupName, callback=console.log) {

    try {
        var sql="update groups set groupname=? where id=? and ? in (select userid from group_members where groupid=? and admin=true)";
        const res = db.prepare(sql).run(groupName,groupId,userId,groupId);
        callback(true, null);
    } catch (err) {
        callback(false, err);
    }

}

function deleteGroup(userId,groupId, callback=console.log) {
    try {
        var sql="delete from groups where id=? and ? in (select userid from group_members where groupid=? and admin=true)";
        db.prepare(sql).run(groupId,userId,groupId);
        callback(true, null);
    } catch (err) {
        callback(false, err);
    }

}

function getGroupMembers(userId,groupId,callback=console.log) {
    var sql='select * from v_group_members where groupid=? and ? in (select userid from group_members where groupid=?) order by sortorder';
    const rows=db.prepare(sql).all(groupId,userId,groupId);
    rows.forEach(function(r) {delete r.password});
    callback(true, rows);
}



function inviteUserToGroup(groupAdmin, email, groupId, callback=console.log) {
    //console.log(groupAdmin, email, groupId);
    let token = new Date().getTime() + "" + Math.floor(Math.random() * Math.floor(1000));
    let sql='SELECT * FROM group_members WHERE groupid = ? and userid=? and admin=true';
    const row=db.prepare(sql).get(groupId, groupAdmin);
    if(row!=undefined) {
        sql="insert into invited_members(groupid,email,token) values(?,?,?)";
        try {
            db.prepare(sql).run(groupId,email,token);
            callback(true,token, null);
        } catch(err) {
            callback(false, err);
        }   
    } else {
        callback(false, { errno: -1, errmsg: "User is not groupadmin!" });
    }
}

function deleteInviteToGroup(groupAdmin, email, groupId, callback=console.log) {
    try {
        var sql="delete from invited_members where email=? and groupid=? and ? in (select userid from group_members where groupid=? and admin=true)";
        db.prepare(sql).run(email,groupId,groupAdmin,groupId);
        callback(true, null);
    } catch (err) {
        callback(false, err);
    }
}


function getInvites(groupAdmin, groupId, callback=console.log) {
    try {
    var sql = "select * from invited_members where groupid=? and ? in (select userid from group_members where groupid=? and admin=true)";
    const rows=db.prepare(sql).all(groupId, groupAdmin, groupId);
    callback(true, rows);
    } catch(err) {
        callback(false,err);
    }
}


function addUserToGroup(groupAdmin, userId, groupId,admin, callback=console.log) {
    let sql='SELECT * FROM group_members WHERE groupid = ? and userid=? and admin=true';
    const row=db.prepare(sql).get(groupId, groupAdmin);
    if(row===undefined) {
        callback(false, { errno: -1, errmsg: "User is not groupadmin!" });
    } else {
        sql="insert into group_members(userid,groupid,admin,sortorder) values(?,?,?,(SELECT IFNULL(MAX(sortorder), 0) + 1 FROM group_members))";
        try {
            db.prepare(sql).run(userId, groupId,admin);
            callback(true, null);
        } catch(err) {
            callback(false, err);
        }
    }
}

function addInvitedUserToGroup(userId,token,callback=console.log) {
    let sql="select g.* from invited_members i left join groups g on i.groupid=g.id where i.token=?";
    const row=db.prepare(sql).get(token);
    if(row!==undefined) {
        let groupName=row.groupname;
        let groupId=row.id;
        sql="insert into group_members(userid,groupid,admin,sortorder) values(?,?,false,(SELECT IFNULL(MAX(sortorder), 0) + 1 FROM group_members))";
        let error=undefined;
        try {
            db.prepare(sql).run(userId,groupId);
        } catch(err) {
            error=err;
        }
        if(error===undefined || error.code==='SQLITE_CONSTRAINT_UNIQUE') {
            sql="delete from invited_members where token=?";
            db.prepare(sql).run(token);
            callback(true,groupName);
        } else {
            callback(false,error);
        }


    } else {
        callback(false,"no invite");
    }

}





function deleteUserFromGroup(groupAdmin, userId, groupId, callback=console.log) {

    var sql="delete from group_members where userid=? and groupid=? and (?<>? and admin=false) or ? in (select userid from group_members where groupid=? and admin=true and userid<>?)";
    try {
      db.prepare(sql).run(userId,groupId,userId,groupAdmin,groupAdmin,groupId,groupAdmin);  
      callback(true, null);
    } catch(err) {
        callback(false, err);
    }
}



function getGroups(userId, callback=console.log) {
    var sql="select * from v_group_members where userid=? order by group_created desc";
    try {
        const rows=db.prepare(sql).all(userId);
        if(rows) {
            rows.forEach(e=>{delete e.password});
        }
        callback(true, rows);
    } catch(err) {
        callback(false,err);
    }
}


function createPassWordResetToken(userId, callback=console.log) {
    var token = new Date().getTime() + "" + Math.floor(Math.random() * Math.floor(1000));
    var sql = "INSERT INTO password_reset_tokens(userid,token) VALUES(?,?)\
    ON CONFLICT(userid) DO UPDATE SET token=excluded.token,created=CURRENT_TIMESTAMP";
    try {
        db.prepare(sql).run(userId, token);
        callback(true, token);
    } catch (err) {
        callback(false, err);
    }
}





function resetPassword(token, password, callback=console.log) {
    try {
    db.transaction(()=>{
        var sql = "select userid from password_reset_tokens where token=?";
        var row=db.prepare(sql).get(token);
        if(row!==undefined) {
            var userid = row.userid;
            password = hashPassword(password);
            sql = "update userinfo set password=? where userid=?";
            db.prepare(sql).run(password,userid);
            sql="delete from password_reset_tokens where token=?";
            db.prepare(sql).run(token);
            callback(true,userid);
        } else {
            callback(false);
        }

    })();
    } catch(err) {
        callback(false, err);
    }
}

function addPlay(userId, playdata, callback = console.log) {
    var sql = "select * from v_userinfo where userid=? and ? in (select userid from group_members where groupid=?)";
    const row = db.prepare(sql).get(userId, userId, playdata.groupid);
    if (row === undefined) {
        callback(false, { errno: -1, errmsg: "User is not member in group!" });
    } else {
        try {
            let system = 1;
            playdata.rows.forEach(r => { system *= r.bet.length });
            playdata.systemsize=system;

            db.transaction(() => {
                playdata.created_by = userId;
                playdata.created_by_name = row.name !== "" ? row.name : row.username;
                
                sql = "INSERT INTO draws(groupid,drawnumber,product,drawstate,regclosetime,rowprice,created_by,created_by_name,systemsize,extra_bet) VALUES(@groupid,@drawnumber,@product,@drawstate,@regclosetime,@rowprice,@created_by,@created_by_name,@systemsize,@extra_bet='true')";
                const res = db.prepare(sql).run(playdata);
                let drawId = res.lastInsertRowid;
                sql = "insert into draw_rows(drawid,rownr,teams,bet) values(?,?,?,?)";
                let stmt = db.prepare(sql);
                for (var i = 0; i < playdata.rows.length; i++) {
                    var r = playdata.rows[i];
                    stmt.run(drawId, r.rownr, r.teams, r.bet);
                }
                callback(true, { drawId: drawId })

            })();
        } catch (err) {
            callback(false, err);
        }


    }
}


var resultPageSize=50;
function getResults(userId, groupId,page, callback=console.log) {

    let sql = "select * from group_members where userid=? and groupid=?";
    const row=db.prepare(sql).get(userId, groupId);
    if(row===undefined) {
        callback(false, { errno: -1, errmsg: "User is not member in group!" });
    } else {
        sql = "select d.*,results from v_draws_in_groups d left join v_draw_results r on d.id=r.drawid where groupid=? and d.drawnumber>-1 order by created desc limit ? offset ?";
        let rows=db.prepare(sql).all(groupId,resultPageSize+1,page*resultPageSize);
        let hasMorePages=false;
        if(rows.length>resultPageSize) {
            hasMorePages=true;
            rows=rows.slice(0,resultPageSize);
        }
    


        callback(true, {results:rows,hasMorePages:hasMorePages});
    }
}

function updateDrawResult(drawId,drawState,outcome) {
    //console.log("Hej",drawId,outcome);
    rectify(drawId,function(status,data) {
        //console.log(status,data);
        if(status) {
            let fullpott=data.nrOfRows;
            let res=[];
            for(let i=0;i<outcome.length;i++) {
                res[fullpott-i]={};
                res[fullpott-i].worth=outcome[i].amount;
                res[fullpott-i].rights=fullpott-i;
                res[fullpott-i].rows=0;
            }
            for(let i=0;i<data.nrOfRights.length;i++) {
                let n=data.maxRights;
                if(res[n-i]) {
                    res[n-i].rows=data.nrOfRights[i];
                }
            }
            try {
            db.transaction(()=>{
                let sql="update draws set drawstate=?,nrofrights=? where id=?";
                db.prepare(sql).run(drawState,data.maxRights,drawId);
                sql="delete from draw_results where drawid=?";
                db.prepare(sql).run(drawId);
                sql="insert into draw_results(drawid,rights,rows,worth) values(?,?,?,?)";
                let stmt=db.prepare(sql);
                res.forEach(e=>{
                    stmt.run(drawId,e.rights,e.rows,e.worth);   
                });
                createEvent(drawId,drawState);
            })();
        } catch(err) {
            console.log("updateDrawResult",err);
        }
        }
    });

}

function createEvent(drawId, drawState) {
    if (drawState === "Finalized") {
        let sql = "select * from draws where id=?";
        const drawrow=db.prepare(sql).get(drawId);
        
        sql = "select sum(rows*worth) as worth from draw_results where drawid=?";
        const worth=db.prepare(sql).get(drawId);
        sql="insert into events(groupid,eventtype,eventtime,userid,username,profit,cost,drawid) values(?,?,?,?,?,?,?,?)";
        db.prepare(sql).run(drawrow.groupid,drawrow.extra_bet===1?"EXTRA BET":"BET",drawrow.regclosetime,drawrow.created_by,drawrow.created_by_name,worth.worth,drawrow.systemsize*drawrow.rowprice,drawId)
    }
}

function getStatistics(userId,groupId, callback = console.log) {

    let sql="select * from v_group_members where userId=? and groupid=?";
    let row=db.prepare(sql).get(userId,groupId);
    if(row===undefined) {
        callback(false,"NOT_GROUPMEMBER");
        return;
    }

    sql = "select e.*,d.nrofrights,d.product from events e left join draws d on e.drawid = d.id where e.groupid =? order by eventtime desc";
    let stmt = db.prepare(sql);
    let stats = [];
    for (const e of stmt.iterate(groupId)) {
        if (stats[e.userid] === undefined) {
            stats[e.userid] = {};
            stats[e.userid].username = e.username;
            stats[e.userid].games_ord = 0;
            stats[e.userid].games_extra = 0;
            stats[e.userid].win_ord = 0;
            stats[e.userid].win_extra = 0;
            stats[e.userid].input_ord = 0;
            stats[e.userid].input_extra = 0;
            stats[e.userid].payment = 0;
            stats[e.userid].games_topptips = 0;
            stats[e.userid].nrOfRights_topptips = 0;
            stats[e.userid].games_stryktips = 0;
            stats[e.userid].nrOfRights_stryktips = 0;

        }
        switch (e.eventtype) {
            case "BET":
                stats[e.userid].games_ord++;
                stats[e.userid].input_ord += e.cost;
                stats[e.userid].win_ord += e.profit;
                if (e.product.match(/Topptips/i)) {
                    stats[e.userid].games_topptips++;
                    stats[e.userid].nrOfRights_topptips += e.nrofrights;
                } else {
                    stats[e.userid].games_stryktips++;
                    stats[e.userid].nrOfRights_stryktips += e.nrofrights;
                }
                break;
            case "EXTRA BET":
                stats[e.userid].games_extra++;
                stats[e.userid].input_extra += e.cost;
                stats[e.userid].win_extra += e.profit;
                if (e.product.match(/Topptips/i)) {
                    stats[e.userid].games_topptips++;
                    stats[e.userid].nrOfRights_topptips += e.nrofrights;
                } else {
                    stats[e.userid].games_stryktips++;
                    stats[e.userid].nrOfRights_stryktips += e.nrofrights;
                }
                break;
            case "PAYMENT":
                stats[e.userid].payment += -e.profit;
                break;
        }

    }

    //Get all users that not have made any bets yet.
    sql="select userid,username,name from v_group_members where groupid=? and userid  not in (select userid from events where groupid=?)";
    stmt=db.prepare(sql);
    for (const e of stmt.iterate(groupId,groupId)) {
            stats[e.userid] = {};
            stats[e.userid].username = e.name !== "" ? e.name : e.username;;
            stats[e.userid].games_ord = 0;
            stats[e.userid].games_extra = 0;
            stats[e.userid].win_ord = 0;
            stats[e.userid].win_extra = 0;
            stats[e.userid].input_ord = 0;
            stats[e.userid].input_extra = 0;
            stats[e.userid].payment = 0;
            stats[e.userid].games_topptips = 0;
            stats[e.userid].nrOfRights_topptips = 0;
            stats[e.userid].games_stryktips = 0;
            stats[e.userid].nrOfRights_stryktips = 0;

    }

    

    let userStats=[];
    let totInput=0;
    let totWin=0;
    let totNettoWin=0;
    let totPayments=0;
    for(key in stats) {
        let r={};
        r.name=stats[key].username;
        r.games_ord=stats[key].games_ord;
        r.input_ord=stats[key].input_ord;
        r.games_extra=stats[key].games_extra;
        r.input_extra=stats[key].input_extra;
        totInput+=r.input_ord+r.input_extra;
        r.average_topptips=stats[key].nrOfRights_topptips/stats[key].games_topptips;
        r.average_topptips=Number(r.average_topptips).toFixed(1); 
        r.average_stryktips=stats[key].nrOfRights_stryktips/stats[key].games_stryktips;
        r.average_stryktips=Number(r.average_stryktips).toFixed(1); 

        r.win_brutto=stats[key].win_ord+stats[key].win_extra;
        totWin+=r.win_brutto;
        r.win_netto=r.win_brutto-(stats[key].input_extra+stats[key].payment);
        totNettoWin+=r.win_netto;
        totPayments+=stats[key].payment;
        userStats.push(r);

    }
    sql="select count(*) as cnt from v_group_members where groupid=?";
    let nrOfMembers=db.prepare(sql).get(groupId)["cnt"];



    let res={};
    res.userStats=userStats.sort((a,b)=>{return b.games_ord-a.games_ord});
    res.totInput=totInput;
    res.totWin=totWin;
    res.balance=totWin-totInput;
    res.totPayments=totPayments;
    res.totNettoWin=totNettoWin;
    res.totNettoWinPerMember=Number(totNettoWin/nrOfMembers).toFixed(2);


    callback(true,res);

}


var eventPageSize=50;
function getEvents(userId,groupId,page,callback=console.log) {
    let sql="select * from v_group_members where userId=? and groupid=?";
    let row=db.prepare(sql).get(userId,groupId);
    if(row===undefined) {
        callback(false,"NOT_GROUPMEMBER");
        return;
    }
    sql="select e.id,eventtype,eventtime,userid,username,profit,cost,d.nrofrights from events e left join draws d on e.drawid=d.id where e.groupid=? order by eventtime desc limit ? offset ?";
    rows=db.prepare(sql).all(groupId,eventPageSize+1,page*eventPageSize);
    let hasMorePages=false;
    if(rows.length>eventPageSize) {
        hasMorePages=true;
        rows=rows.slice(0,eventPageSize);
    }
    callback(true,{events:rows,hasMorePages:hasMorePages});
}

function deleteEvent(userId,groupId,eventId,callback=console.log) {
    let sql="delete from events where id=? and (userid=? or exists (select * from v_group_members where groupid=? and userid=? and admin=1))";
    let res=db.prepare(sql).run(eventId,userId,groupId,userId);
    if(res.changes>0) {
        callback(true);
    } else {
        callback(false);

    }
}



function rectify(drawId, callback=console.log) {
    let sql = "select * from draw_rows where drawid=? order by rownr";
    const rows=db.prepare(sql).all(drawId);
    let nrOfWrongSingle = 0;
    let nrOfHalf = 0;
    let nrOfFull = 0;
    let nrOfWrongHalf = 0;
    rows.forEach(r => {
        let tmp = r.result.split("-");
        let home = parseInt(tmp[0].trim());
        let away = parseInt(tmp[1].trim());
        let result;
        if (home > away) {
            result = "1";
        } else if (home === away) {
            result = "X";
        } else {
            result = "2";
        }
        if (r.bet.match(result) === null) {
            switch (r.bet.length) {
                case 1:
                    nrOfWrongSingle++;
                    break;
                case 2:
                    nrOfWrongHalf++;
                    break;
            }
        }
        switch (r.bet.length) {
            case 2:
                nrOfHalf++;
                break;
            case 3:
                nrOfFull++;
        }
    })

    let M = nrOfFull;
    let N = nrOfHalf - nrOfWrongHalf;
    let maxRights = rows.length - (nrOfWrongSingle + nrOfWrongHalf);
    let max=1;
    let maxMinus1 = (2 * M + (N));
    let maxMinus2 = 2 * M * (M - 1) + (N * (N - 1) / 2) + 2 * M * N;
    let maxMinus3 = (4 * M * (M - 1) * (M - 2) / 3) + 2 * M * (M - 1) * N + N * (N - 1) * M + (N * (N - 1) * (N - 2) / 6);
    //(nrOfWrongHalf>0?2*nrOfWrongHalf:1)*
    if (nrOfWrongHalf > 0) {
        max = 2 * nrOfWrongHalf;
        maxMinus1 *= 2 * nrOfWrongHalf;
        maxMinus2 *= 2 * nrOfWrongHalf;
        maxMinus3 *= 2 * nrOfWrongHalf;
    }
    let res = {};
    res.nrOfRows=rows.length;
    res.maxRights = maxRights;
    res.nrOfRights = [max, maxMinus1, maxMinus2, maxMinus3];
    callback(true,res);
}


function deleteDraw(drawId,userId,groupId,callback=console.log) {
    let sql="delete from draws where id=? and ((created_by=? and drawstate<>'Finalized') or exists (select * from v_group_members where groupid=? and userid=? and admin=1))";
    try {
    db.prepare(sql).run(drawId, userId,groupId,userId);
    callback(true,null);
    }catch(err) {
        callback(false,err);
    }
}


function getUserSurplus(userId,groupId,callback=console.log) {
    let totalWin=0;
    let extraBet=0;
    let futureExtraBet=0;

    let sql="select sum(profit) as totalwin from events where eventtype in ('BET','EXTRA BET','PAYMENT') and  userid=? and groupid=?";
    let row=db.prepare(sql).get(userId,groupId);
    if(row!=undefined) {
        totalWin=row.totalwin;
    }

    sql="select sum(cost) as extrabet from events where eventtype='EXTRA BET' and  userid=? and groupid=?";
    row=db.prepare(sql).get(userId,groupId);
    if(row!=undefined) {
        extraBet=row.extrabet;
    }

    sql="select sum(systemsize*rowprice) as future_extrabet,created_by,groupid from draws where extra_bet=true and drawstate<>'Finalized' and created_by=? and groupid=?";
    row=db.prepare(sql).get(userId,groupId);
    if(row!=undefined) {
        futureExtraBet=row.future_extrabet;
    }

    let surplus=totalWin-extraBet-futureExtraBet;
    callback(surplus);


} 

function makePayment(userId,groupId,amount,callback=console.log) {
    getUserSurplus(userId,groupId,function(surplus) {
        if(amount>surplus) {
            callback(false,"OVERDRAW");
        } else {
            let sql="insert into events(groupid,userid,username,eventtype,profit) select ?,id,username,'PAYMENT',? from users where id=?";
            db.prepare(sql).run(groupId,-amount,userId);
            callback(true);
        }
    })
}


function swapSortOrder(adminId,from,to,groupId,callback=console.log) {
    if((isNaN(from)|| from==="") || (isNaN(to) || to==="")) {
        callback(false,"PARAMETER_ERROR");
        return;
    }

    let sql="select * from v_group_members where userId=? and groupid=? and admin=1";
    let row=db.prepare(sql).get(adminId,groupId);
    if(row===undefined) {
        callback(false,"NOT_GROUPADMIN");
        return;
    }

    sql="update group_members set sortorder=case when sortorder=? then ? when sortorder=? then ? else sortorder end where groupid=?";
    db.prepare(sql).run(from,to,to,from,groupId);
    callback(true);
}


function getDbInstance() {
    return db;
}


module.exports = {
    createUser: createUser,
    authenticateUser: authenticateUser,
    updateUserInfo: updateUserInfo,
    getUserInfo:getUserInfo,
    createGroup:createGroup,
    addUserToGroup:addUserToGroup,
    deleteUserFromGroup:deleteUserFromGroup,
    getUserInfoByUserNameOrEmailOrPhone:getUserInfoByUserNameOrEmailOrPhone,
    createPassWordResetToken:createPassWordResetToken,
    resetPassword:resetPassword,
    getGroups:getGroups,
    updateGroup:updateGroup,
    deleteGroup:deleteGroup,
    getGroupMembers:getGroupMembers,
    inviteUserToGroup:inviteUserToGroup,
    deleteInviteToGroup:deleteInviteToGroup,
    getInvites:getInvites,
    addInvitedUserToGroup:addInvitedUserToGroup,
    addPlay:addPlay,
    getResults:getResults,
    updateDrawResult:updateDrawResult,
    deleteDraw:deleteDraw,
    getGroupInfo:getGroupInfo,
    getUserSurplus:getUserSurplus,
    getStatistics:getStatistics,
    getEvents:getEvents,
    makePayment:makePayment,
    deleteEvent:deleteEvent,
    swapSortOrder:swapSortOrder,
    getDbInstance:getDbInstance
}

