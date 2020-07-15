
function login() {
    hbsModal("#basicModal", hbsTemplates["main-snippets"]["login"]);
    $("#basicModal").find("#log-in").click(function (e) {
        var loginInfo = collectLoginInfo("#basicModal");
        if (loginInfo !== null) {
            $.ajax({
                type: "POST",
                url: "/login",
                cache: false,
                data: loginInfo,
                success: function (data, status, jqxhr) {
                    $("#basicModal").modal("hide");
                    initApp();
                },
                error: function (data, status, jqxhr) {
                    if (data.status === 401) {
                        popup("#popup", "Inloggning", "Ogiltigt användarnamn eller lösenord!!!");

                    } else {
                        popup("#popup", "Inloggning", "Just nu går det inte att logga in, försök senare!");

                    }
                }

            });
        }
    });

    $("#basicModal").find('#forgot-password').click(function (e) {
        forgotPassword(e);
    });

}

function checkInvites(inviteToken) {
    var inviteToken = getUrlVars()["invite-token"];
    if (inviteToken !== undefined && inviteToken !== null) {
        inviteToken = inviteToken.replace(/#/g, ""); //sometimes there is a trailing # (because i have a-elements href to #) 
        $.ajax({
            type: "POST",
            url: "/addInvitedUserToGroup",
            cache: false,
            data: { inviteToken: inviteToken },
            success: function (data, status, jqxhr) {
                var groupName = data.groupName;
                popup("#popup", "Ny grupp", "Grattis du är nu medlem i gruppen: " + groupName);
                initGroups();
            }
        });
    }
}


function forgotPassword(e) {
    data = {};
    hbsModal("#basicModal", hbsTemplates["main-snippets"]["forgot-password"], data);
    e.preventDefault();

    $("#basicModal").find(".forgot-password").click(function (e) {
        var buttonId = $(this).attr('id');
        var identityType;
        var identity;
        if (buttonId === "send-mail-for-mail-adr") {
            identityType = "by-mail-adress";
            identity = $("#basicModal").find("#email").val().trim();
            if (identity === "" || !identity.match(/^[^@]+@[^@]+\.[^@]+$/)) {
                popup("#popup", "Glömt lösenord", "Mailadress saknas eller verkar vara ogiltig!!");
                return;
            }
        } else if (buttonId === "send-mail-for-userid") {
            identityType = "by-user-id";
            identity = $("#basicModal").find("#userid").val().trim();
            if (identity === "") {
                popup("#popup", "Glömt lösenord", "Användarnamn saknas!!");
                return;
            }
        } else {
            popup("#popup", "Glömt lösenord", "Ett tekniskt fel har inträffat!");

            return;

        }

        $.ajax({
            type: "POST",
            url: "/forgotPassword",
            cache: false,
            data: {
                identityType: identityType,
                identity: identity
            },
            success: function (data, status, jqxhr) {
                $("#basicModal").modal("hide");
                popup("#popup", "Glömt lösenord", "Mail med länk för återställning av lösenord skickat!\nKontrollera din inkorg om en stund.");
            },
            error: function (data, status, jqxhr) {
                if (data.status === 404) {
                    if (identityType === "by-mail-adress") {
                        popup("#popup", "Glömt lösenord", "Det finns ingen användare med denna mail-adress!!");
                    } else {
                        popup("#popup", "Glömt lösenord", "Det finns ingen användare med detta användarnamn!!");
                    }
                } else {
                    popup("#popup", "Glömt lösenord", "Det gick inte att skicka återställnings-mailet!!");
                }
            }
        });




    });



}

function resetPassword(resetToken) {
    data = {};
    hbsModal("#basicModal", hbsTemplates["main-snippets"]["reset-password"], data);
    $("#basicModal").find("#reset-passw").click(function (e) {
        var password = $("#basicModal").find("#password").val().trim();
        var pwd2 = $("#basicModal").find("#password2").val().trim();

        if (password === "") {
            popup("#popup", "Återställ lösenord", "Lösenord saknas!!!");
            return false;
        }


        if (password !== pwd2) {
            popup("#popup","Återställ lösenord", "Lösenorden stämmer inte överens!!");
            return false;
        }

        $.ajax({
            type: "POST",
            url: "/resetPassword",
            cache: false,
            data: {
                password: password,
                resetToken: resetToken
            },
            success: function (data, status, jqxhr) {
                $("#basicModal").modal("hide");
                popup("#popup", "Återställ lösenord", "Lösenordet är uppdaterat");
                removeUrlVars();
                initApp();

            },
            error: function (data, status, jqxhr) {
                if (data.status === 404) {
                    popup("#popup","Återställ lösenord", "Det gick inte att uppdatera lösenordet");
                } else {
                    popup("#popup", "Återställ lösenord","Ett Tekniskt fel har inträffat, försök igen senare!");
                }
            }
        });
        return false;
    })

}

function logout() {
    $.ajax({
        url: "/logout",
        cache: false,
        success: function (data, status, jqxhr) {
            deleteCookie("SessId");
            window.location.href = window.location.pathname;
            //window.location.reload();
        }
    });
}


function initApp() {
    initUser();
    initGroups();
    $("#login").hide(); $("#menu-items").show(); $("#logout").show();//$('.navbar-collapse').collapse('hide');
    checkInvites();
}




function getUserInfo(callback) {
    $.ajax({
        url: "/getUserInfo",
        cache: false,
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            callback(data);
        },
        error: function (data, status, jqxhr) {
            deleteCookie("SessId");
            location.reload();
        }
    });
}

