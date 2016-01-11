document.addEventListener('DOMContentLoaded', function() {
    d3.json("data.pl", function(error, json) {
        if (error) {
            throw error;
        }

        var skeletons = {};
        var index = 0;
        var buttonBar = document.querySelector(".add-day");
        while (index < json.length && _.keys(skeletons).length < 4) {
            var day = json[index];
            var skeleton = _.map(day.WORKOUTS, function(w) { return serializeWorkout(w); }).join("<br>");
            if (!skeletons[skeleton]) {
                skeletons[skeleton] = day.WORKOUTS;
                var button = document.createElement("button");
                button.type = "button";
                button.innerHTML = skeleton;
                button.setAttribute("data-workouts", JSON.stringify(day.WORKOUTS));
                button.addEventListener("click", function() {
                    var workouts = this.getAttribute("data-workouts");
                    workouts = JSON.parse(workouts);
                    _.each(workouts, function(workout, index) {
                        var workoutDiv = addBlankWorkout();
                        _.each(['activity', 'unit', 'sets', 'reps', 'weight', 'distance'], function(name) {
                            if (workout[name.toUpperCase()]) {
                                workoutDiv.querySelector("[name^='" + name + "']").value = workout[name.toUpperCase()] || "";
                            }
                        });
                    });
                    document.querySelector(".add-day").style.display = "none";
                    document.querySelector(".not-legend").style.display = "block";
                });
                buttonBar.appendChild(button);
            }
            index++;
        }

        json = _.map(json, function(day) {
            day.WORKOUTS = _.map(day.WORKOUTS, function(w) {
                w.DESCRIPTION = serializeWorkout(w, true);
                return w;
            });
            return day;
        });
        generateList(json);
        generateCalendar(json);
    });

    document.getElementById("add-workout").addEventListener("click", addBlankWorkout);

    updateDayOfWeek();
    _.each(document.querySelectorAll("#new-day legend input"), function(i) {
        i.addEventListener("blur", updateDayOfWeek);
    });

    document.querySelector("#cancel").addEventListener("click", function() {
        document.querySelector(".add-day").style.display = "block";
        document.querySelector(".not-legend").style.display = "none";
        document.querySelector("#new-day .workouts").innerHTML = "";
    });
});

function serializeWorkout(workout, include_time) {
    var text = workout.ACTIVITY;
    if (workout.SETS) {
        text += " " + workout.SETS + " x";
    }
    if (workout.REPS) {
        text += " " + workout.REPS;
        if (workout.DISTANCE || include_time && workout.TIME) {
            text += " x";
        }
    }
    if (workout.DISTANCE) {
        text += " " + workout.DISTANCE + " " + workout.UNIT;
        if (include_time && workout.TIME) {
            text += " in"
        }
    }
    if (include_time && workout.TIME) {
        text += " " + timeToString(workout.TIME);
        var pace = getPace(workout);
        if (pace) {
            text += " (" + pace + ")";
        }
    }
    if (workout.WEIGHT) {
        text += " @ " + workout.WEIGHT + "lb";
    }
    text = text.trim();
    return text;
}

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

function addBlankWorkout() {
    var index = document.querySelectorAll("#new-day .workouts .workout-row").length;
    var workoutTemplate = document.querySelector("script[type='text/template'][name='blank-workout']");
    workoutTemplate = _.template(workoutTemplate.innerHTML);
    var div = document.createElement("div");
    div.innerHTML = workoutTemplate({ index: index });
    // TODO: deal with this. note that this will not add any text nodes
    _.each(div.children, function(child) {
        document.querySelector("#new-day .workouts").appendChild(child);
    });

    var div = document.querySelector("#new-day .workout-row:last-child");
    _.each(div.querySelectorAll("input"), function(i) {
        i.addEventListener("blur", function() {
            updatePace(this);
        });
    });
    return div;
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
