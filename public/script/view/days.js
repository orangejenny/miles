/*
    List of days and associated workouts.
*/
define([
    "underscore",
], function(
    _,
undefined) {
    var render = function(json) {
        var list = document.getElementById("days"),
            template = document.querySelector("script[type='text/template'][name='day']");
        list.innerHTML = '';
        template = _.template(template.innerHTML);
        for (var i = 0; i < json.length; i++) {
            list.innerHTML += template(json[i]);
        }
    };

    return {
        render: render,
    };
});
