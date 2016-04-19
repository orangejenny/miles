document.addEventListener('DOMContentLoaded', function() {
    generatePage(1);

    document.getElementById("add-workout").addEventListener("click", addBlankWorkout);

    updateDayOfWeek();
    _.each(document.querySelectorAll("#new-day legend input"), function(i) {
        i.addEventListener("blur", updateDayOfWeek);
    });

    document.getElementById("cancel").addEventListener("click", cancelDay);
    document.getElementById("new-day-backdrop").addEventListener("click", cancelDay);

    var filterForm = document.getElementById("filter-years");
    filterForm.querySelector("button").addEventListener("click", function() {
        var input = filterForm.querySelector("input"),
            years = parseInt(input.value);
        if (!_.isNumber(years) || years <= 0) {
            years = 1;
            input.value = years;
        }
        generatePage(years);
    });
});

function generatePage(years) {
    var filterForm = document.getElementById("filter-years"),
        filterSpinner = document.getElementById("filter-spinner");
    filterForm.style.display = "none";
    filterSpinner.style.display = "block";
    d3.json("data.pl?years=" + years, function(error, json) {
        if (error) {
            throw error;
        }

        var skeletons = {},
            index = 0,
            buttonBar = document.querySelector(".add-day"),
            blankButton = document.createElement("button");
        blankButton.type = "button";
        blankButton.innerHTML = "Blank Day";
        blankButton.addEventListener("click", function() {
            addBlankWorkout();
            document.querySelector(".add-day").style.display = "none";
            document.querySelector(".not-legend").style.display = "block";
            document.querySelector("#new-day-backdrop").style.display = "block";
        });
        buttonBar.innerHTML = '';
        buttonBar.appendChild(blankButton);
        while (index < json.length && _.keys(skeletons).length < 4) {
            var day = json[index];
            var skeleton = _.map(day.WORKOUTS, function(w) { return serializeWorkout(_.omit(w, ['SETS', 'REPS', 'TIME'])); }).join("<br>");
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
                    document.querySelector("#new-day-backdrop").style.display = "block";
                });
                buttonBar.appendChild(button);
            }
            index++;
        }

        json = _.map(json, function(day) {
            day.WORKOUTS = _.map(day.WORKOUTS, function(w) {
                w.DESCRIPTION = serializeWorkout(w);
                return w;
            });
            return day;
        });
        renderList(json);
        renderRecords(json);
        renderCalendar(json);

        filterForm.style.display = "block";
        filterSpinner.style.display = "none";
    });
}

function closest(element, lambda) {
    var closest = element;
    while (closest && !lambda.call(null, closest)) {
        closest = closest.parentElement;
    }
    return closest;
}

