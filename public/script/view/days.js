/*
    List of days and associated workouts.
*/
define([
    "underscore",
    "text!template/day.html",
], function(
    _,
    day,
undefined) {
    var render = function(json) {
        var list = document.getElementById("days"),
            template = _.template(day);
        list.innerHTML = '';
        for (var i = 0; i < json.length; i++) {
            list.innerHTML += template(json[i]);
        }
    };

    return {
        render: render,
    };
});
