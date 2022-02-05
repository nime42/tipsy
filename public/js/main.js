
function logInOut() {
    if($("#log-in-out").find("span").text()==="Logga in") {
        login();
    } else {
        logout();
    }   
}

function toggleLogInOutButton() {
    if($("#log-in-out").find("span").text()==="Logga in") {
        $("#log-in-out").find("span").text("Logga ut");      
    } else {
        $("#log-in-out").find("span").text("Logga in");       
    }   
    $("#log-in-out").find("i").toggleClass("fa-sign-in fa-sign-out");  
}


function login() {
    showModal("#basic-modal", hbsTemplates["main-snippets"]["login"]());
    $("#basic-modal").find("#log-in").click(function (e) {
        var loginInfo = collectLoginInfo("#basic-modal");
        if (loginInfo !== null) {
            $.ajax({
                type: "POST",
                url: "/login",
                cache: false,
                data: loginInfo,
                success: function (data, status, jqxhr) {
                    hideModal("#basic-modal");
                    toggleLogInOutButton();
                    initApp();
                },
                error: function (data, status, jqxhr) {
                    if (data.status === 401) {
                        modalPopUp("#popup", "Inloggning", "Ogiltigt användarnamn eller lösenord!!!");

                    } else {
                        modalPopUp("#popup", "Inloggning", "Just nu går det inte att logga in, försök senare!");

                    }
                }

            });
        }
    });

    $("#basic-modal").find('#forgot-password').click(function (e) {
        forgotPassword(e);
    });

}

function logout() {
    $.ajax({
        url: "/logout",
        cache: false,
        success: function (data, status, jqxhr) {
            deleteCookie("SessId");
            window.location.href = window.location.pathname;
            toggleLogInOutButton();
            //window.location.reload();
        }
    });
}


function demoLogin() {
    $.ajax({
        type: "GET",
        url: "/demoLogin",
        cache: false,
        success: function (data, status, jqxhr) {
            hideModal("#basic-modal");
            toggleLogInOutButton();
            initApp();
        },
        error: function (data, status, jqxhr) {
                modalPopUp("#popup", "Inloggning", "Just nu går det inte att logga in, försök senare!");
            }
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
                modalPopUp("#popup", "Ny grupp", "Grattis du är nu medlem i gruppen: " + groupName);
                initGroups();
            }
        });
    }
}


function forgotPassword(e) {
    data = {};
    showModal("#basic-modal", hbsTemplates["main-snippets"]["forgot-password"]());

    $("#basic-modal").find(".send-password").click(function (e) {
        var buttonId = $(this).attr('id');
        var identityType;
        var identity;
        if (buttonId === "send-mail-for-mail-adr") {
            identityType = "by-mail-adress";
            identity = $("#basic-modal").find("#email").val().trim();
            if (identity === "" || !identity.match(/^[^@]+@[^@]+\.[^@]+$/)) {
                modalPopUp("#popup", "Glömt lösenord", "Mailadress saknas eller verkar vara ogiltig!!");
                return;
            }
        } else if (buttonId === "send-mail-for-userid") {
            identityType = "by-user-id";
            identity = $("#basic-modal").find("#userid").val().trim();
            if (identity === "") {
                modalPopUp("#popup", "Glömt lösenord", "Användarnamn saknas!!");
                return;
            }
        } else {
            modalPopUp("#popup", "Glömt lösenord", "Ett tekniskt fel har inträffat!");

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
                hideModal("#basic-modal");
                modalPopUp("#popup", "Glömt lösenord", "Mail med länk för återställning av lösenord skickat!\nKontrollera din inkorg om en stund.");
            },
            error: function (data, status, jqxhr) {
                if (data.status === 404) {
                    if (identityType === "by-mail-adress") {
                        modalPopUp("#popup", "Glömt lösenord", "Det finns ingen användare med denna mail-adress!!");
                    } else {
                        modalPopUp("#popup", "Glömt lösenord", "Det finns ingen användare med detta användarnamn!!");
                    }
                } else {
                    modalPopUp("#popup", "Glömt lösenord", "Det gick inte att skicka återställnings-mailet!!");
                }
            }
        });




    });



}