function initUser() {
    globals.userinfo = {};
    getUserInfo(function (data) {
        globals.userinfo = data;
        $("#logged-in-user").text(globals.userinfo.username);

    });
}

function getGroups(callback) {
    $.ajax({
        url: "/getGroups",
        cache: false,
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            callback(data);
        }
    });
}

function initGroups() {
    globals.usergroups = [];
    if (!globals.activeGroup) {
        globals.activeGroup = {}
    }

    getGroups(function (data) {
        globals.usergroups = data;
        $('#available-groups').empty();

        $('#available-groups').append($('<option>', { value: -1, text: "Välj grupp...", }).prop("disabled", true));

        for (var i = 0; i < globals.usergroups.length; i++) {
            $('#available-groups').append($('<option>', { value: globals.usergroups[i].groupid, text: globals.usergroups[i].groupname }));
        }


        $('#available-groups').unbind("change");
        $('#available-groups').change(function () {
            var selected = $(this).find("option:selected").val();

            globals.activeGroup = {};
            for (var i = 0; i < globals.usergroups.length; i++) {
                if (globals.usergroups[i].groupid == selected) {
                    globals.activeGroup = globals.usergroups[i];
                    break;
                }
            }
            $("#latest-games").show();
            $("#info").hide();
            $("#group-title").text(globals.activeGroup.groupname ? globals.activeGroup.groupname : "");
            updateResults(globals.activeGroup.groupid);
        })

        $("#group-title").text("");
        $("#latest-games").hide();

        if (globals.activeGroup.groupid === undefined && globals.usergroups.length > 0) {
            globals.activeGroup = globals.usergroups[0];
        }

        if (globals.activeGroup.groupid) {
            $('#available-groups').val(globals.activeGroup.groupid).trigger("change");
        }

    });



}



function configureUser() {

    if (!globals.userinfo) {
        hbsModal("#basicModal", hbsTemplates["main-snippets"]["user-info"], { register: true });
        $("#basicModal").find("#reg-or-update").click(function (e) {
            var userInfo = collectUserInfo("#basicModal", true);
            if (userInfo !== null) {
                $.ajax({
                    type: "POST",
                    url: "/register",
                    cache: false,
                    data: userInfo,
                    success: function (data, status, jqxhr) {
                        //reloadIfLoggedOut(jqxhr);
                        $("#basicModal").modal("hide");
                        initApp();
                    },
                    error: function (data, status, jqxhr) {
                        console.log(data, status, jqxhr);
                        if (data.status === 403) {
                            popup("#popup","Användarinfo", "Användarnamnet finns redan!");
                        } else {
                            popup("#popup","Användarinfo", "Ett Tekniskt fel har inträffat, försök igen senare!");
                        }
                    }
                });

            }
        });
    } else {

        $.ajax({
            url: "/getUserInfo",
            cache: false,
            success: function (data, status, jqxhr) {
                reloadIfLoggedOut(jqxhr);
                hbsModal("#basicModal", hbsTemplates["main-snippets"]["user-info"], data);
                $("#basicModal").find("#reg-or-update").click(function (e) {
                    var userInfo = collectUserInfo("#basicModal");
                    if (userInfo !== null) {
                        $.ajax({
                            type: "POST",
                            url: "/updateUserInfo",
                            cache: false,
                            data: userInfo,
                            success: function (data, status, jqxhr) {
                                reloadIfLoggedOut(jqxhr);
                                $("#basicModal").modal("hide");
                            },
                            error: function (data, status, jqxhr) {
                                popup("#popup","Användarinfo", "Ett Tekniskt fel har inträffat, försök igen senare!");
                            }
                        });
                    }

                });



            }
        });
    }
}


