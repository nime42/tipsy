CREATE TABLE "users" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "username" TEXT
);
CREATE UNIQUE INDEX username_idx ON users(username);

CREATE TABLE "userinfo" (
    "userid" integer PRIMARY KEY,
    "password" TEXT,-- sha256 hash of the plain-text password
    "email" TEXT,
    "phonenr" TEXT,
    "name" TEXT,
    FOREIGN KEY (userid) 
      REFERENCES users(id) 
         ON DELETE CASCADE 
         ON UPDATE NO ACTION
);

create view v_userinfo as
select u.username,i.* from users u
left join userinfo i on u.id=i.userid;

create table groups(
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "groupname" TEXT,
    "groupadmin" integer,
    "created" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (groupadmin) 
    REFERENCES users(id) 
        ON DELETE CASCADE 
         ON UPDATE NO ACTION

);
CREATE UNIQUE INDEX groups_idx ON groups(groupname);


create table group_members(
    userid integer,
    groupid integer,
    order integer,
    FOREIGN KEY (userid) 
    REFERENCES users(id) 
        ON DELETE CASCADE 
         ON UPDATE NO ACTION,
    FOREIGN KEY (groupid) 
    REFERENCES groups(id) 
        ON DELETE CASCADE 
         ON UPDATE NO ACTION
);
CREATE UNIQUE INDEX group_members_idx ON group_members(userid,groupid);

create view v_group_members as
SELECT g.groupname,m.groupid,g.groupadmin, u.*,m."order" FROM groups g 
LEFT JOIN group_members m ON g.id = m.groupid 
LEFT JOIN v_userinfo u ON u.userid = m.userid;


create table password_reset_tokens(
    userid integer PRIMARY KEY,
    token TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userid) 
    REFERENCES users(id) 
        ON DELETE CASCADE 
         ON UPDATE NO ACTION
);