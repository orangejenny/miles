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
                    var pace = getPace(w);
                    if (pace) {
                        text += " (" + pace + ")";
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

    updateDayOfWeek();
    _.each(document.querySelectorAll("#new-day legend input"), function(i) {
        i.addEventListener("blur", updateDayOfWeek);
    });

    document.querySelector(".add-day button").addEventListener("click", function() {
        document.querySelector(".add-day").style.display = "none";
        document.querySelector(".not-legend").style.display = "block";
    });
    document.querySelector("#cancel").addEventListener("click", function() {
        document.querySelector(".add-day").style.display = "block";
        document.querySelector(".not-legend").style.display = "none";
    });
});

function getPace(workout) {
    if (workout.TIME && workout.DISTANCE) {
        var pace = workout.TIME / workout.DISTANCE;
        if (workout.ACTIVITY === "erging") {
            if (workout.UNIT === "km") {
                pace = pace / 2;
            }
        }
        return timeToString(pace);
    }
    return "";
}

function updatePace(input) {
    var parent = input;
    while (parent !== document && !parent.classList.contains("workout-row")) {
        parent = parent.parentElement;
    }
    parent.querySelector(".pace").innerHTML = getPace({
        ACTIVITY: parent.querySelector("select[name^='activity'] option:checked").value,
        TIME: stringToTime(parent.querySelector("input[name^='time']").value),
        DISTANCE: parent.querySelector("input[name^='distance']").value,
        UNIT: parent.querySelector("select[name^='unit'] option:checked").value,
    });
}

var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
function updateDayOfWeek() {
    var inputs = document.querySelectorAll("#new-day legend input");
    var values = {};
    var day = "";
    _.each(inputs, function(i) {
        values[i.name] = +i.value;
    });
    if (_.compact(_.values(values)).length === 3) {
        day = days[(new Date(values.year, values.month - 1, values.day)).getDay()] + ",";
    }
    document.getElementById("day-of-week").innerHTML = day;
}

function addBlankWorkout(index) {
    var workoutTemplate = document.querySelector("script[type='text/template'][name='blank-workout']");
    workoutTemplate = _.template(workoutTemplate.innerHTML);
    document.querySelector("#new-day .workouts").innerHTML += workoutTemplate({ index: index });
    _.each(document.querySelectorAll("#new-day .workout-row:last-child input"), function(i) {
        i.addEventListener("blur", function() {
            updatePace(this);
        });
    });
}

function generateList(days) {
    var list = document.getElementById("day-list");
    var template = document.querySelector("script[type='text/template'][name='day']");
    template = _.template(template.innerHTML);
    for (var i = 0; i < days.length; i++) {
        list.innerHTML += template(days[i]);
    }
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

function stringToTime(string) {
    var time = 0;
    var factor = 1;
    var pieces = string.split(":");
    for (var i = pieces.length - 1; i >= 0; i--) {
        time += pieces[i] * factor;
        factor *= 60;
    }
    return time;
}
