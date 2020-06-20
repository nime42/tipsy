


var sessions=[];

function addSession(req,res,userId) {
    var sessionID="S"+new Date().getTime() + "" + Math.floor(Math.random() * Math.floor(1000));
    res.cookie('SessId',sessionID, { maxAge: maxAge*1000});
    sessions[sessionID]={
        userId:userId,
        timestamp:new Date()
    };
}

function getSession(req) {
    var sessionID = req.cookies.SessId;
    if(sessions[sessionID]) {
        sessions[sessionID].timestamp=new Date();
    }
    return sessions[sessionID];
}

function invalidateSession(req,res) {
    res.clearCookie('SessId');
    var sessionID = req.cookies.SessId;
    sessions[sessionID]=undefined;
}

function purge() {
    var now=new Date();
    sessions=sessions.filter(s=> (now-s.timestamp)<maxAge*1000);
}

var maxAge=60*60; //age in seconds
var intervalTimer=setInterval(purge,maxAge*1000);
function setPurgeIntervall(seconds) {
    clearInterval(intervalTimer);
    intervalTimer=setInterval(purge,seconds*1000);
}


var saveSql="insert into saved_sessions(key,timestamp,userid) values(?,?,?)";
var saveAttrs=["timestamp","userId"];

function saveSessions(db,callback) {
    db.serialize(() => {
        db.run("begin");
        Object.keys(sessions).forEach(k=>{
            let o=sessions[k];
            let args=[k];
            saveAttrs.forEach(a=>{args.push(o[a])});
            db.run(saveSql,args);
        });
        db.run("commit",function(err) {callback(err)});
    });

}

var getSql="select key,timestamp,userId from saved_sessions";
function resumeSessions(db) {
    db.all(getSql,function(err,rows) {
        rows.forEach(r=>{
            sessions[r.key]={
                timestamp:r.timestamp,
                userId:r.userId
            }
        })
        db.run("delete from saved_sessions");
    });


}

module.exports={
    addSession:addSession,
    getSession:getSession,
    invalidateSession:invalidateSession,
    setPurgeIntervall:setPurgeIntervall,
    saveSessions:saveSessions,
    resumeSessions:resumeSessions
}
