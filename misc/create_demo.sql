/*
creates a demogroup
*/
pragma foreign_keys = ON;
delete from draws where id<0;
delete from events where id<0;

delete from users where id<0;

delete from groups where id<0;


INSERT INTO users (id,username) VALUES (
-10,'Lars-Gunnar');
INSERT INTO users (id,username) VALUES (
-11,'Arne');
INSERT INTO users (id,username) VALUES (
-12,'Glenn');
INSERT INTO users (id,username) VALUES (
-13,'Tipsy');

INSERT INTO userinfo (userid,password,email,phonenr,name,sendremainder) VALUES (
-10,'5d4090368b3a0bc171925166a45513cf9710014a6c03eae4480a8dd0e10548a3','lars@mail.com','070-222222','Lars-Gunnar B',0);

INSERT INTO userinfo (userid,password,email,phonenr,name,sendremainder) VALUES (
-11,'5d4090368b3a0bc171925166a45513cf9710014a6c03eae4480a8dd0e10548a3','arne@mail.com','070-333333','Arne H',0);

INSERT INTO userinfo (userid,password,email,phonenr,name,sendremainder) VALUES (
-12,'5d4090368b3a0bc171925166a45513cf9710014a6c03eae4480a8dd0e10548a3','glenn@mail.com','070-111111','Glenn S',0);



INSERT INTO userinfo (userid,password,email,phonenr,name,sendremainder) VALUES (
-13,'5d4090368b3a0bc171925166a45513cf9710014a6c03eae4480a8dd0e10548a3','tipsy@mail.com','070-444444','Tipsy Tipsson',0);


INSERT INTO groups (id,groupname,created) VALUES (
-10,'Tipsy Demo','2020-08-22 16:09:30');


INSERT INTO group_members (userid,groupid,sortorder,admin) VALUES (
-10,-10,0,1);

INSERT INTO group_members (userid,groupid,sortorder,admin) VALUES (
-11,-10,1,0);

INSERT INTO group_members (userid,groupid,sortorder,admin) VALUES (
-12,-10,2,0);

INSERT INTO group_members (userid,groupid,sortorder,admin) VALUES (
-13,-10,3,0);





INSERT INTO draws (id,groupid,drawnumber,product,drawstate,regclosetime,created_by,created_by_name,created,nrofrights,rowprice,extra_bet,systemsize) VALUES (
-10,-10,4643,'Stryktipset','Open','2020-06-27 15:59:00',-10,'Lars-Gunnar B','2020-06-28 12:34:17',null,1,0,256);

INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-10,1,'Norwich - Manch.U','2','1 - 1','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-10,2,'Birmingh. - Hull','1X','3 - 3','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-10,3,'Leeds - Fulham','1','3 - 0','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-10,4,'Stoke - Middlesbr','12','0 - 2','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-10,5,'Wigan - Blackburn','12','2 - 0','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-10,6,'Sheff.U - Arsenal','X2','1 - 2','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-10,7,'Leicester - Chelsea','12','0 - 1','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-10,8,'Newcastle - Manch.C','2','0 - 2','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-10,9,'Watford - Southampt','X2','1 - 3','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-10,10,'Bristol C - Sheff.W','1X','1 - 2','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-10,11,'Nottingh. - Huddersf.','1X','3 - 1','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-10,12,'AIK - Malmö FF','2','2 - 2','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-10,13,'Djurgård. - Kalmar FF','1','5 - 0','Avslutad',NULL);


INSERT INTO draws (id,groupid,drawnumber,product,drawstate,regclosetime,created_by,created_by_name,created,nrofrights,rowprice,extra_bet,systemsize) VALUES (
-11,-10,4644,'Stryktipset','Open','2020-07-04 15:59:00',-11,'Arne H','2020-07-03 13:16:30',11,1,0,256);


INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-11,1,'Leicester - Crystal P','1X','3 - 0','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-11,2,'Manch.U - Bournem.','1','5 - 2','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-11,3,'Wolverh. - Arsenal','12','0 - 2','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-11,4,'Chelsea - Watford','1X','3 - 0','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-11,5,'Blackburn - Leeds','X2','1 - 3','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-11,6,'Bristol C - Cardiff','1','0 - 1','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-11,7,'Fulham - Birmingh.','1','1 - 0','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-11,8,'Huddersf. - Preston','12','0 - 0','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-11,9,'Brentford - Wigan','1','3 - 0','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-11,10,'Luton - Reading','12','0 - 5','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-11,11,'Stoke - Barnsley','1','4 - 0','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-11,12,'Burnley - Sheff.U','12','1 - 1','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-11,13,'Newcastle - West Ham','12','2 - 2','Avslutad',NULL);

INSERT INTO draws (id,groupid,drawnumber,product,drawstate,regclosetime,created_by,created_by_name,created,nrofrights,rowprice,extra_bet,systemsize) VALUES (
-12,-10,4645,'Stryktipset','Open','2020-07-11 15:59:00',-12,'Glenn S','2020-07-11 08:44:42',5,1,0,256);


INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-12,1,'Liverpool - Burnley','1','1 - 1','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-12,2,'Brighton - Manch.C','X2','0 - 5','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-12,3,'Sheff.U - Chelsea','X2','3 - 0','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-12,4,'Blackburn - West Brom','2','1 - 1','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-12,5,'Hull - Millwall','X2','0 - 1','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-12,6,'Middlesbr - Bristol C','1X','1 - 3','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-12,7,'Preston - Nottingh.','X2','1 - 1','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-12,8,'Queens PR - Sheff.W','1X','0 - 3','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-12,9,'Wolverh. - Everton','X2','3 - 0','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-12,10,'Aston V. - Crystal P','2','2 - 0','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-12,11,'Tottenham - Arsenal','12','2 - 1','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-12,12,'Bournem. - Leicester','2','4 - 1','Avslutad',NULL);
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-12,13,'Swansea - Leeds','2','0 - 1','Avslutad',NULL);


INSERT INTO draws (id,groupid,drawnumber,product,drawstate,regclosetime,created_by,created_by_name,created,nrofrights,rowprice,extra_bet,systemsize) VALUES (
-13,-10,4646,'Stryktipset','Open','2020-07-18 15:59:00',-13,'Tipsy Tipsson','2020-07-18 07:46:07',8,1,0,256);

INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-13,1,'Arsenal - Manch.C','X2','2 - 0','Avslutad','2020-07-18T20:45:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-13,2,'Norwich - Burnley','12','0 - 2','Avslutad','2020-07-18T18:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-13,3,'Fulham - Sheff.W','1','5 - 3','Avslutad','2020-07-18T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-13,4,'Hull - Luton','1','0 - 1','Avslutad','2020-07-18T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-13,5,'Middlesbr - Cardiff','X2','1 - 3','Avslutad','2020-07-18T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-13,6,'Preston - Birmingh.','1X','2 - 0','Avslutad','2020-07-18T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-13,7,'Swansea - Bristol C','1X','1 - 0','Avslutad','2020-07-18T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-13,8,'Queens PR - Millwall','X','4 - 3','Avslutad','2020-07-18T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-13,9,'Blackburn - Reading','1','4 - 3','Avslutad','2020-07-18T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-13,10,'Manch.U - Chelsea','1X','1 - 3','Avslutad','2020-07-19T19:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-13,11,'Bournem. - Southampt','1','0 - 2','Avslutad','2020-07-19T15:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-13,12,'Tottenham - Leicester','12','3 - 0','Avslutad','2020-07-19T17:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-13,13,'Derby - Leeds','X2','1 - 3','Avslutad','2020-07-19T15:00:00+02:00');

INSERT INTO draws (id,groupid,drawnumber,product,drawstate,regclosetime,created_by,created_by_name,created,nrofrights,rowprice,extra_bet,systemsize) VALUES (
-14,-10,4647,'Stryktipset','Open','2020-07-25 15:59:00',-10,'Lars-Gunnar B','2020-07-24 19:44:34',9,1,0,256);

INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-14,1,'Halmstad - Akropolis','1','2 - 3','Avslutad','2020-07-25T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-14,2,'Jönköping - Brage','1X','2 - 0','Avslutad','2020-07-25T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-14,3,'Trelleb. - Dalkurd','1X','4 - 1','Avslutad','2020-07-25T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-14,4,'Leicester - Manch.U','12','0 - 2','Avslutad','2020-07-26T17:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-14,5,'Chelsea - Wolverh.','1X','2 - 0','Avslutad','2020-07-26T17:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-14,6,'Arsenal - Watford','1X','3 - 2','Avslutad','2020-07-26T17:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-14,7,'Crystal P - Tottenham','12','1 - 1','Avslutad','2020-07-26T17:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-14,8,'Everton - Bournem.','1','1 - 3','Avslutad','2020-07-26T17:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-14,9,'West Ham - Aston V.','X2','1 - 1','Avslutad','2020-07-26T17:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-14,10,'Manch.C - Norwich','1','5 - 0','Avslutad','2020-07-26T17:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-14,11,'Newcastle - Liverpool','X2','1 - 3','Avslutad','2020-07-26T17:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-14,12,'Southampt - Sheff.U','1','3 - 1','Avslutad','2020-07-26T17:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-14,13,'Burnley - Brighton','1','1 - 2','Avslutad','2020-07-26T17:00:00+02:00');

INSERT INTO draws (id,groupid,drawnumber,product,drawstate,regclosetime,created_by,created_by_name,created,nrofrights,rowprice,extra_bet,systemsize) VALUES (
-15,-10,4648,'Stryktipset','Open','2020-08-01 15:59:00',-11,'Arne H','2020-07-31 08:44:45',8,1,0,256);

INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-15,1,'Arsenal - Chelsea','1','2 - 1','Avslutad','2020-08-01T18:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-15,2,'Dundee U - St.Johnst','X2','1 - 1','Avslutad','2020-08-01T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-15,3,'Hibernian - Kilmarnoc','1','2 - 1','Avslutad','2020-08-01T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-15,4,'St.Mirren - Livingst.','1','1 - 0','Avslutad','2020-08-01T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-15,5,'AFC Eskil - Öster','X2','1 - 1','Avslutad','2020-08-01T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-15,6,'GIF Sunds - Degerfors','X2','1 - 4','Avslutad','2020-08-01T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-15,7,'Ljungski - Halmstad','2','0 - 0','Avslutad','2020-08-01T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-15,8,'Brann - Vålerenge','X2','1 - 2','Avslutad','2020-08-01T20:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-15,9,'Helsingbo - Hammarby','12','1 - 1','Avslutad','2020-08-02T14:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-15,10,'Kalmar FF - AIK','X2','0 - 0','Avslutad','2020-08-02T18:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-15,11,'IFK Göteb - Malmö FF','2','0 - 3','Avslutad','2020-08-02T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-15,12,'Varberg - Östersund','1X','1 - 1','Avslutad','2020-08-02T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-15,13,'Norrby - Jönköping','12','1 - 2','Avslutad','2020-08-02T14:30:00+02:00');

INSERT INTO events (id,groupid,eventtype,eventtime,userid,username,profit,cost,drawid,created) VALUES (
-10,-10,'PAYMENT','2020-08-08 10:30:46',-11,'Arne H',-4504,NULL,NULL,'2020-08-09 10:30:46');




INSERT INTO draws (id,groupid,drawnumber,product,drawstate,regclosetime,created_by,created_by_name,created,nrofrights,rowprice,extra_bet,systemsize) VALUES (
-16,-10,4649,'Stryktipset','Open','2020-08-08 15:59:00',-12,'Glenn S','2020-08-07 06:46:53',9,1,0,256);

INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-16,1,'B.München - Chelsea','1','4 - 1','Avslutad','2020-08-08T21:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-16,2,'Barcelona - Napoli','12','3 - 1','Avslutad','2020-08-08T21:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-16,3,'Hamilton - Ross Co.','1X','0 - 1','Avslutad','2020-08-08T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-16,4,'Livingst. - Hibernian','12','1 - 4','Avslutad','2020-08-08T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-16,5,'Motherw. - Dundee U','1','0 - 1','Avslutad','2020-08-08T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-16,6,'Dalkurd - Norrby','X2','2 - 2','Avslutad','2020-08-08T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-16,7,'Halmstad - GAIS','1','0 - 0','Avslutad','2020-08-08T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-16,8,'Jönköping - Umeå FC','1','1 - 0','Avslutad','2020-08-08T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-16,9,'Djurgård. - Hammarby','12','1 - 2','Avslutad','2020-08-09T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-16,10,'Falkenber - Malmö FF','2','0 - 1','Avslutad','2020-08-09T14:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-16,11,'Mjällby - AIK','1X','3 - 1','Avslutad','2020-08-09T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-16,12,'Häcken - Kalmar FF','X2','0 - 2','Avslutad','2020-08-09T14:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-16,13,'Örebro - IFK Göteb','X2','1 - 1','Avslutad','2020-08-09T14:30:00+02:00');