function configureGroups() {
    data = globals.usergroups.filter(function (e) { return e.admin == 1; });


    hbsModal("#basicModal", hbsTemplates["main-snippets"]["groups"], data);

    $("#basicModal").find("#add-group").click(function (e) {
        var newGroup = $("#basicModal").find("#new-group").val().trim();
        if (newGroup === "") {
            popup("#popup","Skapa grupp", "Gruppnamn saknas!");
            return;
        }
        $.ajax({
            type: "POST",
            url: "/createGroup",
            cache: false,
            data: { groupName: newGroup },
            success: function (data, status, jqxhr) {
                reloadIfLoggedOut(jqxhr);
                $("#basicModal").find("#new-group").val("");
                initGroups();
                $("#basicModal").modal('hide');
                popup("#popup", "Skapa grupp", "Grupp skapad!");
            },
            error: function (data, status, jqxhr) {
                if (data.status === 403) {
                    popup("#popup","Skapa grupp", "Gruppen finns redan!");

                } else {
                    popup("#popup","Skapa grupp", "Ett Tekniskt fel har inträffat, försök igen senare!");
                }
            }
        });

    });
}

function updateGroup(groupId, name, button) {
    $.ajax({
        type: "POST",
        url: "/updateGroup",
        cache: false,
        data: { groupId: groupId, groupName: name },
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            initGroups();
            button.css('color', '#428bca').prop('disabled', true);
        },
        error: function (data, status, jqxhr) {
            if (data.status === 403) {
                popup("#popup", "Uppdatera grupp", "Gruppen finns redan!");
            } else {
                popup("#popup", "Uppdatera grupp", "Ett Tekniskt fel har inträffat, försök igen senare!");
            }
        }
    });

}



function deleteGroup(groupId, groupName, row) {


    var fun = function () {
        $.ajax({
            type: "POST",
            url: "/deleteGroup",
            cache: false,
            data: { groupId: groupId },
            success: function (data, status, jqxhr) {
                reloadIfLoggedOut(jqxhr);
                if (globals.activeGroup.groupid === groupId) {
                    globals.activeGroup = {};
                }
                initGroups();
                row.empty();
            },
            error: function (data, status, jqxhr) {
                popup("#popup", "Ta bort grupp", "Ett Tekniskt fel har inträffat, försök igen senare!");
            }
        });
    }

    dialog("#yes-no", "Ta bort Grupp",
        "Är du säker på att du vill ta bort gruppen '" + groupName + "'?<br>(Tänk på att all om info gruppen då försvinner)",
        { text: "Ja", func: fun },
        { text: "Nej", func: function () { return; } })

}

function getUserSurplus(callback) {
    var groupId = globals.activeGroup.groupid;
    $.ajax({
        url: "/getUserSurplus",
        type: "POST",
        cache: false,
        data: { groupId: groupId },
        success: function (data, status, jqxhr) {
            callback(data.surplus);
        }
    });


}

