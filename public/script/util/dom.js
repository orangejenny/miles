/*
    Convenience functions for manipulating DOM elements.
*/
define(function() {
    return {
        closest: function(element, lambda) {
            var closest = element;
            while (closest && !lambda.call(null, closest)) {
                closest = closest.parentElement;
            }
            return closest;
        },
    };
});
