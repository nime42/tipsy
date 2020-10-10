--
-- File generated with SQLiteStudio v3.2.1 on lör okt 10 13:34:01 2020
--
-- Text encoding used: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: draw_results
CREATE TABLE draw_results (
    drawid INTEGER,
    rights INTEGER,
    rows   INTEGER,
    worth  NUMBER,
    FOREIGN KEY (
        drawid
    )
    REFERENCES draws (id) ON DELETE CASCADE
                          ON UPDATE NO ACTION
);


-- Table: draw_rows
CREATE TABLE draw_rows (
    drawid     INTEGER,
    rownr      INTEGER,
    teams      TEXT,
    bet        TEXT,
    result     TEXT,
    status     TEXT,
    matchstart DATE,
    matchtime  TEXT,
    lastevent  DATE,
    PRIMARY KEY (
        drawid,
        rownr
    ),
    FOREIGN KEY (
        drawid
    )
    REFERENCES draws (id) ON DELETE CASCADE
                          ON UPDATE NO ACTION
);


-- Table: draws
CREATE TABLE draws (
    id              INTEGER   PRIMARY KEY AUTOINCREMENT,
    groupid         INTEGER   REFERENCES groups (id) ON DELETE CASCADE,
    drawnumber      INTEGER,
    product         TEXT,
    drawstate       TEXT,
    regclosetime    DATE,
    created_by      INTEGER,
    created_by_name TEXT,
    created         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nrofrights      INTEGER   DEFAULT (0),
    rowprice        NUMBER,
    extra_bet       BOOLEAN,
    systemsize      INTEGER
);


-- Table: events
CREATE TABLE events (
    id        INTEGER   PRIMARY KEY AUTOINCREMENT,
    groupid   INTEGER,
    eventtype TEXT      NOT NULL
                        CHECK (eventtype IN ('BET', 'EXTRA BET', 'DEPOSIT', 'PAYMENT') ),
    eventtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    userid    INTEGER,
    username  TEXT,
    profit    NUMBER,
    cost      NUMBER,
    drawid    INTEGER,
    created   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (
        groupid
    )
    REFERENCES groups (id) ON DELETE CASCADE
                           ON UPDATE NO ACTION,
    FOREIGN KEY (
        drawid
    )
    REFERENCES draws (id) ON DELETE CASCADE
);


-- Table: group_members
CREATE TABLE group_members (
    userid    INTEGER NOT NULL,
    groupid   INTEGER NOT NULL,
    sortorder INTEGER,
    admin     BOOLEAN DEFAULT false,
    FOREIGN KEY (
        userid
    )
    REFERENCES users (id) ON DELETE CASCADE
                          ON UPDATE NO ACTION,
    FOREIGN KEY (
        groupid
    )
    REFERENCES groups (id) ON DELETE CASCADE
                           ON UPDATE NO ACTION
);


-- Table: groups
CREATE TABLE groups (
    id        INTEGER   PRIMARY KEY AUTOINCREMENT,
    groupname TEXT,
    created   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Table: invited_members
CREATE TABLE invited_members (
    groupid INTEGER,
    email   TEXT,
    token   TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (
        groupid
    )
    REFERENCES groups (id) ON DELETE CASCADE
                           ON UPDATE NO ACTION
);


-- Table: membership_applications
CREATE TABLE membership_applications (
    groupid  INTEGER,
    userid   INTEGER,
    approved BOOLEAN,
    FOREIGN KEY (
        userid
    )
    REFERENCES users (id) ON DELETE CASCADE
                          ON UPDATE NO ACTION,
    FOREIGN KEY (
        groupid
    )
    REFERENCES groups (id) ON DELETE CASCADE
                           ON UPDATE NO ACTION
);


-- Table: password_reset_tokens
CREATE TABLE password_reset_tokens (
    userid  INTEGER   PRIMARY KEY,
    token   TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (
        userid
    )
    REFERENCES users (id) ON DELETE CASCADE
                          ON UPDATE NO ACTION
);


-- Table: saved_sessions
CREATE TABLE saved_sessions (
    [key]     TEXT,
    timestamp TIMESTAMP,
    userId    INTEGER
);


-- Table: userinfo
CREATE TABLE userinfo (
    userid        INTEGER PRIMARY KEY,
    password      TEXT,
    email         TEXT,
    phonenr       TEXT,
    name          TEXT,
    sendremainder BOOLEAN DEFAULT 0,
    FOREIGN KEY (
        userid
    )
    REFERENCES users (id) ON DELETE CASCADE
                          ON UPDATE NO ACTION
);


-- Table: users
CREATE TABLE users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT
);


