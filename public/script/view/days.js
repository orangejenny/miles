/*
    List of days and associated workouts.
*/
define([
    "underscore",
    "text!template/day.html",
    "util/day",
], function(
    _,
    day,
    util,
undefined) {
    var render = function(json) {
        var list = document.getElementById("days"),
            template = _.template(day);
        list.innerHTML = '';
        for (var i = 0; i < json.length; i++) {
            list.innerHTML += template(_.extend(json[i], {
                FORMATTED_DAY: util.formattedDay(json[i].DAY),
            }));
        }
    };

    return {
        render: render,
    };
});
