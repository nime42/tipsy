--
-- File generated with SQLiteStudio v3.0.2 on tis jun 16 22:41:05 2020
--
-- Text encoding used: windows-1252
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: password_reset_tokens
CREATE TABLE password_reset_tokens( userid integer PRIMARY KEY, token TEXT, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION
)

-- Table: draw_results
CREATE TABLE draw_results (drawid integer, rights integer, rows integer, worth number, FOREIGN KEY (drawid) REFERENCES draws (id) ON DELETE CASCADE ON UPDATE NO ACTION)

-- Table: groups
CREATE TABLE groups (id INTEGER PRIMARY KEY AUTOINCREMENT, groupname TEXT, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

-- Table: draw_rows
CREATE TABLE draw_rows (drawid integer, rownr integer, teams text, bet text, result text, status TEXT, PRIMARY KEY (drawid, rownr), FOREIGN KEY (drawid) REFERENCES draws (id) ON DELETE CASCADE ON UPDATE NO ACTION)

-- Table: invited_members
CREATE TABLE invited_members (
groupid integer,
email text,
token TEXT, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (groupid) REFERENCES groups (id) ON DELETE CASCADE ON UPDATE NO ACTION
)

-- Table: draws
CREATE TABLE draws (id integer PRIMARY KEY AUTOINCREMENT, groupid INTEGER REFERENCES groups (id) ON DELETE CASCADE, drawnumber integer, product text, drawstate text, regclosetime date, created_by INTEGER, created_by_name text, created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)

-- Table: users
CREATE TABLE "users" ( "id" INTEGER PRIMARY KEY AUTOINCREMENT, "username" TEXT
)

-- Table: userinfo
CREATE TABLE "userinfo" ( "userid" integer PRIMARY KEY, "password" TEXT,-- sha256 hash of the plain-text password "email" TEXT, "phonenr" TEXT, "name" TEXT, FOREIGN KEY (userid) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION
)

-- Table: group_members
CREATE TABLE group_members (userid integer NOT NULL, groupid integer NOT NULL, sortorder INTEGER, admin BOOLEAN DEFAULT false, FOREIGN KEY (userid) REFERENCES users (id) ON DELETE CASCADE ON UPDATE NO ACTION, FOREIGN KEY (groupid) REFERENCES groups (id) ON DELETE CASCADE ON UPDATE NO ACTION)

-- Index: invited_members_idx
CREATE UNIQUE INDEX invited_members_idx ON invited_members(groupid,email)

-- Index: group_members_idx
CREATE UNIQUE INDEX group_members_idx ON group_members (userid, groupid)

-- Index: groups_idx
CREATE UNIQUE INDEX groups_idx ON groups (groupname)

-- Index: username_idx
CREATE UNIQUE INDEX username_idx ON users(username)

-- View: v_userinfo
CREATE VIEW v_userinfo AS
SELECT u.username,i.* FROM users u
LEFT JOIN userinfo i ON u.id=i.userid

-- View: v_group_members
CREATE VIEW v_group_members AS SELECT g.groupname, m.groupid, m.admin, g.created AS group_created, u.*, m.sortorder FROM groups g LEFT JOIN group_members m ON g.id = m.groupid LEFT JOIN v_userinfo u ON u.userid = m.userid

COMMIT TRANSACTION;