function configureGroupMembers() {
    var groupId = globals.activeGroup.groupid;
    if (groupId === undefined) {
        popup("#popup", "Visa Medlemmar", "Välj grupp först!");
        return;
    }

    $.ajax({
        url: "/getGroupMembers",
        type: "POST",
        cache: false,
        data: { groupId: groupId },
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            var isAdmin = globals.activeGroup.admin;
            data.members.map(function (e) {
                if (isAdmin || e.userid == globals.userinfo.userid ) {
                    e.isDeletable = true;
                }
                return e;
            })


            hbsModal("#basicModal", hbsTemplates["main-snippets"]["group-members"], { members: data.members, admin: globals.activeGroup.admin, invites: data.invites, currentUser: globals.userinfo.userid });

            $("#basicModal").find("#invite-member").click(function (e) {
                var inviteEmail = $("#basicModal").find("#invite-email").val().trim();
                if (inviteEmail === "" || !inviteEmail.match(/^[^@]+@[^@]+\.[^@]+$/)) {
                    popup("#popup", "Skicka inbjudan", "Mailadress saknas eller verkar vara ogiltig!!");
                    return false;
                }


                $.ajax({
                    type: "POST",
                    url: "/inviteMemberToGroup",
                    cache: false,
                    data: { email: inviteEmail, groupId: globals.activeGroup.groupid },
                    success: function (data, status, jqxhr) {
                        reloadIfLoggedOut(jqxhr);
                        var row = "<p style='margin-bottom:0px;'>" + inviteEmail + "<span style='color:red;' class='glyphicon glyphicon-remove' onclick='removeInvite(\"" + inviteEmail + "\",$(this).parent());'></span></p>";
                        $("#basicModal").find("#invites").prepend(row);
                        $("#basicModal").find("#invite-email").val("");
                    },
                    error: function (data, status, jqxhr) {
                        if (data.status === 403) {
                            popup("#popup", "Skicka inbjudan", "Inbjudan finns redan!");
                        } else {
                            popup("#popup", "Skicka inbjudan", "Tekniskt fel!");
                        }
                    }
                });

            });

        }
    });

}

function moveTableRow(rowElem, dir) {
    var groupId = globals.activeGroup.groupid;
  
    var from = rowElem.find("#sortorder").text();
    var to = null;
    if (dir == "up") {
      to = rowElem.prev().find("#sortorder").text();
    } else {
      to = rowElem.next().find("#sortorder").text();
    }
  
    if(from=="" || to=="") {
      return;
    }
  
    $.ajax({
      url: "/swapSortOrder",
      type: "POST",
      cache: false,
      data: { groupId: groupId, from: from, to: to },
      success: function (data, status, jqxhr) {
        rowElem.find("#sortorder").text(to);
        if (dir == "up") {
            rowElem.prev().find("#sortorder").text(from);  
            rowElem.insertBefore(rowElem.prev());
        } else {
            rowElem.next().find("#sortorder").text(from);  
            rowElem.insertAfter(rowElem.next());
        }
  
      }
    });
  
  }

function configurePayment(surplus) {
    var groupId = globals.activeGroup.groupid;

    $.ajax({
        url: "/getGroupMembers",
        type: "POST",
        cache: false,
        data: { groupId: groupId },
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            data.surplus=surplus;
            data.nrOfMembers=data.members.length;
            data.members.forEach(function(e) {e.name=(e.name!="")?e.name:e.username});
            hbsModal("#basicModal", hbsTemplates["main-snippets"]["payment"],data);
            $('.amount-per-member').text(Number(data.surplus/data.nrOfMembers).toFixed(2)+' kr')
        }
    });
}

function makePayment(amount,surplus,sendMail) {
    var groupId = globals.activeGroup.groupid;
    var res={};

    if(amount<=0) {
        popup("#popup", "Utbetalning", "Summan måste vara större än noll!");
        return;
    } 

    if(amount>surplus) {
        popup("#popup", "Utbetalning", "Maximalt belopp som går att utbetala är:"+surplus+" kr!");
        return;

    }
    res.amount=amount;
    res.groupId=groupId;
    if(sendMail) {
        res.mailTo=globals.userinfo.email;
        res.mailBody=hbsTemplates["main-snippets"]["payment-mail-template"]({amount:amount,tablebody:$("#basicModal").find("#payment-div").html()});
    }
    //console.log(res.mailBody);

    $.ajax({
        url: "/makePayment",
        type: "POST",
        cache: false,
        data: res,
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            $("#basicModal").modal("hide");
            popup("#popup", "Utbetalning", "Utbetalning registrerad!");
        },
        error: function (data, status, jqxhr) {
            if (data.status === 400) {
                popup("#popup", "Utbetalning", "Maximalt belopp som går att utbetala är:"+surplus+" kr!");
        
            } if(data.status === 406) { 
                popup("#popup", "Utbetalning", "Utbetalning registrerad men det gick ej att skicka mail!");
            } else {
                popup("#popup", "Utbetalning", "Tekniskt fel!");
            }
        }
    });


}


