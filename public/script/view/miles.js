/*
    Controlling view for entire app.
*/
requirejs([
    'underscore',
    'd3',
    'view/calendar',
    'view/legend',
    'view/new_day',
    'util/dom',
    'util/pace',
    'util/workout',
], function(
    _,
    d3,
    calendar,
    legend,
    new_day,
    dom,
    pace,
    workout,
undefined) {
    // Render initial page: display past year
    generatePage(1);

    new_day.attachListeners();

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
                new_day.addBlankWorkout();
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
                            var workoutDiv = new_day.addBlankWorkout();
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
