define(function(require) {
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
