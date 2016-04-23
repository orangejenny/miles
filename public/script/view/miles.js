/*
    Controlling view for entire app.
*/
requirejs([
    'underscore',
    'd3',
    'view/calendar',
    'view/legend',
    'util/dom',
    'util/pace',
    'util/workout',
], function(
    _,
    d3,
    calendar,
    legend,
    dom,
    pace,
    workout,
undefined) {
    // Render initial page: display past year
    generatePage(1);

    // Attach listeners for new day form
    document.getElementById("add-workout").addEventListener("click", addBlankWorkout);
    updateDayOfWeek();
    _.each(document.querySelectorAll("#new-day legend input"), function(i) {
        i.addEventListener("blur", updateDayOfWeek);
    });
    document.getElementById("cancel").addEventListener("click", cancelDay);
    document.getElementById("new-day-backdrop").addEventListener("click", cancelDay);

    // Attach listener for filtering amount of data displayed
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
                var skeleton = _.map(day.WORKOUTS, function(w) { return workout.serializeWorkout(_.omit(w, ['SETS', 'REPS', 'TIME'])); }).join("<br>");
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
                day.ACTIVITY_CLASS = workout.activityClass(day);
                day.WORKOUTS = _.map(day.WORKOUTS, function(w) {
                    w.DESCRIPTION = workout.serializeWorkout(w);
                    return w;
                });
                return day;
            });
            renderList(json);
            legend.renderLegend(json);
            calendar.renderCalendar(json);
    
            filterForm.style.display = "block";
            filterSpinner.style.display = "none";
        });
    }
    
    // In form for new day, keep pace up to date with current distance and time
    function updatePace(input) {
        parent = dom.closest(input, function(e) { return e.classList.contains("workout-row"); });
        parent.querySelector(".pace").innerHTML = pace.getPace({
            ACTIVITY: parent.querySelector("select[name^='activity'] option:checked").value,
            TIME: pace.stringToTime(parent.querySelector("input[name^='time']").value),
            DISTANCE: parent.querySelector("input[name^='distance']").value,
            UNIT: parent.querySelector("select[name^='unit'] option:checked").value,
        });
    }
    
    // In form for new day, keep day of week up to date with current year, month, and day
    function updateDayOfWeek() {
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
    }
    
    // In form for new day, add a new workout
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
            var workout = dom.closest(this, function(e) { return e.classList.contains("workout-row"); });
            workout.parentElement.removeChild(workout);
        });
    
        return div;
    }
    
    // Close form for new day
    function cancelDay() {
        document.querySelector(".add-day").style.display = "block";
        document.querySelector(".not-legend").style.display = "none";
        document.querySelector("#new-day-backdrop").style.display = "none";
        document.querySelector("#new-day .workouts").innerHTML = "";
    }
    
    // Display list of days
    function renderList(days) {
        var list = document.getElementById("days"),
            template = document.querySelector("script[type='text/template'][name='day']");
        list.innerHTML = '';
        template = _.template(template.innerHTML);
        for (var i = 0; i < days.length; i++) {
            list.innerHTML += template(days[i]);
        }
    }
});
