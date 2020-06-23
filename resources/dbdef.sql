
CREATE TABLE password_reset_tokens( userid integer PRIMARY KEY, token TEXT, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION);


CREATE TABLE draw_results (drawid integer, rights integer, rows integer, worth number, FOREIGN KEY (drawid) REFERENCES draws (id) ON DELETE CASCADE ON UPDATE NO ACTION);


CREATE TABLE groups (id INTEGER PRIMARY KEY AUTOINCREMENT, groupname TEXT, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP);


CREATE TABLE draw_rows (drawid integer, rownr integer, teams text, bet text, result text, status TEXT, PRIMARY KEY (drawid, rownr), FOREIGN KEY (drawid) REFERENCES draws (id) ON DELETE CASCADE ON UPDATE NO ACTION);

CREATE TABLE invited_members (
groupid integer,
email text,
token TEXT, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (groupid) REFERENCES groups (id) ON DELETE CASCADE ON UPDATE NO ACTION
);


CREATE TABLE draws (id integer PRIMARY KEY AUTOINCREMENT, groupid INTEGER REFERENCES groups (id) ON DELETE CASCADE, drawnumber integer, product text, drawstate text, regclosetime date, created_by INTEGER, created_by_name text, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,nrofrights INTEGER DEFAULT (0));


CREATE TABLE "users" ( "id" INTEGER PRIMARY KEY AUTOINCREMENT, "username" TEXT);


CREATE TABLE "userinfo" ( "userid" integer PRIMARY KEY, "password" TEXT, "email" TEXT, "phonenr" TEXT, "name" TEXT, FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION);


CREATE TABLE group_members (userid integer NOT NULL, groupid integer NOT NULL, sortorder INTEGER, admin BOOLEAN DEFAULT false, FOREIGN KEY (userid) REFERENCES users (id) ON DELETE CASCADE ON UPDATE NO ACTION, FOREIGN KEY (groupid) REFERENCES groups (id) ON DELETE CASCADE ON UPDATE NO ACTION);


CREATE UNIQUE INDEX invited_members_idx ON invited_members(groupid,email);


CREATE UNIQUE INDEX group_members_idx ON group_members (userid, groupid);


CREATE UNIQUE INDEX groups_idx ON groups (groupname);


CREATE UNIQUE INDEX username_idx ON users(username);

CREATE VIEW v_userinfo AS
SELECT u.username,i.* FROM users u
LEFT JOIN userinfo i ON u.id=i.userid;


CREATE VIEW v_group_members AS SELECT g.groupname, m.groupid, m.admin, g.created AS group_created, u.*, m.sortorder FROM groups g LEFT JOIN group_members m ON g.id = m.groupid LEFT JOIN v_userinfo u ON u.userid = m.userid;


create table saved_sessions(
key text,
timestamp timestamp,
userId integer);

create view v_draws_in_groups as
select d.*,r.rows from draws d left join (select drawid,group_concat(rownr||';'||teams||';'||bet||';'||coalesce(result,'')||';'||coalesce(status,''),'|') as rows from draw_rows group by drawid) r on d.id=r.drawid; 


create view v_draw_results as
select drawid,group_concat(results,'|') as results from (
select drawid,rights||';'||rows||';'||worth as results from draw_results order by rights desc) group by drawid;