function removeInvite(email, rowElem) {
    $.ajax({
        type: "POST",
        url: "/deleteInviteToGroup",
        cache: false,
        data: { email: email, groupId: globals.activeGroup.groupid },
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            rowElem.remove();
        },
        error: function (data, status, jqxhr) {
            popup("#popup", "Ta bort inbjudan", "Tekniskt fel!");
        }
    });
}


function removeMember(memberId, groupId, rowElem) {
    var fun = function () {
        $.ajax({
            type: "POST",
            url: "/removeMember",
            cache: false,
            data: { member: memberId, groupId: groupId },
            success: function (data, status, jqxhr) {
                reloadIfLoggedOut(jqxhr);
                rowElem.remove();
                if (memberId == globals.userinfo.userid) {
                    initGroups();
                }
            },
            error: function (data, status, jqxhr) {
                popup("#popup", "Ta bort medlem", "Tekniskt fel!");
            }
        });
    }

    if (memberId == globals.userinfo.userid) {
        dialog("#yes-no", "Lämna grupp",
            "Är du säker på att du vill lämna denna gruppen?",
            { text: "Ja", func: function () { fun(); $("#basicModal").modal('hide'); } },
            { text: "Nej", func: function () { return; } })
    } else {
        dialog("#yes-no", "Ta bort medlem",
            "Är du säker på att du vill ta bort denna medlem?",
            { text: "Ja", func: fun },
            { text: "Nej", func: function () { return; } })

    }
}


function configurePlay() {

    var groupId = globals.activeGroup.groupid;
    if (groupId === undefined) {
        popup("#popup", "Spela", "Välj grupp först!");
        return;
    }


    hbsModal("#basicModal", hbsTemplates["main-snippets"]["play"]);
    getPlayable("stryktipset", "stryk");
    getPlayable("europatipset", "euro");
    getPlayable("topptipsetfamily", "topp");

}


function configureStatistics() {

    var groupId = globals.activeGroup.groupid;
    if (groupId === undefined) {
        popup("#popup", "Statistik", "Välj grupp först!");
        return;
    }
    $.ajax({
        url: "/getStatistics",
        type: "POST",
        cache: false,
        data: { groupId: groupId },
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            hbsModal("#basicModal", hbsTemplates["main-snippets"]["statistics"],data);
        }
    });


}


function configureEvents() {

    var groupId = globals.activeGroup.groupid;
    if (groupId === undefined) {
        popup("#popup", "Händelser", "Välj grupp först!");
        return;
    }
    getUserSurplus(function(surplus) {
        $.ajax({
            url: "/getEvents",
            type: "POST",
            cache: false,
            data: { groupId: groupId,page:0 },
            success: function (data, status, jqxhr) {
                reloadIfLoggedOut(jqxhr);
                data.events = data.events.map(e => {
                    switch (e.eventtype) {
                        case "BET": e.eventtype = "Spel"; break;
                        case "EXTRA BET": e.eventtype = "Extra spel"; break;
                        case "PAYMENT": e.eventtype = "Utbetalning"; break;
                    }
                    e.eventtime=new Date(e.eventtime.replace(' ', 'T')).toLocaleDateString();
                    if(e.eventtype=="Utbetalning") {
                        var isAdmin = globals.activeGroup.admin;
                        if (isAdmin || e.userid == globals.userinfo.userid ) {
                            e.isDeletable = true;
                        }
                    }
                    return e;
                });
                data.surplus=surplus;
                hbsModal("#basicModal", hbsTemplates["main-snippets"]["events"],data);
            }
        });
    });

}

function getMoreEvents(buttonElem,page) {
    var groupId = globals.activeGroup.groupid;
    var nextPage=page;
    $.ajax({
        url: "/getEvents",
        type: "POST",
        cache: false,
        data: { groupId: groupId,page:nextPage },
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            data.events = data.events.map(e => {
                switch (e.eventtype) {
                    case "BET": e.eventtype = "Spel"; break;
                    case "EXTRA BET": e.eventtype = "Extra spel"; break;
                    case "PAYMENT": e.eventtype = "Utbetalning"; break;
                }
                e.eventtime=new Date(e.eventtime.replace(' ', 'T')).toLocaleDateString();
                return e;
            });

            var rowTemplate=buttonElem.parent().parent().prev().clone();
            var lastRow=buttonElem.parent().parent();
            data.events.forEach(function(e) {
                var row=rowTemplate.clone();
                var c=row.children();
                c.get(0).innerText=e.eventtime;
                c.get(1).innerText=e.eventtype;
                c.get(2).innerText=e.username;
                c.get(3).innerText=e.cost;
                c.get(4).innerText=e.profit;
                row.insertBefore(lastRow);             
               
            });
            if(data.hasMorePages) {
                buttonElem.attr("onclick", "").unbind("click");
                buttonElem.click(function() {getMoreEvents(buttonElem,page+1)});
            } else {
                buttonElem.parent().parent().remove();
            }

        }
    });

}

