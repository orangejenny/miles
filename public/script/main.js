requirejs.config({
    baseUrl: 'script',
    paths: {
        "underscore": "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min",
        "d3": "//cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min",
        "text": "//cdnjs.cloudflare.com/ajax/libs/require-text/2.0.12/text.min",
    },
});

requirejs(["view/miles"]);
