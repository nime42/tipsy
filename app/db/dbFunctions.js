var crypto = require('crypto');
var sqlite3 = require('sqlite3');

var path = require('path');
var db = new sqlite3.Database('./resources/tipsy.db');
db.run("PRAGMA foreign_keys = ON");

var salt = "nimeproject";


function hashPassword(password) {
    var hash = crypto.createHash('sha256');
    hash.update(password);
    hash.update(salt);
    return hash.digest('hex');
}

function authenticateUser(username, password, callback) {
    var hashed = hashPassword(password);
    db.get('SELECT userid FROM v_userinfo WHERE username = ? AND password = ?', username, hashed, function (err, row) {
        if (!row) {
            callback(false);
        } else {
            callback(true, row.userid);
        }
    });
}




function createUser(username, callback) {
    db.run("insert into users(username) values(?)", username, function (err) {
        if (err == null) {
            callback(true, this.lastID, null);
        } else {
            callback(false, -1, err);
        }

    })
}



function updateUserInfo(userid, userprops, callback) {
    var dbprops={};
 
    ["password","email","phonenr","name"].forEach(function(key) {
        dbprops["$"+key]=userprops[key];
    })

    dbprops["$userid"]=userid;
    if(dbprops.$password) {
        dbprops["$password"]=hashPassword(dbprops.$password)
    }
    var sql = "INSERT INTO userinfo(userid,password,email,phonenr,name) VALUES($userid,$password,$email,$phonenr,$name)\
        ON CONFLICT(userid) DO UPDATE SET password=coalesce(excluded.password,password),email=excluded.email,phonenr=excluded.phonenr,name=excluded.name";

    db.run(sql, dbprops, function (err) {
        if (callback) {
            if (err == null) {
                callback(true, null);
            } else {
                callback(false, err);
            }
        } else if (err != null) {
            console.log(err);
        }
    })
}



function getUserInfo(userId, callback) {
    db.get('SELECT * FROM v_userinfo WHERE userid = ?', userId, function (err, row) {
        if (!row) {
            callback(false,err);
        } else {
            delete row.password;
            callback(true, row);
        }
    });
}


function getUserInfoByUserNameOrEmailOrPhone(userName,email,phonenr, callback) {
    email=(email===""?undefined:email);
    phonenr=(phonenr===""?undefined:phonenr);
    db.all('SELECT distinct * FROM v_userinfo WHERE username=? or email = ? or phonenr=?',userName, email,phonenr, function (err, rows) {
        if (callback) {
            if (err == null) {
                callback(true, rows);
            } else {
                callback(false, err);
            }
        } else if (err != null) {
            console.log(err);
        }
    });
}


function createGroup(userId,groupName,callback) {
    db.run("Begin");
    db.run("insert into groups(groupname) values(?)", groupName, function (err) {
        if (err == null) {
            var groupId=this.lastID;
            db.run("insert into group_members(userid,groupid,sortorder,admin) values(?,?,0,true)", userId, groupId, function (err) {
                if(err==null) {
                    db.run("commit");
                    callback(true,groupId,null);

                } else {
                    db.run("rollback");
                    callback(false,-1,err);
                }
            })
        } else {
            db.run("rollback");
            callback(false, -1, err);
        }

    })  
}

function getGroupInfo(groupId,groupAdmin,callback) {
    var sql="select groupid,groupname,username,email,name from v_group_members where groupid=? and userid=? and admin=true";
    db.all(sql,groupId,groupAdmin,function (err, row) {
        if (!row) {
            callback(false,err);
        } else {
            callback(true, row[0]);
        }
    });
} 

function updateGroup(userId,groupId,groupName, callback) {
    var sql="update groups set groupname=? where id=? and ? in (select userid from group_members where groupid=? and admin=true)";
    db.run(sql,groupName,groupId,userId,groupId,function(err) {
        if (callback) {
            if (err == null) {
                callback(true, null);
            } else {
                callback(false, err);
            }
        } else if (err != null) {
            console.log(err);
        }
    });
}

function deleteGroup(userId,groupId, callback) {
    var sql="delete from groups where id=? and ? in (select userid from group_members where groupid=? and admin=true)";
    db.run(sql,groupId,userId,groupId,function(err) {
        if (callback) {
            if (err == null) {
                callback(true, null);
            } else {
                callback(false, err);
            }
        } else if (err != null) {
            console.log(err);
        }
    });
}