function removeEvent(eventId,rowElem) {
    var groupId = globals.activeGroup.groupid;
    var fun = function () {
        $.ajax({
            type: "POST",
            url: "/deleteEvent",
            cache: false,
            data: { groupId: groupId,eventId:eventId },
            success: function (data, status, jqxhr) {
                reloadIfLoggedOut(jqxhr);
                rowElem.remove();
            },
            error: function (data, status, jqxhr) {
                popup("#popup", "Ta bort Händelse", "Ett Tekniskt fel har inträffat, försök igen senare!");
            }
        });
    }

    dialog("#yes-no", "Ta bort Händelse",
        "Är du säker på att du vill ta bort händelsen?",
        { text: "Ja", func: fun },
        { text: "Nej", func: function () { return; } })



}


function getPlayable(product, div) {
    $.ajax({
        type: "POST",
        url: "/getPlayable",
        cache: false,
        data: { product: product },
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            data.regCloseTime = data.regCloseTime.replace("T", " ").replace(/\+.*$/, "");
            $("#basicModal").find("#" + div).prepend(hbsTemplates["main-snippets"]["matches"](data));
            $("#basicModal").find("#" + div).find(".1x2").click(function () {
                $(this).toggleClass('on off');
                var nrOfRows = 1;
                var rows = getDrawBettings(div);
                rows.forEach(function (e) {
                    var l = e.length;
                    if (l > 0) {
                        nrOfRows *= l;
                    }

                })
                $("#basicModal").find("#" + div).find("#nr-of-rows").text(nrOfRows);
                var notChecked = rows.indexOf("");
                if (notChecked < 0) {
                    $("#basicModal").find("#" + div).find("#play").attr("disabled", false);
                } else {
                    $("#basicModal").find("#" + div).find("#play").attr("disabled", true);
                }

            });
            $("#basicModal").find("#" + div).find("#play").click(function () {
                let drawInfo = {
                    groupid: globals.activeGroup.groupid,
                    drawnumber: data.drawNumber,
                    product: data.productName,
                    drawstate: data.drawState,
                    regclosetime: data.regCloseTime,
                    rowprice: data.rowPrice,
                    extra_bet: false,
                    rows: []
                }
                let bettings = getDrawBettings(div);
                let systemsize = 1;
                for (let i = 0; i < bettings.length; i++) {
                    let row = {};
                    row.rownr = i + 1;
                    row.teams = data.draws[i].eventDescription;
                    row.bet = bettings[i];
                    row.matchstart=data.draws[i].match.matchStart;
                    systemsize *= row.bet.length;
                    drawInfo.rows.push(row);
                }


                var ajaxCall = function () {
                    $.ajax({
                        type: "POST",
                        url: "/play",
                        cache: false,
                        data: drawInfo,
                        success: function (data, status, jqxhr) {
                            reloadIfLoggedOut(jqxhr);
                            updateResults(globals.activeGroup.groupid);
                            $("#basicModal").modal('hide');
                            var url =
                                dialog("#yes-no", "Lägg spel hos Svenska spel",
                                    "Vill du gå till svenska spel och göra det faktiska spelet där(funkar bara om du redan är inloggad)?",
                                    {
                                        text: "Ja", func: function () {
                                            sendRows(drawInfo,bettings,systemsize);
                                            //window.open("https://spela.svenskaspel.se/" + drawInfo.product.toLowerCase().split(" ")[0] + "/" + drawInfo.drawnumber);
                                        }
                                    },
                                    { text: "Nej", func: function () { return; } })
                            //console.log("ok");
                        },
                        error: function (data, status, jqxhr) {
                            console.log(data, status, jqxhr);
                            popup("#popup", "Spela", "Det gick inte att spela");
                        }
                    });
                }
                getUserSurplus(function (surplus) {
                    if (surplus>0) {
                        dialog("#yes-no", "Extra spel",
                            "Är detta ett extra eller ett ordinarie spel?",
                            {
                                text: "Extra", func: function () {
                                    drawInfo.extra_bet = true;
                                    ajaxCall();

                                }
                            },
                            { text: "ordinarie", func: function () {ajaxCall(); } })


                    } else {
                        ajaxCall();
                    }
                })




            })
        },
        error: function (data, status, jqxhr) {
            if (data.status == 403) {
                $("#basicModal").find("#" + div).prepend("<h2>Inget spel för tillfället!</h2>");
            } else if (data.status == 404) {
                $("#basicModal").find("#" + div).prepend("<h2>Information saknas</h2>");
            }
        }
    });
}

