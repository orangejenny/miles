define(function() {
    var getPace = function(workout) {
        if (workout.TIME && workout.DISTANCE) {
            var pace = workout.TIME / workout.DISTANCE;
            if (workout.ACTIVITY === "erging") {
                // Paces for m workouts are given in km
                if (workout.UNIT === "m") {
                    pace = pace * 1000;
                }
                // Paces for ergs are per 500m, not 1k
                if (workout.UNIT === "km" || workout.UNIT === "m") {
                    pace = pace / 2;
                }
            }
            return timeToString(pace);
        }
        return "";
    };

    var stringToTime = function(string) {
        var time = 0;
        var factor = 1;
        var pieces = string.split(":");
        for (var i = pieces.length - 1; i >= 0; i--) {
            time += pieces[i] * factor;
            factor *= 60;
        }
        return time;
    };
    
    var timeToString = function(time) {
        var hours = Math.floor(time / 3600);
        var minutes = Math.floor((time - hours * 3600) / 60);
        var seconds = time % 60;
        var text = "";
        if (hours > 0) {
            text += hours + ":" 
            if (minutes < 10) {
                text += "0";
            }
        }
        text += minutes + ":";
        if (seconds < 10) {
            text += "0" 
        }
        text += Math.round(seconds * 10) / 10;  // at most one decimal
        return text;
    };

    return {
        getPace: getPace,
        stringToTime: stringToTime,
        timeToString: timeToString,
    };
});