function resetPassword(resetToken) {
    showModal("#basic-modal", hbsTemplates["main-snippets"]["reset-password"]());
    $("#basic-modal").find("#reset-passw").click(function (e) {
        var password = $("#basic-modal").find("#password").val().trim();
        var pwd2 = $("#basic-modal").find("#password2").val().trim();

        if (password === "") {
            modalPopUp("#popup", "Återställ lösenord", "Lösenord saknas!!!");
            return false;
        }


        if (password !== pwd2) {
            modalPopUp("#popup","Återställ lösenord", "Lösenorden stämmer inte överens!!");
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
                hideModal("#basic-modal");
                modalPopUp("#popup", "Återställ lösenord", "Lösenordet är uppdaterat");
                removeUrlVars();
                initApp();
                

            },
            error: function (data, status, jqxhr) {
                if (data.status === 404) {
                    modalPopUp("#popup","Återställ lösenord", "Det gick inte att uppdatera lösenordet");
                } else {
                    modalPopUp("#popup", "Återställ lösenord","Ett Tekniskt fel har inträffat, försök igen senare!");
                }
            }
        });
        return false;
    })

}



function initApp() {
    $("#info").hide();
    initUser();
    initGroups();
    $("#menu-items").show(); //$('.navbar-collapse').collapse('hide');
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
        if(data.approvedgroups && data.approvedgroups.length>0) {
            let message="Grattis, du är nu medlem i följande nya grupper:<br/>"+data.approvedgroups.map(function(e) {return e.groupname;}).join("<br/>");
            modalPopUp("#popup","Din ansökan är godkänd",message);
        }

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

        if(globals.usergroups.length===0) {
            $("#start-info").show();
        }

        for (var i = 0; i < globals.usergroups.length; i++) {
            $('#available-groups').append($('<option>', { value: globals.usergroups[i].groupid, text: globals.usergroups[i].groupname }));
        }


        $('#available-groups').unbind("change");
        $('#available-groups').change(function () {
            var selected = $(this).find("option:selected").val();

            if( $("#myTopnav").hasClass("responsive")) {
                toggleMenu();
            }


            globals.activeGroup = {};
            for (var i = 0; i < globals.usergroups.length; i++) {
                if (globals.usergroups[i].groupid == selected) {
                    globals.activeGroup = globals.usergroups[i];
                    window.history.replaceState(null, null, "?active-group="+selected);
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

        if(globals.lastGroup) {
            var g=globals.usergroups.find(function(g) {return g.groupid==globals.lastGroup});
            if(g) {
                globals.activeGroup=g;    
            }
            globals.lastGroup=undefined;
        }



        if ((globals.activeGroup.groupid === undefined && globals.usergroups.length > 0) || globals.newGroupAdded) {
            globals.activeGroup = globals.usergroups[0];
        }


        if(globals.newGroupAdded) {
            globals.newGroupAdded=undefined;
            $("#start-info").hide();
            configureGroupMembers();
        }


        if (globals.activeGroup.groupid ) {
            $('#available-groups').val(globals.activeGroup.groupid).trigger("change");
        }

    });



}



function configureUser() {

    if (!globals.userinfo) {
        showModal("#basic-modal", hbsTemplates["main-snippets"]["user-info"]({ register: true }));
        $("#basic-modal").find("#reg-or-update").click(function (e) {
            var userInfo = collectUserInfo("#basic-modal", true);
            if (userInfo !== null) {
                $.ajax({
                    type: "POST",
                    url: "/register",
                    cache: false,
                    data: userInfo,
                    success: function (data, status, jqxhr) {
                        //reloadIfLoggedOut(jqxhr);
                        hideModal("#basic-modal");
                        toggleLogInOutButton();
                        initApp();
                    },
                    error: function (data, status, jqxhr) {
                        console.log(data, status, jqxhr);
                        if (data.status === 403) {
                            modalPopUp("#popup","Användarinfo", "Användarnamnet finns redan!");
                        } else {
                            modalPopUp("#popup","Användarinfo", "Ett Tekniskt fel har inträffat, försök igen senare!");
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
                showModal("#basic-modal", hbsTemplates["main-snippets"]["user-info"](data));
                $("#basic-modal").find("#reg-or-update").click(function (e) {
                    if(isDemo()) {
                        modalPopUp("#popup","Demo", "Detta går inte att uppdatera användarinfo när man är i demo-läge!");
                        return;
                    }

                    var userInfo = collectUserInfo("#basic-modal");
                    if (userInfo !== null) {
                        $.ajax({
                            type: "POST",
                            url: "/updateUserInfo",
                            cache: false,
                            data: userInfo,
                            success: function (data, status, jqxhr) {
                                reloadIfLoggedOut(jqxhr);
                                hideModal("#basic-modal");
                                initApp();
                            },
                            error: function (data, status, jqxhr) {
                                modalPopUp("#popup","Användarinfo", "Ett Tekniskt fel har inträffat, försök igen senare!");
                            }
                        });
                    }
                });

            }
        });
    }
}


function configureGroups(showApplyTab=false) {
    data = globals.usergroups.filter(function (e) { return e.admin == 1; });


    showModal("#basic-modal", hbsTemplates["main-snippets"]["groups"](data));
    if(showApplyTab) {
        $("#basic-modal").find("#tabbed2").prop("checked", true);    
    }

    $("#basic-modal").find("#add-group").click(function (e) {
        var newGroup = $("#basic-modal").find("#new-group").val().trim();
        if (newGroup === "") {
            modalPopUp("#popup","Skapa grupp", "Gruppnamn saknas!");
            return;
        }

        if(isDemo()) {
            modalPopUp("#popup","Demo", "Detta går inte att skapa grupper när man är i demo-läge!");
            return;
        }        
        $.ajax({
            type: "POST",
            url: "/createGroup",
            cache: false,
            data: { groupName: newGroup },
            success: function (data, status, jqxhr) {
                reloadIfLoggedOut(jqxhr);
                $("#basic-modal").find("#new-group").val("");
                globals.newGroupAdded=true;
                initGroups();
                hideModal("#basic-modal");
                modalPopUp("#popup", "Skapa grupp", "Grupp skapad!<br>Glöm inte att bjuda in dina vänner!");
            },
            error: function (data, status, jqxhr) {
                if (data.status === 403) {
                    modalPopUp("#popup","Skapa grupp", "Gruppen finns redan!");

                } else {
                    modalPopUp("#popup","Skapa grupp", "Ett Tekniskt fel har inträffat, försök igen senare!");
                }
            }
        });

    });

    var autoComp=function(val,display) {
        if(val.length>0) {
            $.ajax({
                type:"POST",
                url: "/searchGroups",
                data: { searchVal: val },
                cache: false,
                success: function (data, status, jqxhr) {
                    display(data.map(function(d) {return d.groupname}));
                }
            });
        } else {
            display([]);
        }
    }
    initAutoComplete($("#basic-modal").find("#apply-group"),autoComp);

    $("#basic-modal").find("#apply-membership").click(function(e) {
        if(isDemo()) {
            modalPopUp("#popup","Demo", "Det går inte att ansöka om medlemskap när man är i demo-läge!");
            return;
        }
        var groupName=$("#basic-modal").find("#apply-group").val().trim();
        if(groupName!="") {
            $.ajax({
                type:"POST",
                url: "/applyForMembership",
                data: { groupName: groupName },
                cache: false,
                success: function (data, status, jqxhr) {
                    modalPopUp("#popup","Medlemskap", "Din ansökan är skickad!<br/>Du får åtkomst till gruppen när du blivit godkänd av grupp-ägaren.");
                },
                error: function (data, status, jqxhr) {
                    if (data.status === 404) {
                        modalPopUp("#popup","Medlemskap", "Hittar inte gruppen!<br/>Kontrollera att namnet är rättstavat!");
    
                    } else if (data.status === 409) {
                        modalPopUp("#popup","Medlemskap", "Du är redan medlem i denna grupp!");

                    } else {
                        modalPopUp("#popup","Medlemskap", "Det gick inte att skicka ansökan!<br/>Ett tekniskt fel har inträffat!");
                    }
                }
            });
        } else {
            modalPopUp("#popup","Ansök om medlemskap", "Ange vilken grupp du vill bli medlem i!");

        }

    })

}

function showEditGroupWindow(groupId,divElem) {
    let hbParams={};
    hbParams.groupName=divElem.find(".group-name").val();
    hbParams.allowExtraGames=divElem.find(".allow-extra-games").val();

    showModal("#another-modal", hbsTemplates["main-snippets"]["edit-group"](hbParams));
    $("#another-modal").find("#save").click(function (e) {
        let newGroupName=$("#another-modal").find("#group-name").val().trim();
        let allowExtraGames=$("#another-modal").find("#allow-extra-games").prop("checked")?1:0;

        $.ajax({
            type: "POST",
            url: "/updateGroup",
            cache: false,
            data: { groupId: groupId, groupName: newGroupName,allowExtraGames:allowExtraGames },
            success: function (data, status, jqxhr) {
                reloadIfLoggedOut(jqxhr);
                divElem.find(".group-name").val(newGroupName);
                divElem.find(".allow-extra-games").val(allowExtraGames);
                hideModal("#another-modal");
                initGroups();
            },
            error: function (data, status, jqxhr) {
                if (data.status === 403) {
                    modalPopUp("#popup", "Uppdatera grupp", "Gruppen finns redan!");
                } else {
                    modalPopUp("#popup", "Uppdatera grupp", "Ett Tekniskt fel har inträffat, försök igen senare!");
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
                modalPopUp("#popup", "Uppdatera grupp", "Gruppen finns redan!");
            } else {
                modalPopUp("#popup", "Uppdatera grupp", "Ett Tekniskt fel har inträffat, försök igen senare!");
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
                modalPopUp("#popup", "Ta bort grupp", "Ett Tekniskt fel har inträffat, försök igen senare!");
            }
        });
    }

    modalDialog("#yes-no", "Ta bort Grupp",
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
        modalPopUp("#popup", "Visa Medlemmar", "Välj grupp först!");
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
                if ((isAdmin && e.userid !== globals.userinfo.userid) || (!isAdmin && e.userid == globals.userinfo.userid )) {
                    e.isDeletable = true;
                }
                return e;
            })

            var applications=data.applications.map(function(e) {
                var a=e.username;
                if(e.name!=="") {
                    a=e.name;
                }
                if(e.email!=="") {
                    a+=" ("+e.email+")";
                }
                return {applicant:a,userid:e.userid,groupid:e.groupid};
            });
            if(applications.length===0) {
                applications=undefined;
            }

            showModal("#basic-modal", hbsTemplates["main-snippets"]["group-members"]({ members: data.members, admin: globals.activeGroup.admin, invites: data.invites, applications: applications, currentUser: globals.userinfo.userid }));

            $("#basic-modal").find("#invite-member").click(function (e) {
                var inviteEmail = $("#basic-modal").find("#invite-email").val().trim();
                if (inviteEmail === "" || !inviteEmail.match(/^[^@]+@[^@]+\.[^@]+$/)) {
                    modalPopUp("#popup", "Skicka inbjudan", "Mailadress saknas eller verkar vara ogiltig!!");
                    return false;
                }


                $.ajax({
                    type: "POST",
                    url: "/inviteMemberToGroup",
                    cache: false,
                    data: { email: inviteEmail, groupId: globals.activeGroup.groupid },
                    success: function (data, status, jqxhr) {
                        reloadIfLoggedOut(jqxhr);
                        //var row = "<p style='margin-bottom:0px;'>" + inviteEmail + "<span style='color:red;' class='glyphicon glyphicon-remove' onclick='removeInvite(\"" + inviteEmail + "\",$(this).parent());'></span></p>";
                        var row = '<tr><td style="padding-left: 5px;">'+inviteEmail+'</td><td><i style="color:red;font-size:14px;" class="fa fa-remove" onclick="removeInvite(\''+inviteEmail+'\',$(this).parent().parent())"></i></td></tr>';
                        $("#basic-modal").find("#invites").find("#empty-row").remove();
                        $("#basic-modal").find("#invites").prepend(row);
                        $("#basic-modal").find("#invite-email").val("");
                    },
                    error: function (data, status, jqxhr) {
                        if (data.status === 403) {
                            modalPopUp("#popup", "Skicka inbjudan", "Inbjudan finns redan!");
                        } else {
                            modalPopUp("#popup", "Skicka inbjudan", "Tekniskt fel!");
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
            showModal("#basic-modal", hbsTemplates["main-snippets"]["payment"](data));
            $('.amount-per-member').text(Number(data.surplus/data.nrOfMembers).toFixed(2)+' kr')
        }
    });
}

function makePayment(amount,surplus,sendMail) {
    var groupId = globals.activeGroup.groupid;
    var res={};

    if(amount<=0) {
        modalPopUp("#popup", "Utbetalning", "Summan måste vara större än noll!");
        return;
    } 

    if(amount>surplus) {
        modalPopUp("#popup", "Utbetalning", "Maximalt belopp som går att utbetala är:"+surplus+" kr!");
        return;

    }
    res.amount=amount;
    res.groupId=groupId;
    if(sendMail) {
        res.mailTo=globals.userinfo.email;
        res.mailBody=hbsTemplates["main-snippets"]["payment-mail-template"]({amount:amount,tablebody:$("#basic-modal").find("#payment-div").html()});
    }
    //console.log(res.mailBody);

    $.ajax({
        url: "/makePayment",
        type: "POST",
        cache: false,
        data: res,
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            hideModal("#basic-modal");
            modalPopUp("#popup", "Utbetalning", "Utbetalning registrerad!");
            initGroups();
        },
        error: function (data, status, jqxhr) {
            if (data.status === 400) {
                modalPopUp("#popup", "Utbetalning", "Maximalt belopp som går att utbetala är:"+surplus+" kr!");
        
            } else if(data.status === 406) { 
                modalPopUp("#popup", "Utbetalning", "Utbetalning registrerad men det gick ej att skicka mail!");
            } else {
                modalPopUp("#popup", "Utbetalning", "Tekniskt fel!");
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

function removeApplicant(userId, rowElem) {
    $.ajax({
        type: "POST",
        url: "/removeApplicant",
        cache: false,
        data: { userId:userId, groupId: globals.activeGroup.groupid },
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            rowElem.remove();
        },
        error: function (data, status, jqxhr) {
            popup("#popup", "Ta bort ansökan", "Tekniskt fel!");
        }
    });
}

function addApplicant(userId) {
    $.ajax({
        type: "POST",
        url: "/approveApplicant",
        cache: false,
        data: { userId:userId, groupId: globals.activeGroup.groupid },
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            configureGroupMembers();
        },
        error: function (data, status, jqxhr) {
            popup("#popup", "Lägg till ansökande", "Tekniskt fel!");
        }
    });
}

function removeMember(memberId, groupId, rowElem) {
    var fun = function () {

        if(isDemo()) {
            modalPopUp("#popup","Demo", "det går inte att lämna en grupp när man är i demo-läge!");
            return;
        }

        $.ajax({
            type: "POST",
            url: "/removeMember",
            cache: false,
            data: { member: memberId, groupId: groupId },
            success: function (data, status, jqxhr) {
                reloadIfLoggedOut(jqxhr);
                rowElem.remove();
                if (memberId == globals.userinfo.userid) {
                    location.reload();
                }
            },
            error: function (data, status, jqxhr) {
                modalPopUp("#popup", "Ta bort medlem", "Tekniskt fel!");
            }
        });
    }

    if (memberId == globals.userinfo.userid) {
        modalDialog("#yes-no", "Lämna grupp",
            "Är du säker på att du vill lämna denna gruppen?",
            { text: "Ja", func: fun },
            { text: "Nej", func: function () { return; } })
    } else {
        modalDialog("#yes-no", "Ta bort medlem",
            "Är du säker på att du vill ta bort denna medlem?",
            { text: "Ja", func: fun },
            { text: "Nej", func: function () { return; } })

    }
}


function configurePlay() {

    var groupId = globals.activeGroup.groupid;
    if (groupId === undefined) {
        modalPopUp("#popup", "Spela", "Välj grupp först!");
        return;
    }

    

    showModal("#basic-modal", hbsTemplates["main-snippets"]["play"]());

    getPlayable("stryktipset", "stryk");
    getPlayable("europatipset", "euro");
    getPlayable("topptipsetfamily", "topp");

}


function configureStatistics() {

    var groupId = globals.activeGroup.groupid;
    if (groupId === undefined) {
        modalPopUp("#popup", "Statistik", "Välj grupp först!");
        return;
    }
    $.ajax({
        url: "/getStatistics",
        type: "POST",
        cache: false,
        data: { groupId: groupId },
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            data.tot_ord_games=data.userStats.map(e=>(e.games_ord)).reduce((total,v)=>(total+v));
            data.tot_extra_games=data.userStats.map(e=>(e.games_extra)).reduce((total,v)=>(total+v));
            data.tot_ord_input=data.userStats.map(e=>(e.input_ord)).reduce((total,v)=>(total+v));
            data.tot_extra_input=data.userStats.map(e=>(e.input_extra)).reduce((total,v)=>(total+v));
            data.tot_win_brutto=data.userStats.map(e=>(e.win_brutto)).reduce((total,v)=>(total+v));
            data.tot_win_netto=data.userStats.map(e=>(e.win_netto)).reduce((total,v)=>(total+v));
            data.tot_average_stryktips=data.userStats.map(e=>(e.average_stryktips!=="-"?e.average_stryktips:0)).reduce((total,v)=>(total+v))/data.userStats.length;
            data.tot_average_stryktips=data.tot_average_stryktips.toFixed(2);
            data.tot_average_topptips=data.userStats.map(e=>(e.average_topptips!=="-"?e.average_topptips:0)).reduce((total,v)=>(total+v))/data.userStats.length;
            data.tot_average_topptips=data.tot_average_topptips.toFixed(2);
            showModal("#basic-modal", hbsTemplates["main-snippets"]["statistics"](data));

            let cmpFun = function (e1, e2) {
                e1 = e1.replaceAll(/\s/g, "").replace(/(\(.*kr\))|(kr$)/, "").replaceAll("−", "-");
                e2 = e2.replaceAll(/\s/g, "").replace(/(\(.*kr\))|(kr$)/, "").replaceAll("−", "-");
                if (isNaN(Number(e1)) || isNaN(Number(e2))) {
                    return e1.localeCompare(e2);
                } else {
                    return e1 - e2;
                }
            }
            initSortableTable($("#basic-modal").find('#stat-table'), {cmpFun:cmpFun,initialOrder:"asc",initialCol:1});
        }
    });


}


function configureEvents() {

    var groupId = globals.activeGroup.groupid;
    if (groupId === undefined) {
        modalPopUp("#popup", "Händelser", "Välj grupp först!");
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
                showModal("#basic-modal", hbsTemplates["main-snippets"]["events"](data));
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
                modalPopUp("#popup", "Ta bort Händelse", "Ett Tekniskt fel har inträffat, försök igen senare!");
            }
        });
    }

    modalDialog("#yes-no", "Ta bort Händelse",
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
            let drawDates=data.map(e=>{return e.productName+", "+dateFormat(e.regCloseTime,"YYYY-MM-DD")});
            reloadIfLoggedOut(jqxhr);
            $("#basic-modal").find("#" + div).prepend(hbsTemplates["main-snippets"]["matches"]({drawDates:drawDates,draw:data[0]}));

            $("#basic-modal").find("#" + div).find("#draw-selector").data("draws",data);
            $("#basic-modal").find("#" + div).find("#draw-selector").change(function() {
                let drawIndex=$(this).val();
                $("#basic-modal").find("#" + div).find("#draw-stop").text(dateFormat(data[drawIndex].regCloseTime,"YYYY-MM-DD hh:mm:ss"));
            
                for(let r=1;r<=data[drawIndex].draws.length;r++) {
                    $("#basic-modal").find("#" + div).find(".play-table").find("#row-"+r).find("#event-description").text(data[drawIndex].draws[r-1].eventDescription);
                }

                $("#basic-modal").find("#" + div).find("#clear").click();
            })



            $("#basic-modal").find("#" + div).find(".1x2").click(function () {
                $(this).toggleClass('on off');
                var nrOfRows = 1;
                var rows = getDrawBettings(div);
                rows.forEach(function (e) {
                    var l = e.length;
                    if (l > 0) {
                        nrOfRows *= l;
                    }

                })
                $("#basic-modal").find("#" + div).find("#nr-of-rows").text(nrOfRows);
                var notChecked = rows.indexOf("");
                if (notChecked < 0) {
                    $("#basic-modal").find("#" + div).find("#play").attr("disabled", false);
                } else {
                    $("#basic-modal").find("#" + div).find("#play").attr("disabled", true);
                }

            });
            $("#basic-modal").find("#" + div).find("#play").click(function () {
                let drawIndex=0;
                if(data.length>1) {
                    drawIndex=$("#basic-modal").find("#" + div).find("#draw-selector").val();
                }

                let drawInfo = {
                    groupid: globals.activeGroup.groupid,
                    drawnumber: data[drawIndex].drawNumber,
                    product: data[drawIndex].productName,
                    productId: data[drawIndex].productId,
                    drawstate: data[drawIndex].drawState,
                    regclosetime: data[drawIndex].regCloseTime,
                    rowprice: data[drawIndex].rowPrice,
                    extra_bet: false,
                    rows: []
                }
                let bettings = getDrawBettings(div);
                let systemsize = 1;
                for (let i = 0; i < bettings.length; i++) {
                    let row = {};
                    row.rownr = i + 1;
                    row.teams = data[drawIndex].draws[i].eventDescription;
                    row.bet = bettings[i];
                    row.matchstart=data[drawIndex].draws[i].match.matchStart;
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
                            hideModal("#basic-modal");
                            var url =
                            modalDialog("#yes-no", "Lägg spel hos Svenska spel",
                                    "Vill du gå till svenska spel och göra det faktiska spelet där?",
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
                            modalPopUp("#popup", "Spela", "Det gick inte att spela");
                        }
                    });
                }
                getUserSurplus(function (surplus) {
                    if (surplus>0 && globals.activeGroup.allowextragames===1) {
                        modalDialog("#yes-no", "Extra spel",
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
                $("#basic-modal").find("#" + div).prepend("<h2>Inget spel för tillfället!</h2>");
            } else if (data.status == 404) {
                $("#basic-modal").find("#" + div).prepend("<h2>Information saknas</h2>");
            }
        }
    });
}


function getDrawBettings(div) {
    var rows = [];
    $("#basic-modal").find("#" + div).find(".draw-row").each(function (i, e) {
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
            modalPopUp("#popup", "Uppdatera resultat", "Tekniskt fel!");
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

            data.allowExtraGames=globals.activeGroup?globals.activeGroup.allowextragames:undefined;
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
    try {
        //link is on the formathttps://spela.svenskaspel.se/topptipset?product=25&draw=1744&signs=1:12,2:1,3:X2,4:1X,5:1,6:X2,7:12,8:1X&share=valid
        let row=decodeURIComponent(link).match(/signs=([^&]*)/i)[1].split(",").map(r=>(r.split(":")[1]));
        callback(row);
    } catch(err) {
        console.log("failed to parse out row from link",link);
        callback(null);

    }
    return;
//No need to webscrape SvSp site, the link contains the row.
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


function getRowsFromClipBoard(pasteButton, targetTable,drawSelector) {

    var f=function(clipText) {
        pasteButton.attr("disabled", true);
        if (clipText.match(/http.*/i)) {
            modalPopUp("#message-popup", "Klistra in", "Hämtar rader...");
            getRowsFromLink(clipText, function (rows) {
                selectDrawFromLink(drawSelector,clipText);
                if (!pasteRows(targetTable, rows)) {
                    modalPopUp("#popup", "Klistra in", "Det gick inte att klistra in raderna");
                }
                pasteButton.attr("disabled", false);
                hideModal("#another-modal");
                hideModal("#message-popup");
            })
        } else {
            if (!pasteRows(targetTable, clipText)) {
                modalPopUp("#popup", "Klistra in", "Det gick inte att klistra in raderna");
            };
            pasteButton.attr("disabled", false);
            hideModal("#another-modal");

        }
    }


    try {
        navigator.clipboard.readText().then(
            function (clipText) { f(clipText); },
            function (rejectReason) {
                showModal("#another-modal", hbsTemplates["main-snippets"]["allow-paste-rows"]());
                $("#another-modal").find("#send-link").click(function () {
                    f($("#another-modal").find("#link-to-send").val());
                });
            }
        );
    } catch (err) {
        showModal("#another-modal", hbsTemplates["main-snippets"]["allow-paste-rows"]());
        $("#another-modal").find("#send-link").click(function () {
            f($("#another-modal").find("#link-to-send").val());
        });
    }
    return;      
}

function selectDrawFromLink(drawSelector,link) {
    if(drawSelector.length==0) {
        //We just have one draw e.g. no select-element
        return;
    }
    //the link with the draw-bettings is on the format "https://spela.svenskaspel.se/topptipset?product=25&draw=1744&signs=1%3A12%2C2%3A1%2C3%3AX2%2C4%3A1X%2C5%3A1%2C6%3AX2%2C7%3A12%2C8%3A1X&share=valid"
    let drawNumber=link.match(/.*draw=(\d+)&.*/)[1]
    if(drawNumber) {
       let draws=drawSelector.data("draws");
       let i=draws.findIndex(function(e) {return e.drawNumber==drawNumber});
       if(i>-1) {
        drawSelector.val(i).change();
       }
    }
}


function getResults(groupId,page) {
    if(page==0) {
        $("#results").empty();
        $("#no-ongoing-games").hide(); 
    }
    $.ajax({
        type: "GET",
        url: "/getResults?groupId=" + groupId+"&page="+page,
        cache: false,
        success: function (data, status, jqxhr) {
            reloadIfLoggedOut(jqxhr);
            var finalizedHeader="";
            $("#ongoing-games").text("");

            if(data.results[0]==undefined || data.results[0].drawstate=="Finalized") {
                $("#no-ongoing-games").show();            
            }
            var ongoingGames=0;
            data.results.forEach(function (e) {
                e.rows = parseRows(e.rows);
                if ((e.drawstate != "Finalized" && e.created_by == globals.userinfo.userid)||globals.activeGroup.admin===1) {
                    e.showDelete = true;
                }

                if (e.drawstate != "Finalized") {
                    ongoingGames++;
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
                    if(ongoingGames>0) {
                        $("#ongoing-games").text("("+ongoingGames+" spel)");
                    }
                }


                $("#results").append(hbsTemplates["main-snippets"]["results"](e));



            })
            $("#results").find("#more-results").remove();
            if(data.hasMorePages) {
                $("#results").append('<input type="button" id="more-results" class="round-button" value="Mer..." onclick="getResults('+groupId+','+(page+1)+')"/>');

            }
            if (globals.isRefreshing) {
                document.getElementById("top-list").scrollIntoView();
            }

            if(ongoingGames>0) {
                $("#refresh-button").fadeIn(2000);
            }
        },
        error: function (data, status, jqxhr) {
            modalPopUp("#popup", "Hämta resultat", "Tekniskt fel!");
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
            matchstart: a[5],
            matchtime:a[6],
            lastevent:a[7],
            on1: a[2].match("1") != undefined ? "on" : "off",
            onX: a[2].match("X") != undefined ? "on" : "off",
            on2: a[2].match("2") != undefined ? "on" : "off",
            status1: "",
            statusX: "",
            status2: ""
        };

        if (res.status == "-1" || res.status== "" || res.status=="Uppskjuten") {
            res.status = "Inte startat";
        }
 
        if (res.status != "Inte startat") {
            let matchResult=parseResult(res.result);
            if(res.result.match(/Lottad/)) {
                res.result="Lottad";
            }
            if (matchResult==="1") {
                if (res.on1 == "on") {
                    res.status1 = "correct";
                    res.isCorrect = true;
                } else {
                    res.status1 = "missed";
                }
            } else if (matchResult==="X") {
                if (res.onX == "on") {
                    res.statusX = "correct";
                    res.isCorrect = true;
                } else {
                    res.statusX = "missed";
                }
            } else {
                if (res.on2 == "on") {
                    res.status2 = "correct";
                    res.isCorrect = true;
                } else {
                    res.status2 = "missed";
                }
            }

            try {
                var last=new Date(res.lastevent);
                var now=new Date();
                if(((now-last)/(1000*60))<5) {
                    //If something have happend in the last 5 minutes, blink the result
                    res.blink=true;
                }  
            } catch(err) {

            }

        }

        if (res.status == "Inte startat") {
            var matchStart = new Date(res.matchstart);
            if (isNaN(matchStart.getTime())) {
                res.result = "- -";
            } else {
                var today = new Date();

                var isToday = (today.toDateString() == matchStart.toDateString());
                if (isToday) {
                    res.result = matchStart.getHours().toString().padStart(2, "0") + ":" + matchStart.getMinutes().toString().padStart(2, "0");
                } else {
                    res.result = getWeekDay(matchStart);
                }
            }
            
        } else if (res.status.match(/.*slut.*/i)) {//om status är Avslutad","Slut efter förlängning","Slut efter straffläggning" etc
            res.matchtime = "FT";
        }
        if(res.matchtime==="FT" || res.matchtime==="HT") {
            res.blink=false;
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
    var fun = function () {
        $.ajax({
            type: "POST",
            url: "/deleteDraw",
            cache: false,
            data: { drawId: drawId, groupId: groupId },
            success: function (data, status, jqxhr) {
                reloadIfLoggedOut(jqxhr);
                $("#results").find("#draw-" + drawId).empty();
                getNextInLine(groupId);
                getToplist(groupId);
                var regexResult=/\d+/.exec($("#ongoing-games").text());
                if(regexResult!=null) {
                    let ongoingGames=parseInt(regexResult[0])-1;
                    if(ongoingGames>0) {
                        $("#ongoing-games").text("("+ongoingGames+" spel)");
                    } else {
                        $("#ongoing-games").text("");
                        $("#no-ongoing-games").show(); 
                    }
                }

                
            },
            error: function (data, status, jqxhr) {
                modalPopUp("#popup", "Ta bort spel", "Ett Tekniskt fel har inträffat, försök igen senare!");
            }
        });
    }

    modalDialog("#yes-no", "Ta bort Spel",
        "Är du säker på att du vill ta bort spelet?",
        { text: "Ja", func: fun },
        { text: "Nej", func: function () { return; } })



}

function showPastingRowsInfo() {
    showModal("#another-modal", hbsTemplates["main-snippets"]["paste-rows"]);
}

function showUserTerms() {
    showModal("#another-modal", hbsTemplates["main-snippets"]["user-terms"]);
}

function showMoreInfo() {
    showModal("#basic-modal", hbsTemplates["main-snippets"]["more-info"]);
}

function showContact() {
    showModal("#basic-modal", hbsTemplates["main-snippets"]["contact"]);
}