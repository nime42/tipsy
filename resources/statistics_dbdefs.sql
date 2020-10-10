--
-- File generated with SQLiteStudio v3.2.1 on lör okt 10 13:35:31 2020
--
-- Text encoding used: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: draw_rows
CREATE TABLE draw_rows (
    drawId        INTEGER,
    matchId       INTEGER,
    matchNr       INTEGER,
    home_teamName TEXT,
    home_goals    INTEGER,
    home_teamId   INTEGER,
    away_teamName TEXT,
    away_teamId   INTEGER,
    away_goals    INTEGER,
    result        TEXT,
    PRIMARY KEY (
        drawId,
        matchNr
    ),
    FOREIGN KEY (
        drawId
    )
    REFERENCES draws (id) ON DELETE CASCADE
                          ON UPDATE NO ACTION
);


-- Table: draws
CREATE TABLE draws (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    product           TEXT,
    drawnumber        INTEGER,
    drawdate          DATE,
    drawstate         TEXT,
    svf_nrofrights    INTEGER,
    tiotid_nrofrights INTEGER,
    odds_nrofrights   INTEGER,
    UNIQUE (
        product,
        drawnumber
    )
);


-- Table: odds
CREATE TABLE odds (
    drawId  INTEGER,
    matchNr INTEGER,
    type    TEXT,
    outcome TEXT,
    odds    NUMBER,
    PRIMARY KEY (
        drawId,
        matchNr,
        type,
        outcome
    ),
    FOREIGN KEY (
        drawId
    )
    REFERENCES draws (id) ON DELETE CASCADE
                          ON UPDATE NO ACTION
);


-- View: v_draw_rows
CREATE VIEW v_draw_rows AS
    SELECT d.product,
           d.drawnumber,
           d.drawdate,
           d.drawstate,
           d.svf_nrofrights,
           d.tiotid_nrofrights,
           d.odds_nrofrights,
           r.*
      FROM draws d
           LEFT JOIN
           draw_rows r ON d.id = r.drawid;


-- View: v_draw_rows_and_odds
CREATE VIEW v_draw_rows_and_odds AS
    SELECT *
      FROM v_draw_rows r
           LEFT JOIN
           odds o ON r.drawid = o.drawid AND 
                     r.matchnr = o.matchnr
     WHERE drawstate = 'Finalized' AND 
           result IS NOT NULL;


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
