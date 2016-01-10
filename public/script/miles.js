document.addEventListener('DOMContentLoaded', function() {
    d3.json("data.pl", function(error, json) {
        if (error) {
            throw error;
        }
        json = _.map(json, function(day) {
            day.WORKOUTS = _.map(day.WORKOUTS, function(w) {
                var text = w.ACTIVITY;
                if (w.SETS) {
                    text += " " + w.SETS + " x";
                }
                if (w.REPS) {
                    text += " " + w.REPS;
                    if (w.DISTANCE || w.TIME) {
                        text += " x";
                    }
                }
                if (w.DISTANCE) {
                    text += " " + w.DISTANCE + " " + w.UNIT;
                    if (w.TIME) {
                        text += " in"
                    }
                }
                if (w.TIME) {
                    text += " " + timeToString(w.TIME);
                    if (mightHavePace(w) && w.DISTANCE) {
                        var pace = w.TIME / w.DISTANCE;
                        if (w.ACTIVITY === "erging") {
                            if (w.UNIT === "km") {
                                pace = pace / 2;
                            }
                        }
                        text += " (" + timeToString(pace) + ")";
                    }
                }
                if (w.WEIGHT) {
                    text += " @ " + w.WEIGHT + "lb";
                }
                w.DESCRIPTION = text.trim();
                return w;
            });
            return day;
        });
        generateList(json);
        generateCalendar(json);
    });

    var workoutIndex = 1;
    addBlankWorkout(0);
    document.getElementById("add-workout").addEventListener("click", function() {
        addBlankWorkout(workoutIndex);
        workoutIndex++;
    });
});

function addBlankWorkout(index) {
    var workoutTemplate = document.querySelector("script[type='text/template'][name='blank-workout']");
    workoutTemplate = _.template(workoutTemplate.innerHTML);
    document.querySelector("#new-day .workouts").innerHTML += workoutTemplate({ index: index });
}

function generateList(days) {
    var list = document.getElementById("day-list");
    var template = document.querySelector("script[type='text/template'][name='day']");
    template = _.template(template.innerHTML);
    for (var i = 0; i < days.length; i++) {
        list.innerHTML += template(days[i]);
    }
}

// what about swimming?
function mightHavePace(workout) {
    var a = workout.ACTIVITY;
    return a === "erging" || a === "running" || a.startsWith("bik");
}

function timeToString(time) {
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
}
