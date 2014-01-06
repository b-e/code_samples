var layOutDay = (function() {
    "use strict";
    var MAXWIDTH = 600;
    var MAXHEIGHT = 720;

    var sortEventsByStartTime = function(e1, e2) {
        if (e1.start <= e2.start) {
            return -1;
        } else {
            return 1;
        }
    };

    function preprocessEvents(events, styles) {
        var spliceIndex = [];
        for (var i= 0; i < events.length; i++) {
            styles[i] = {
                width: -1,
                left: -1
            }
            if (events[i].start && events[i].end) {
                if (!(events[i].end > MAXHEIGHT) && !(events[i].start < 0) && !(events[i].start >= events[i].end)) {
                    events[i].id = i-spliceIndex.length;
                } else {
                    spliceIndex.push(i);
                }
            } else {
                spliceIndex.push(i);
            }
        }

        for (var i = 0; i < spliceIndex.length; i++) {
            events.splice(spliceIndex[i]-i, 1);
            styles.splice(spliceIndex[i]-i, 1);
        }

    }

    function checkConflict(e1, e2) {
        if ((e1.start < e2.end) && (e2.start < e1.end)) {
            return true;
        }
        return false;
    }

    function conflictInColumn (e1, events) {
        for (var i = 0; i < events.length; i++){
            if (checkConflict(e1, events[i])) {
                return true;
            }
        }
        return false;
    }

    //for each event, associate the conflicting events
    function buildConflictArray(events, conflicts) {
        for (var i = 0; i < events.length; i++) {
            for (var k = i+1; k < events.length; k++) {
                if (checkConflict(events[i], events[k])) {
                    if (conflicts[i]) {
                        conflicts[i].push(events[k].id);
                    } else {
                        conflicts[i] = [events[k].id];
                    }

                    if (conflicts[k]) {
                        conflicts[k].push(events[i].id);
                    } else {
                        conflicts[k] = [events[i].id];
                    }
                }
            }
        }
    }

    //build an array that represents the column structure of the final calendar grid
    function buildColumns(events, columns){
        var inserted = false;
        for (var i = 1; i < events.length; i++) {
            for (var k = 0; k < columns.length; k++) {
                if (!conflictInColumn(events[i], columns[k])) {
                    columns[k].push(events[i]);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                columns.push([events[i]]);
            }
            inserted = false;
        }
    }

    //build a data structure (times) containing an array of conflicting events per start time
    function buildTimes(events, times) {
        var conflictEvents = [];
        for (var i = 0; i < events.length; i++) {

            conflictEvents.unshift(events[i].id);
            for (var j = i-1; j > -1; j--) {
                if (events[j].end > events[i].start) {
                    conflictEvents.unshift(events[j].id);
                }
            }
            times[i] = {
                start: events[i].start,
                events: conflictEvents
            }

            conflictEvents = [];
        }
    }

    var sortTimesByConflicts = function(t1, t2) {
        if (t1.events.length >= t2.events.length) {
            return -1;
        } else {
            return 1;
        }
    }

    function assignWidthToConflicts(id, width, conflicts, events, styles) {
        var row = conflicts[id];
        console.log(row);
        if (row) {
            for (var i = 0; i < row.length; i++) {
                if (styles[row[i]].width == -1) {
                    styles[row[i]].width = width;
                    styles[row[i]].id = row[i];
                    styles[row[i]].top = events[row[i]].start;
                    styles[row[i]].height = events[row[i]].end - events[row[i]].start;
                    assignWidthToConflicts(row[i], width, conflicts, events, styles);
                }
            }
        }
    }

    function setWidths(times, styles, conflicts, events) {
        for (var i = 0; i < times.length; i++) {
            var evs = times[i].events;
            console.log(evs);
            for (var j = 0; j < evs.length; j++) {

                if (styles[evs[j]].width == -1) {
                    styles[evs[j]].width = MAXWIDTH / evs.length;
                    styles[evs[j]].id = evs[j];
                    styles[evs[j]].top = events[evs[j]].start;
                    styles[evs[j]].height = events[evs[j]].end - events[evs[j]].start;
                    assignWidthToConflicts(evs[j], styles[evs[j]].width, conflicts, events, styles);
                }
            }
        }
    }

    //set left positions based on the previously defined columns grid and widths
    function setLeftPositions(columns, styles) {
        for (var i = 0; i < columns.length; i++) {
            var confs = columns[i];
            for (var k = 0; k < confs.length; k++) {
                styles[confs[k].id].left = styles[confs[k].id].width * i;
            }
        }
    }

    return function(events) {
        //styles is the array that is going to contain the information to position the events
        var styles = [];
        $('.calendar-content').html('');

        events.sort(sortEventsByStartTime);
        //check right timing, assign ids to events and initialize styles
        preprocessEvents(events, styles);

        //for each event, associate the list of conflicts
        var conflicts = [];
        buildConflictArray(events, conflicts);

        //array that is going to contain the columns grid structure
        var columns = [];
        columns.push([events[0]]);
        buildColumns(events, columns);

        //list of conflicting events per start time
        var times = [];
        buildTimes(events, times);

        //sort (start) times by number of conflicts
        times.sort(sortTimesByConflicts);

        setWidths(times, styles, conflicts, events);
        setLeftPositions(columns, styles);

        //put events in DOM
        $.each(events, function(i, event) {
            $('.calendar-content').append("<div class='event' id="+i+"><p class='title'>Sample Item</p><p class='description'>Sample Location</p></div>");
            $('#'+i).css(styles[event.id]);
        })

    }

})();

(function randomTester() {
    var eventsNum = Math.floor(Math.random()*15) + 5;
    var eventStart = 1000;
    var eventEnd = 1000;
    var events = [];

    do {

        do {
            eventStart = Math.floor(Math.random()*1000);
        } while (eventStart > 720)

        do {
            eventEnd = Math.floor(Math.random()*1000);
        } while ((eventEnd < eventStart) || (eventEnd > 720))

        events.push({
            start: eventStart,
            end: eventEnd
        });

        eventsNum--;
        eventStart = 1000;
        eventEnd = 1000;

    } while (eventsNum > 0)

    layOutDay(events);
})();