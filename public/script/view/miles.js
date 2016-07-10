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
    var today = new Date();
    generatePage(new Date(today.getFullYear() - 1, today.getMonth(), 1));

    // Attach listener for filtering amount of data displayed
    var filterYears = document.getElementById("filter-years");
    _.each(filterYears.querySelectorAll("li:not(.disabled)"), function(li) {
        li.addEventListener("click", function(e) {
            var year = e.currentTarget.innerHTML.replace(/\D/g, '');
            var next = e.currentTarget;
            do {
                if (next.nodeName.toLowerCase() === "li") {
                    next.classList.add("disabled");
                }
            } while (next = next.nextSibling);
            generatePage(new Date(year, 0, 1));
        });
    });

    function generatePage(minDate) {
        document.getElementById("spinner").style.display = "block";
        d3.json("data.pl?min=" + minDate.toISOString().replace(/T.*/, ''), function(error, json) {
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
            document.getElementById("spinner").style.display = "none";
        });
    }
});