-- Index: group_members_idx
CREATE UNIQUE INDEX group_members_idx ON group_members (
    userid,
    groupid
);


-- Index: groups_idx
CREATE UNIQUE INDEX groups_idx ON groups (
    groupname
);


-- Index: invited_members_idx
CREATE UNIQUE INDEX invited_members_idx ON invited_members (
    groupid,
    email
);


-- Index: membership_applications_idx
CREATE UNIQUE INDEX membership_applications_idx ON group_members (
    groupid,
    userid
);


-- Index: username_idx
CREATE UNIQUE INDEX username_idx ON users (
    username COLLATE NOCASE
);


-- View: v_draw_results
CREATE VIEW v_draw_results AS
    SELECT drawid,
           group_concat(results, '|') AS results
      FROM (
               SELECT drawid,
                      rights || ';' || rows || ';' || worth AS results
                 FROM draw_results
                ORDER BY rights DESC
           )
     GROUP BY drawid;


-- View: v_draws_in_groups
CREATE VIEW v_draws_in_groups AS
    SELECT d.*,
           r.rows
      FROM draws d
           LEFT JOIN
           (
               SELECT drawid,
                      group_concat(rownr || ';' || teams || ';' || bet || ';' || coalesce(result, '') || ';' || coalesce(status, '') || ';' || coalesce(matchstart, '') || ';' || coalesce(matchtime, '') || ';' || coalesce(lastevent, ''), '|') AS rows
                 FROM draw_rows
                GROUP BY drawid
           )
           r ON d.id = r.drawid;


-- View: v_group_members
CREATE VIEW v_group_members AS
    SELECT g.groupname,
           m.groupid,
           m.admin,
           g.created AS group_created,
           u.*,
           m.sortorder
      FROM groups g
           LEFT JOIN
           group_members m ON g.id = m.groupid
           LEFT JOIN
           v_userinfo u ON u.userid = m.userid;


-- View: v_user_surplus
CREATE VIEW v_user_surplus AS
    SELECT t.userid,
           t.groupid,
           totalwin - coalesce(extrabet, 0) - coalesce(future_extrabet, 0) AS surplus,
           totalwin,
           coalesce(extrabet, 0) AS extrabet,
           coalesce(future_extrabet, 0) AS future_extrabet
      FROM (
               SELECT sum(profit) AS totalwin,
                      userid,
                      groupid
                 FROM events
                WHERE eventtype IN ('BET', 'EXTRA BET', 'PAYMENT') 
                GROUP BY userid,
                         groupid
           )
           t
           LEFT JOIN
           (
               SELECT sum(cost) AS extrabet,
                      userid,
                      groupid
                 FROM events
                WHERE eventtype = 'EXTRA BET'
                GROUP BY userid,
                         groupid
           )
           e ON t.userid = e.userid AND 
                t.groupid = e.groupid
           LEFT JOIN
           (
               SELECT sum(systemsize * rowprice) AS future_extrabet,
                      created_by AS userid,
                      groupid
                 FROM draws
                WHERE extra_bet = true AND 
                      drawstate <> 'Finalized'
                GROUP BY created_by,
                         groupid
           )
           f ON t.userid = f.userid AND 
                t.groupid = f.groupid;


-- View: v_userinfo
CREATE VIEW v_userinfo AS
    SELECT u.username,
           i.*
      FROM users u
           LEFT JOIN
           userinfo i ON u.id = i.userid;


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
