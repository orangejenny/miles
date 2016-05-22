/*
    View of form to add new day, including some number of workouts.
*/
define([
    "underscore",
    "text!template/new_workout.html",
    "util/dom",
    "util/pace",
    "util/workout",
], function(
    _,
    new_workout,
    dom,
    pace,
    workout,
undefined) {
    var addBlankWorkout = function() {
        var index = document.querySelectorAll("#new-day .workouts .workout-row").length,
            workoutTemplate = _.template(new_workout),
            div = document.createElement("div");

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
            var workout = dom.closest(this, function(e) { return e.classList.contains("workout-row"); });
            workout.parentElement.removeChild(workout);
        });
    
        return div;
    };

    var attachListeners = function() {
        document.getElementById("add-workout").addEventListener("click", addBlankWorkout);
        updateDayOfWeek();
        _.each(document.querySelectorAll("#new-day legend input"), function(i) {
            i.addEventListener("blur", updateDayOfWeek);
        });
        document.getElementById("cancel").addEventListener("click", cancelDay);
    };

    var cancelDay = function() {
        document.querySelector(".add-day").style.display = "block";
        document.querySelector(".not-legend").style.display = "none";
        document.querySelector("#modal-backdrop").style.display = "none";
        document.querySelector("#new-day .workouts").innerHTML = "";
    };

    var updateDayOfWeek = function() {
        var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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
    };

    var updatePace = function(input) {
        parent = dom.closest(input, function(e) { return e.classList.contains("workout-row"); });
        parent.querySelector(".pace").innerHTML = pace.getPace({
            ACTIVITY: parent.querySelector("select[name^='activity'] option:checked").value,
            TIME: pace.stringToTime(parent.querySelector("input[name^='time']").value),
            DISTANCE: parent.querySelector("input[name^='distance']").value,
            UNIT: parent.querySelector("select[name^='unit'] option:checked").value,
        });
    };

    var render = function(json) {
        var buttonBar = document.querySelector(".add-day"),
            blankButton = document.createElement("button");
        blankButton.type = "button";
        blankButton.innerHTML = "Blank Day";
        blankButton.addEventListener("click", function() {
            addBlankWorkout();
            document.querySelector(".add-day").style.display = "none";
            document.querySelector(".not-legend").style.display = "block";
            document.querySelector("#modal-backdrop").style.display = "block";
        });
        buttonBar.innerHTML = '';
        buttonBar.appendChild(blankButton);

        var skeletons = {},
            index = 0;
        while (index < json.length && _.keys(skeletons).length < 4) {
            var day = json[index];
            var skeleton = _.first(_.map(day.WORKOUTS, function(w, i, all) {
					if (i >= 2 && all.length > 3) {
						return '...';
					};
					return workout.serializeWorkout(_.omit(w, ['SETS', 'REPS', 'TIME']));
				}), 3).join("<br>");
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
                    document.querySelector("#modal-backdrop").style.display = "block";
                });
                buttonBar.appendChild(button);
            }
            index++;
        }

        attachListeners();
    };

    return {
        render: render,
    };
});
