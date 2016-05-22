/*
    Utility functions related to workouts.
*/
define([
    "underscore",
], function(
    _,
undefined) {
    var days = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];
    var months = [undefined, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    var formattedDay = function(ymdString) {
        var date = new Date(ymdString);
        return days[date.getDay()] + ', ' + months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
    };

    return {
        formattedDay: formattedDay,
    };
});