function serializeWorkout(workout, excludeActivity) {
    var text = excludeActivity ? '' : workout.ACTIVITY;
    if (workout.SETS) {
        text += " " + workout.SETS + " x";
    }
    if (workout.REPS) {
        text += " " + workout.REPS;
        if (workout.DISTANCE || workout.TIME) {
            text += " x";
        }
    }
    if (workout.DISTANCE) {
        text += " " + workout.DISTANCE + " " + workout.UNIT;
        if (workout.TIME) {
            text += " in"
        }
    }
    if (workout.TIME) {
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
}

function updatePace(input) {
    parent = closest(input, function(e) { return e.classList.contains("workout-row"); });
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

    div.querySelector(".remove-workout").addEventListener("click", function() {
        var workout = closest(this, function(e) { return e.classList.contains("workout-row"); });
        workout.parentElement.removeChild(workout);
    });

    return div;
}

function cancelDay() {
    document.querySelector(".add-day").style.display = "block";
    document.querySelector(".not-legend").style.display = "none";
    document.querySelector("#new-day-backdrop").style.display = "none";
    document.querySelector("#new-day .workouts").innerHTML = "";
}

function renderList(days) {
    var list = document.getElementById("days"),
        template = document.querySelector("script[type='text/template'][name='day']");
    list.innerHTML = '';
    template = _.template(template.innerHTML);
    for (var i = 0; i < days.length; i++) {
        list.innerHTML += template(days[i]);
    }
}

function renderRecords(allDays) {
    var list = document.getElementById("legend"),
        template = document.querySelector("script[type='text/template'][name='record']");

    list.innerHTML = '';
    template = _.template(template.innerHTML);

    var daysByActivity = _.groupBy(allDays, activityClass),
        sortedActivities = _.sortBy(_.keys(daysByActivity), function(activity) {
            return -1 * daysByActivity[activity].length;
        });

    _.each(sortedActivities, function(activity) {
        var records = [],
            workouts = _.flatten(_.map(daysByActivity[activity], function(day) {    // will be sorted by day, descending
                return _.map(day.WORKOUTS, function(w) {
                    return _.extend(w, {
                        DAY: day.DAY,
                        ID: Number(w.ID),
                        REPS: Number(w.REPS),
                        SETS: Number(w.SETS),
                        WEIGHT: Number(w.WEIGHT),
                        TIME: Number(w.TIME),
                        DISTANCE: Number(w.DISTANCE),
                    });
                });
            }));
        
        // Fastest
        if (activity === "running" || activity === "erging") {
            var goldenDistances = [],   // lazily, but reasonably, ignoring units
                groupBy = '';
            if (activity === "erging") {
                goldenDistances = [6, 2, 500];
                groupBy = 'DISTANCE';
            } else {
                goldenDistances = ["long", "medium", "short"];
                groupBy = function(w) {
                    if (w.DISTANCE < "5") {
                        return "short";
                    }
                    if (w.DISTANCE > 10) {
                        return "long";
                    }
                    return "medium";
                };
            }
            var workoutsByDistance = _.groupBy(_.filter(workouts, function(w) {
                return w.DISTANCE && w.TIME && (!w.REPS || w.REPS === 1);
            }), groupBy);
            _.each(goldenDistances, function(distance) {
                if (workoutsByDistance[distance]) {
                    var min;
                    _.each(workoutsByDistance[distance], function(w) {
                        if (!min || min.TIME / min.DISTANCE > w.TIME / w.DISTANCE) {
                            min = w;
                        }
                    });
                    records.push({
                        DESCRIPTION: serializeWorkout(min, true),
                        DAY: min.DAY,
                    });
                }
            });
        }

        // Total distance covered
        if (activity === "erging" || activity === "running") {
            var total = 0,
                goldenUnit = activity === "erging" ? "km" : "mi";
            _.each(workouts, function(w) {
                var distance = w.DISTANCE;
                if (distance) {
                    if (w.UNIT !== goldenUnit) {
                        distance = convertDistance(w.DISTANCE, w.UNIT, goldenUnit);
                    }
                    total += distance;
                }
            });
            records.push({
                DESCRIPTION: parseInt(total) + " " + goldenUnit + " total",
            });
        }

        // Max weight, per lift
        if (activity === "lifting") {
            _.each(_.groupBy(workouts, 'ACTIVITY'), function(workouts, lift) {
                var max = workouts[0];
                _.each(workouts, function(w) {
                    if (w.WEIGHT > max.WEIGHT) {
                        max = w;
                    }
                });
                records.push({
                    DESCRIPTION: lift + "@" + max.WEIGHT,
                    DAY: max.DAY,
                });
            });
        }

        // Total count
        records.push({
            DESCRIPTION: daysByActivity[activity].length + " days",
        });

        list.innerHTML += template({
            ACTIVITY: activity,
            CLASS: activityClass(activity),
            RECORDS: records,
        });
    });

    // Add hover events to toggle record lists
    _.each(document.querySelectorAll("#legend > li"), function(li) {
        li.addEventListener("mouseover", function(e) {
            e.currentTarget.querySelector(".records").style.display = "block";
        });
        li.addEventListener("mouseout", function(e) {
            e.currentTarget.querySelector(".records").style.display = "none";
        });
    });
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

var kmPerMile = 1.60934;
var conversions = {
    "mi": {
        "km": kmPerMile,
        "m": kmPerMile * 1000,
    },
    "km": {
        "m": 1000,
        "mi": 1 / kmPerMile,
    },
    "m": {
        "km": 1 / 1000,
        "mi": 1 / kmPerMile / 1000,
    }
};
function convertDistance(distance, fromUnit, toUnit) {
    return distance * conversions[fromUnit][toUnit];
}
