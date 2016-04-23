define([
    "underscore",
    "d3",
    "util/dom",
    "util/pace",
    "util/workout",
], function(
    _,
    d3,
    dom,
    pace,
    workout,
undefined) {
    var addBlankWorkout = function() {
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
        document.getElementById("new-day-backdrop").addEventListener("click", cancelDay);
    };

    var cancelDay = function() {
        document.querySelector(".add-day").style.display = "block";
        document.querySelector(".not-legend").style.display = "none";
        document.querySelector("#new-day-backdrop").style.display = "none";
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

    return {
        addBlankWorkout: addBlankWorkout,
        attachListeners: attachListeners,
    };
});