function getGroupMembers(userId,groupId,callback) {
    var sql='select * from v_group_members where groupid=? and ? in (select userid from group_members where groupid=?) order by sortorder';
    db.all(sql,groupId,userId,groupId,function(err,rows) {
        if (err!=null) {
            callback(false,err);
        } else {
            rows.forEach(function(r) {delete r.password});
            callback(true, rows);
        }
    });
}


function inviteUserToGroup(groupAdmin, email, groupId, callback) {
    //console.log(groupAdmin, email, groupId);
    var token = new Date().getTime() + "" + Math.floor(Math.random() * Math.floor(1000));

    db.get('SELECT * FROM group_members WHERE groupid = ? and userid=? and admin=true', groupId, groupAdmin, function (err, row) {
        if (!row) {
            callback(false, { errno: -1, errmsg: "User is not groupadmin!" });
        } else {
            db.run("insert into invited_members(groupid,email,token) values(?,?,?)", groupId,email,token, function (err) {
                if (err == null) {
                    callback(true,token, null);
                } else {
                    callback(false, err);
                }

            })
        }
    });
}

function deleteInviteToGroup(groupAdmin, email, groupId, callback) {
    var sql="delete from invited_members where email=? and groupid=? and ? in (select userid from group_members where groupid=? and admin=true)";
    db.run(sql,email,groupId,groupAdmin,groupId,function(err) {
        if (callback) {
            if (err == null) {
                callback(true, null);
            } else {
                callback(false, err);
            }
        } else if (err != null) {
            console.log(err);
        }
    });
}


function getInvites(groupAdmin, groupId, callback) {
    var sql = "select * from invited_members where groupid=? and ? in (select userid from group_members where groupid=? and admin=true)";
    db.all(sql, groupId, groupAdmin, groupId, function (err, rows) {
        if (err != null) {
            callback(false, err);
        } else {
            callback(true, rows);
        }
    });

} 


function addUserToGroup(groupAdmin, userId, groupId,admin, callback) {

    db.get('SELECT * FROM group_members WHERE groupid = ? and userid=? and admin=true', groupId, groupAdmin, function (err, row) {
        if (!row) {
            callback(false, { errno: -1, errmsg: "User is not groupadmin!" });
        } else {
            db.run("insert into group_members(userid,groupid,admin,sortorder) values(?,?,?,(SELECT IFNULL(MAX(sortorder), 0) + 1 FROM group_members))", userId, groupId,admin, function (err) {
                if (err == null) {
                    callback(true, null);
                } else {
                    callback(false, err);
                }

            })
        }
    });
}

function addInvitedUserToGroup(userId,token,callback) {
    let sql="select g.* from invited_members i left join groups g on i.groupid=g.id where i.token=?";
    db.get(sql,token,function(err,row) {
        if (err == null && row) {
            let groupName=row.groupname;
            let groupId=row.id;
            sql="insert into group_members(userid,groupid,admin,sortorder) values(?,?,false,(SELECT IFNULL(MAX(sortorder), 0) + 1 FROM group_members))";
            db.run(sql,userId,groupId,function(err) {
                if(err===null || err.errno===19) {
                    sql="delete from invited_members where token=?";
                    db.run(sql,token);
                }
            });
            callback(true,groupName);
        } else {
            callback(false,err);
        }
     });


}





function deleteUserFromGroup(groupAdmin, userId, groupId, callback) {

    var sql="delete from group_members where userid=? and groupid=? and (?<>? and admin=false) or ? in (select userid from group_members where groupid=? and admin=true and userid<>?)";
    db.run(sql,userId,groupId,userId,groupAdmin,groupAdmin,groupId,groupAdmin,function(err) {
        console.log(err);
        if (callback) {
            if (err == null) {
                callback(true, null);
            } else {
                callback(false, err);
            }
        } else if (err != null) {
            console.log(err);
        }
    });
}



function getGroups(userId, callback) {
    var sql="select * from v_group_members where userid=? order by group_created desc";
    db.all(sql,userId, function (err, rows) {
        if (err!=null) {
            callback(false,err);
        } else {
            callback(true, rows);
        }
    });
}


function createPassWordResetToken(userId, callback) {
    var token = new Date().getTime() + "" + Math.floor(Math.random() * Math.floor(1000));
    var sql = "INSERT INTO password_reset_tokens(userid,token) VALUES(?,?)\
    ON CONFLICT(userid) DO UPDATE SET token=excluded.token,created=CURRENT_TIMESTAMP";
    db.run(sql, userId, token, function (err) {
        if (callback) {
            if (err == null) {
                callback(true, token);
            } else {
                callback(false, err);
            }
        } else if (err != null) {
            console.log(err);
        }
    })
}