function getDrawBettings(div) {
    var rows = [];
    $("#basicModal").find("#" + div).find(".draw-row").each(function (i, e) {
        rows.push($(e).find(".on").text());
    })
    return rows;
}

function updateResults(groupId) {
    if (groupId == undefined) {
        $("#latest-games").hide();
        $("#info").show();
        $("#results").empty();
        return;
    }

    $.ajax({
        type: "GET",
        url: "/updateResults?groupId=" + groupId,
        cache: false,
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            getNextInLine(groupId);
            getToplist(groupId);
            getResults(groupId,0);
        },
        error: function (data, status, jqxhr) {
            popup("#popup", "Uppdatera resultat", "Tekniskt fel!");
        }
    });


}

function getNextInLine(groupId) {
    $.ajax({
        type: "POST",
        url: "/getNextInLine",
        cache: false,
        data: { groupId: groupId},
        success: function (data, status, jqxhr) {

            if(data.extraBets.length>0) {
                data.extraBets=data.extraBets.map(function(e) {return e.name+"("+e.surplus+" kr)"}).join(", ");
            }

            if(data.lastPlayed) {
                var d=new Date(data.lastPlayed.replace(' ', 'T')+"Z");
                data.lastPlayed=d.getDate()+"/"+(d.getMonth()+1);
            }

            $("#who-should-play").empty();
            $("#who-should-play").append(hbsTemplates["main-snippets"]["playing-order"](data));
        }
    });

}

function getToplist(groupId) {
    $("#top-list").hide();
    $.ajax({
        type: "POST",
        url: "/getToplist",
        cache: false,
        data: { groupId: groupId},
        success: function (data, status, jqxhr) {
            $("#top-list").empty();
            $("#top-list").append(hbsTemplates["main-snippets"]["top-order"]({list:data}));
            $("#top-list").show();
        }
    });

}



function getRowsFromLink(link,callback) {
    $.ajax({
        type: "POST",
        url: "/getRowsFromLink",
        cache: false,
        data: { link: link},
        success: function (data, status, jqxhr) {
            callback(data);
        },
        error: function (data, status, jqxhr) {
            callback(null);
        }
    });

}


function getRowsFromClipBoard(pasteButton,targetTable) {
    pasteButton.attr("disabled", true);
    navigator.clipboard.readText().then(function(clipText) {
        if(clipText.match(/http.*/i)) {
            popup("#message-popup", "Klistra in", "Hämtar rader...");
            getRowsFromLink(clipText,function(rows) {
                if(!pasteRows(targetTable,rows)) {
                    popup("#popup", "Klistra in", "Det gick inte att klistra in raderna");
                };
                pasteButton.attr("disabled", false);
                $("#message-popup").modal('hide');
            })
        } else {
            if(!pasteRows(targetTable,clipText)) {
                popup("#popup", "Klistra in", "Det gick inte att klistra in raderna");
            };
            pasteButton.attr("disabled", false);
        }

    });
}



