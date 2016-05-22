/*
    Utility functions related to workouts.
*/
define([
    "underscore",
], function(
    _,
undefined) {
    var days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    var formattedDay = function(ymdString) {
        var parts = ymdString.split(/\D/);
        var date = new Date(parts[0], parts[1] - 1, parts[2]);
        return days[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
    };

    return {
        formattedDay: formattedDay,
    };
});
