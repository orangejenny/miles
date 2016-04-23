/*
    Controlling view for entire app.
*/
requirejs([
    'underscore',
    'd3',
    'view/calendar',
    'view/days',
    'view/legend',
    'view/new_day',
    'util/workout',
], function(
    _,
    d3,
    calendar,
    days,
    legend,
    new_day,
    workout,
undefined) {
    // Render initial page: display past year
    generatePage(1);

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
    
            // TODO: make new_day.render accept post-processed json instead of pre-processed?
            new_day.render(json);
    
            json = _.map(json, function(day) {
                day.ACTIVITY_CLASS = workout.activityClass(day);
                day.WORKOUTS = _.map(day.WORKOUTS, function(w) {
                    w.DESCRIPTION = workout.serializeWorkout(w);
                    return w;
                });
                return day;
            });
            days.render(json);
            legend.render(json);
            calendar.render(json);
    
            filterForm.style.display = "block";
            filterSpinner.style.display = "none";
        });
    }
});