function getResults(groupId,page) {
    if(page==0) {
        $("#results").empty();
    }
    $.ajax({
        type: "GET",
        url: "/getResults?groupId=" + groupId+"&page="+page,
        cache: false,
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            var finalizedHeader="";
            data.results.forEach(function (e) {
                e.rows = parseRows(e.rows);
                if ((e.drawstate != "Finalized" && e.created_by == globals.userinfo.userid)||globals.activeGroup.admin===1) {
                    e.showDelete = true;
                }

                e.results = parseResults(e.results);
                if (e.results != undefined) {
                    e.totalWin = 0;
                    e.results.forEach(function (el) { 
                        e.totalWin += el.total; 
                        el.worth=Number(el.worth.replace(',','.')).toFixed(0);
                    });
                }

                e.created = new Date(e.created.replace(' ', 'T')+"Z").toLocaleString();

                if(e.drawstate=="Finalized" && finalizedHeader=="") {
                    finalizedHeader="Avgjorda spel"
                    e.finalizedHeader=finalizedHeader;
                }
                $("#results").append(hbsTemplates["main-snippets"]["results"](e));



            })
            $("#results").find("#more-results").remove();
            if(data.hasMorePages) {
                $("#results").append('<input type="button" id="more-results" class="btn btn-info" value="Mer..." onclick="getResults('+groupId+','+(page+1)+')"/>');

            }
        },
        error: function (data, status, jqxhr) {
            popup("#popup", "Hämta resultat", "Tekniskt fel!");
        }
    });


}

function parseRows(rows) {
    var res = rows.split('|').map(function (e) {
        var a = e.split(";");
        var res = {
            rownr: a[0],
            teams: a[1],
            bet: a[2],
            result: a[3],
            status: a[4],
            matchstart:a[5],
            on1: a[2].match("1") != undefined ? "on" : "off",
            onX: a[2].match("X") != undefined ? "on" : "off",
            on2: a[2].match("2") != undefined ? "on" : "off",
        };

        if(res.status=="-1") {
            res.status="Inte startat";
        }
        var tmp = res.result.split("-");
        var home = parseInt(tmp[0].trim());
        var away = parseInt(tmp[1].trim());
        if (res.status != "Inte startat") {
            if (home > away) {
                if (res.on1 == "on") {
                    res.status1 = "correct";
                    res.isCorrect = true;
                } else {
                    res.missed1 = "missed";
                }
            } else if (home == away) {
                if (res.onX == "on") {
                    res.statusX = "correct";
                    res.isCorrect = true;
                } else {
                    res.missedX = "missed";
                }
            } else {
                if (res.on2 == "on") {
                    res.status2 = "correct";
                    res.isCorrect = true;
                } else {
                    res.missed2 = "missed";
                }
            }
        }

        if (res.status == "Inte startat") {
            var matchStart=new Date(res.matchstart);
            if (isNaN(matchStart.getTime())) {
                res.result="- -";
            } else {
            var today = new Date();
            
            var isToday = (today.toDateString() == matchStart.toDateString());
            if(isToday) {           
                res.result = matchStart.getHours().toString().padStart(2,"0")+":"+matchStart.getMinutes().toString().padStart(2,"0");
            } else {
                res.result=getWeekDay(matchStart);
            }
            }
        } else if (res.status != "Avslutad" && res.status != "Slut efter förlängning") {
            res.result = "(" + res.result + ")";
        }

        return res;
    });
    return res.sort(function (a, b) { return a.rownr - b.rownr });
}

function parseResults(rows) {
    if (!rows) {
        return undefined;
    }
    var res = rows.split('|').map(function (e) {
        var a = e.split(";");
        var r = {
            rights: a[0],
            rows: a[1],
            worth: a[2]
        }
        r.total = 0;
        try {
            r.total = Number(r.rows.replace(",", ".")) * Number(r.worth.replace(",", "."));
        } catch (err) { };

        return r;

    })
    return res.sort(function (a, b) { return b.rights - a.rights });
}

function deleteDraw(drawId) {
    var groupId = globals.activeGroup.groupid;
    var fun=function() {
    $.ajax({
        type: "POST",
        url: "/deleteDraw",
        cache: false,
        data: { drawId: drawId,groupId:groupId },
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            $("#results").find("#draw-" + drawId).empty();
            getNextInLine(groupId);
            getToplist(groupId);
        },
        error: function (data, status, jqxhr) {
            popup("#popup", "Ta bort spel", "Ett Tekniskt fel har inträffat, försök igen senare!");
        }
    });
}

dialog("#yes-no", "Ta bort Spel",
"Är du säker på att du vill ta bort spelet?",
{ text: "Ja", func: fun },
{ text: "Nej", func: function () { return; } })



}