INSERT INTO draws (id,groupid,drawnumber,product,drawstate,regclosetime,created_by,created_by_name,created,nrofrights,rowprice,extra_bet,systemsize) VALUES (
-17,-10,4650,'Stryktipset','Open','2020-08-15 15:59:00',-12,'Glenn S','2020-08-14 08:10:59',6,1,1,128);

INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-17,1,'Manch.C - Lyon','1X','1 - 3','Avslutad','2020-08-15T21:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-17,2,'Dalkurd - Halmstad','1X','1 - 1','Avslutad','2020-08-15T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-17,3,'GIF Sunds - GAIS','1','3 - 0','Avslutad','2020-08-15T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-17,4,'Öster - Brage','12','4 - 2','Avslutad','2020-08-15T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-17,5,'Sarpsbor. - Molde','X','2 - 1','Avslutad','2020-08-15T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-17,6,'Hamilton - St.Mirren','1','0 - 1','Avslutad','2020-08-15T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-17,7,'Kilmarnoc - St.Johnst','1X','1 - 2','Avslutad','2020-08-15T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-17,8,'Ross Co. - Dundee U','1X','1 - 2','Avslutad','2020-08-15T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-17,9,'Hibernian - Motherw.','1','0 - 0','Avslutad','2020-08-15T18:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-17,10,'Falkenber - AIK','1','1 - 1','Avslutad','2020-08-16T14:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-17,11,'Hammarby - Elfsborg','1X','2 - 2','Avslutad','2020-08-16T14:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-17,12,'Mjällby - Malmö FF','X2','2 - 2','Avslutad','2020-08-16T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-17,13,'Västerås - Umeå FC','1','2 - 0','Avslutad','2020-08-16T14:30:00+02:00');


INSERT INTO draws (id,groupid,drawnumber,product,drawstate,regclosetime,created_by,created_by_name,created,nrofrights,rowprice,extra_bet,systemsize) VALUES (
-18,-10,4650,'Stryktipset','Open','2020-08-15 15:59:00',-10,'Lars-Gunnar B','2020-08-14 08:10:59',6,1,0,256);

INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-18,1,'Manch.C - Lyon','1X','1 - 3','Avslutad','2020-08-15T21:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-18,2,'Dalkurd - Halmstad','1X','1 - 1','Avslutad','2020-08-15T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-18,3,'GIF Sunds - GAIS','1','3 - 0','Avslutad','2020-08-15T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-18,4,'Öster - Brage','12','4 - 2','Avslutad','2020-08-15T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-18,5,'Sarpsbor. - Molde','1','2 - 1','Avslutad','2020-08-15T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-18,6,'Hamilton - St.Mirren','2','0 - 1','Avslutad','2020-08-15T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-18,7,'Kilmarnoc - St.Johnst','X2','1 - 2','Avslutad','2020-08-15T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-18,8,'Ross Co. - Dundee U','X2','1 - 2','Avslutad','2020-08-15T16:00:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-18,9,'Hibernian - Motherw.','1','0 - 0','Avslutad','2020-08-15T18:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-18,10,'Falkenber - AIK','1','1 - 1','Avslutad','2020-08-16T14:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-18,11,'Hammarby - Elfsborg','1X','2 - 2','Avslutad','2020-08-16T14:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-18,12,'Mjällby - Malmö FF','X2','2 - 2','Avslutad','2020-08-16T17:30:00+02:00');
INSERT INTO draw_rows (drawid,rownr,teams,bet,"result",status,matchstart) VALUES (
-18,13,'Västerås - Umeå FC','1X','2 - 0','Avslutad','2020-08-16T14:30:00+02:00');