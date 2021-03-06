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

    // Attach listeners for filtering data
    var filters = document.getElementById("filters");
    _.each(filters.querySelectorAll(".years li:not(.disabled)"), function(li) {
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

    filters.querySelector("input").addEventListener("keyup", function(e) {
        days.filterByText(e.currentTarget.value);
    });

    function generatePage(minDate) {
        document.getElementById("spinner").style.display = "block";
        d3.json("data.pl?min=" + minDate.toISOString().replace(/T.*/, ''), function(error, json) {
            if (error) {
                throw error;
            }
    
            json = _.map(json, function(day) {
                day.ACTIVITY_CLASS = workout.activityClass(day);
                day.WORKOUTS = _.map(day.WORKOUTS, function(w) {
                    w.DESCRIPTION = workout.serializeWorkout(w);
                    return w;
                });
                return day;
            });
            new_day.render(json);
            days.render(json);
            legend.render(json);
            calendar.render(json);
            document.getElementById("spinner").style.display = "none";
        });
    }
});
