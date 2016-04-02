// ==UserScript==
// @name         Robin Autovoter
// @namespace    http://jerl.im
// @version      2.07
// @description  Autovotes via text on /r/robin
// @author       /u/GuitarShirt and /u/keythkatz
// @match        https://www.reddit.com/robin*
// @grant        none
// ==/UserScript==
/* jshint esnext: true */

function sendMessage(message){
    $("#robinSendMessage > input[type='text']").val(message);
    $("#robinSendMessage > input[type='submit']").click();
}

function updateStatistics(config)
{
    // TODO: Grab the timestamp out of this to update a countdown timer

    if('undefined' !== typeof config['robin_user_list'])
    {
        var robinUserList = config.robin_user_list;
        var totalUsers = robinUserList.length;
        var increaseVotes = robinUserList.filter(function(voter){return voter.vote === "INCREASE";}).length;
        var abandonVotes = robinUserList.filter(function(voter){return voter.vote === "ABANDON";}).length;
        var abstainVotes = robinUserList.filter(function(voter){return voter.vote === "NOVOTE";}).length;
        var continueVotes = robinUserList.filter(function(voter){return voter.vote === "CONTINUE";}).length;
        var abstainPct = (100 * abstainVotes / totalUsers).toFixed(2);
        var increasePct = (100 * increaseVotes / totalUsers).toFixed(2);
        var abandonPct = (100 * abandonVotes / totalUsers).toFixed(2);
        var continuePct = (100 * continueVotes / totalUsers).toFixed(2);

        // Don't ever send messages. I'm tired of the spam D:
        if(false)
        {
            sendMessage("[CHANNEL STATS] " + totalUsers + " USERS | " + increasePct + "% GROW | " + continuePct + "% STAY | " + abandonPct + "% ABANDON | " + abstainPct + "% ABSTAIN");
        }

        // Update the div with that data
        $('#totalUsers').html(totalUsers);

        $('#increaseVotes').html(increaseVotes);
        $('#continueVotes').html(continueVotes);
        $('#abandonVotes').html(abandonVotes);
        $('#abstainVotes').html(abstainVotes);

        $('#increasePct').html("(" + increasePct + "%)");
        $('#continuePct').html("(" + continuePct + "%)");
        $('#abandonPct').html("(" + abandonPct + "%)");
        $('#abstainPct').html("(" + abstainPct + "%)");
    }
}

function parseStatistics(data)
{
    // Setup the recursion at the top so we can just return
    //   at failtime.
    setTimeout(generateStatisticsQuery, 60 * 1000);

    // There is a call to r.setup in the robin HTML. We're going to try to grab that.
    //   Wish us luck!
    var START_TOKEN = "<script type=\"text/javascript\" id=\"config\">r.setup(";
    var END_TOKEN = ")</script>";

    // If we can't locate the start token, don't bother to update this.
    //   We'll try again in 60 seconds
    var index = data.indexOf(START_TOKEN);
    if(index == -1)
    {
        return;
    }
    data = data.substring(index + START_TOKEN.length);

    index = data.indexOf(END_TOKEN);
    if(index == -1)
    {
        return;
    }
    data = data.substring(0,index);

    // This will throw on failure
    var config = JSON.parse(data);

    updateStatistics(config);
}

function generateStatisticsQuery()
{
    // Query for the userlist
    $.get("/robin",parseStatistics);
}

(function(){
    // The first thing we do is setup a timer to reload the page.
    //   Hopefully this will save us if the CDN dies again >.>
    // 5 Minutes after we join: reload the page
    setTimeout(function(){
        window.location.reload();
    }, 5 * 60 * 1000);

    // Insert the statistics widget
    if($('#robinStatusWidget').length === 0)
    {
        // TODO: This needs some stylesheet love
        $("#robinDesktopNotifier").after(
            "<div id='robinStatusWidget' class='robin-chat--sidebar-widget'>" +
            "<table style='font-size: 14px;'>" +
            "<tr>" +
            "<td style='padding-right: 3px;'>Total</td>" +
            "<td id='totalUsers'></td>" +
            "<td></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='robin--vote-class--increase'><span class='robin--icon'></span></td>" +
            "<td id='increaseVotes'></td>" +
            "<td id='increasePct'></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='robin--vote-class--continue'><span class='robin--icon'></span></td>" +
            "<td id='continueVotes'></td>" +
            "<td id='continuePct'></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='robin--vote-class--abandon'><span class='robin--icon'></span></td>" +
            "<td id='abandonVotes'></td>" +
            "<td id='abandonPct'></td>" +
            "</tr>" +
            "<tr>" +
            "<td class='robin--vote-class--novote'><span class='robin--icon'></span></td>" +
            "<td id='abstainVotes'></td>" +
            "<td id='abstainPct'></td>" +
            "</tr>" +
            "</table>" +
            "</div>");
    }

    // Immediately trigger the statistics loop.
    generateStatisticsQuery();

    // 5 Seconds after we join, vote
    setTimeout(sendMessage("/vote grow"), 5 * 1000);
})();