function resetPassword(token, password, callback) {
    var sql = "select userid from password_reset_tokens where token=?";

    if(!callback) callback=function(err) {console.log(err)};
    db.get(sql, token, function (err, row) {
        if (!row) {
            callback(false, err);
        } else {
            var userid = row.userid;
            password = hashPassword(password);
            sql = "update userinfo set password=? where userid=?";
            db.run("Begin");
            db.run(sql, password, userid, function (err) {
                if(!err) {
                    sql="delete from password_reset_tokens where token=?";
                    db.run(sql,token,function (err) {
                        if (err) {
                            callback(false, err);
                            db.run("Rollback");
                        } else {
                            callback(true);
                            db.run("Commit");
                        }
    
                    })
                } else {
                    db.run("Rollback");
                }
            })
        }
    });
}

function addPlay(userId, playdata, callback) {
    var sql = "select * from v_userinfo where userid=? and ? in (select userid from group_members where groupid=?)";
    db.get(sql, userId, userId, playdata.groupid, function (err, row) {
        if (!row) {
            callback(false, { errno: -1, errmsg: "User is not member in group!" });
        } else {
            var dbprops = {};
            ["groupid","drawnumber", "product", "drawstate", "regclosetime"].forEach(function (key) {
                dbprops["$" + key] = playdata[key];
            });
            dbprops["$created_by"] = userId;
            dbprops["$created_by_name"] = row.name !== "" ? row.name : row.username;
            db.run("Begin");
            sql = "INSERT INTO draws(groupid,drawnumber,product,drawstate,regclosetime,created_by,created_by_name) VALUES($groupid,$drawnumber,$product,$drawstate,$regclosetime,$created_by,$created_by_name)";
            db.run(sql, dbprops, function (err) {
                if (err == null) {
                    var drawId = this.lastID;
                    sql="insert into draw_rows(drawid,rownr,teams,bet) values(?,?,?,?)";
                    var callbackSent=false;
                    for(var i=0;i<playdata.rows.length;i++) {
                        var r=playdata.rows[i];
                        db.run(sql,drawId,r.rownr,r.teams,r.bet,function(err) {
                            if(err!=null) {
                                console.log("error:"+sql,r,err);

                                if(!callbackSent) {
                                    db.run("rollback");
                                    callback(false, err);
                                    callbackSent=true;
                                    
                                }
                            } 
                        });
                    }
                    db.run("commit",function(err) {
                        if(err==null && !callbackSent) {
                            callback(true,{drawId:drawId});
                        }
                    })
                    
                } else {
                    callback(false, err);
                }
            });
        }


    })
}


function getResults(userId, groupId, callback) {

    let sql = "select *from group_members where userid=? and groupid=?";
    db.get(sql, userId, groupId, function (err, row) {
        if (!row) {
            callback(false, { errno: -1, errmsg: "User is not member in group!" });
            return;
        }
        sql = "select d.*,results from v_draws_in_groups d left join v_draw_results r on d.id=r.drawid where groupid=? order by created desc";

        db.all(sql, groupId, function (err, rows) {
            if (err != null) {
                callback(false, err);
            } else {
                callback(true, rows);
            }
        })
    });

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
            db.serialize(() => {
                db.run("begin");
                let sql="update draws set drawstate=?,nrofrights=? where id=?";
                db.run(sql,drawState,data.maxRights,drawId);
                sql="delete from draw_results where drawid=?";
                db.run(sql,drawId);
                sql="insert into draw_results(drawid,rights,rows,worth) values(?,?,?,?)";
                res.forEach(e=>{
                    db.run(sql,drawId,e.rights,e.rows,e.worth);   
                });
                db.run("commit");

            });

        }
    });

}

function rectify(drawId, callback) {
    let sql = "select * from draw_rows where drawid=? order by rownr";
    db.all(sql, drawId, function (err, rows) {
        if (err === null) {
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
        } else {
            callback(false,err);
        }
    })
}

function deleteDraw(drawId,userId,callback) {
    let sql="delete from draws where id=? and drawstate<>'Finalized' and created_by=?";
    db.run(sql, drawId, userId, function (err) {
        if (err === null) {
                callback(true,null);
        } else {
            callback(false,err);
        } 
    });

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
    getDbInstance:getDbInstance
}

