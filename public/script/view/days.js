/*
    List of days and associated workouts.
*/
define([
    "underscore",
    "text!template/day.html",
    "util/day",
], function(
    _,
    day,
    util,
undefined) {
    var render = function(json) {
        var list = document.getElementById("days"),
            template = _.template(day);
        list.innerHTML = '';
        for (var i = 0; i < json.length; i++) {
            list.innerHTML += template(_.extend(json[i], {
                FORMATTED_DAY: util.formattedDay(json[i].DAY),
            }));
        }
    };

    var showAll = function() {
        var list = document.getElementById("days");
        _.each(list.children, function(li) {
            li.style.display = "block";
        });
    }

    var filterByClass = function(cssClass) {
        var list = document.getElementById("days");
        if (cssClass) {
            _.each(document.getElementById("days").children, function(li) {
                li.style.display = li.classList.contains(cssClass) ? "block" : "none";
            });
        } else {
            showAll();
        }
    };

    var filterByText = function(text) {
        if (text) {
            text = text.toLowerCase();
            _.each(document.getElementById("days").children, function(li) {
                if (li.querySelector(".workouts").innerHTML.toLowerCase().indexOf(text) != -1
                    || li.querySelector(".notes").innerHTML.toLowerCase().indexOf(text) != -1) {
                    li.style.display = "block";
                } else {
                    li.style.display = "none";
                }
            });
        } else {
            showAll();
        }
    };

    return {
        render: render,
        filterByClass: filterByClass,
        filterByText: filterByText,
    };
});
