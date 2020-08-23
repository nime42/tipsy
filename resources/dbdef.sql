
CREATE TABLE password_reset_tokens( userid integer PRIMARY KEY, token TEXT, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION);


CREATE TABLE draw_results (drawid integer, rights integer, rows integer, worth number, FOREIGN KEY (drawid) REFERENCES draws (id) ON DELETE CASCADE ON UPDATE NO ACTION);


CREATE TABLE groups (id INTEGER PRIMARY KEY AUTOINCREMENT, groupname TEXT, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP);


CREATE TABLE draw_rows (drawid integer, rownr integer, teams text, bet text, result text, status TEXT, matchstart date, PRIMARY KEY (drawid, rownr), FOREIGN KEY (drawid) REFERENCES draws (id) ON DELETE CASCADE ON UPDATE NO ACTION);
CREATE TABLE invited_members (
groupid integer,
email text,
token TEXT, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (groupid) REFERENCES groups (id) ON DELETE CASCADE ON UPDATE NO ACTION
);


CREATE TABLE draws (id integer PRIMARY KEY AUTOINCREMENT, groupid INTEGER REFERENCES groups (id) ON DELETE CASCADE, drawnumber integer, product text, drawstate text, regclosetime date, created_by INTEGER, created_by_name text, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,nrofrights INTEGER DEFAULT (0), rowprice number,extra_bet BOOLEAN,systemsize integer);

CREATE TABLE "users" ( "id" INTEGER PRIMARY KEY AUTOINCREMENT, "username" TEXT);


CREATE TABLE "userinfo" ( "userid" integer PRIMARY KEY, "password" TEXT, "email" TEXT, "phonenr" TEXT, "name" TEXT,sendremainder boolean, FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION);


CREATE TABLE group_members (userid integer NOT NULL, groupid integer NOT NULL, sortorder INTEGER, admin BOOLEAN DEFAULT false, FOREIGN KEY (userid) REFERENCES users (id) ON DELETE CASCADE ON UPDATE NO ACTION, FOREIGN KEY (groupid) REFERENCES groups (id) ON DELETE CASCADE ON UPDATE NO ACTION);


CREATE UNIQUE INDEX invited_members_idx ON invited_members(groupid,email);


CREATE UNIQUE INDEX group_members_idx ON group_members (userid, groupid);


CREATE UNIQUE INDEX groups_idx ON groups (groupname);


CREATE UNIQUE INDEX username_idx ON users(username COLLATE NOCASE);

CREATE VIEW v_userinfo AS
SELECT u.username,i.* FROM users u
LEFT JOIN userinfo i ON u.id=i.userid;


CREATE VIEW v_group_members AS SELECT g.groupname, m.groupid, m.admin, g.created AS group_created, u.*, m.sortorder FROM groups g LEFT JOIN group_members m ON g.id = m.groupid LEFT JOIN v_userinfo u ON u.userid = m.userid;


create table saved_sessions(
key text,
timestamp timestamp,
userId integer);


CREATE TABLE events (
    id integer PRIMARY KEY AUTOINCREMENT, 
    groupid integer, 
    eventtype text NOT NULL CHECK (eventtype IN ('BET', 'EXTRA BET', 'DEPOSIT', 'PAYMENT')), 
    eventtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    userid integer, 
    username text, 
    profit number, 
    cost number, 
    drawid integer, 
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (groupid) REFERENCES groups (id) ON DELETE CASCADE ON UPDATE NO ACTION, 
    FOREIGN KEY (drawid) REFERENCES draws (id) ON DELETE CASCADE
    );

CREATE VIEW v_draws_in_groups as
select d.*,r.rows from draws d left join (select drawid,group_concat(rownr||';'||teams||';'||bet||';'||coalesce(result,'')||';'||coalesce(status,'')||';'||coalesce(matchstart,''),'|') as rows from draw_rows group by drawid) r on d.id=r.drawid;

create view v_draw_results as
select drawid,group_concat(results,'|') as results from (
select drawid,rights||';'||rows||';'||worth as results from draw_results order by rights desc) group by drawid;

create view v_user_surplus as
select t.userid,t.groupid,totalwin-coalesce(extrabet,0)-coalesce(future_extrabet,0) as surplus,totalwin,coalesce(extrabet,0) as extrabet,coalesce(future_extrabet,0) as future_extrabet from
(select sum(profit) as totalwin,userid ,groupid from events where eventtype in ('BET','EXTRA BET','PAYMENT') group by userid ,groupid) t
left join (select sum(cost) as extrabet,userid ,groupid from events where eventtype='EXTRA BET' group by userid ,groupid) e on t.userid=e.userid and t.groupid=e.groupid
left join (select sum(systemsize*rowprice) as future_extrabet,created_by as userid,groupid from draws where extra_bet=true and drawstate<>'Finalized' group by created_by ,groupid) f on t.userid=f.userid and t.groupid=f.groupid
-