
var GOOD = "#0d0";
var BAD = "#ff0000";
var NEUTRAL = "#bbb";

function initMap(config, callback) {

    var map = $K.map('#map-holder'); 

        var resize = function() {
            var c = $('#map-holder');
            var ratio = map.viewAB.width / map.viewAB.height;
            c.height( c.width() / ratio );
            map.resize();
        };

        $(window).resize(resize);

    $.fn.qtip.defaults.style.classes = 'qtip-dark';

    var scale = chroma.scale([BAD, "#ff4500", "#ffa500", "#ffff00", GOOD]);
    
    map.loadCSS('static/css/map.css', function() {
        map.loadMap('static/img/'+ config.name + '.svg', function() {

            var bgLayer = {
                name: 'bg'
            }

            var statesLayer = { }
            if (config.states) {
                statesLayer.styles = {
                    'fill' : function(d) { 
                        return config.states && config.states[d.name] ? (scale(config.states[d.name].skill).hex()) :'#fff';
                        },
                    'stroke-width': 1.7,
                    'fill-opacity': 1
                }
            }
            if (config.click) {
                clickFn = function(data, path, event) {
                    config.click(data.name);
                }
                statesLayer.click = clickFn 
                bgLayer.click = clickFn 
            }
            if (config.showTooltips) {
                statesLayer.tooltips = function(d) {
                    var name = (config.states[d.name] ? '<span class="label">' + '<i class="flag-'+d.name+'"></i> ' + config.states[d.name].name + '</span>' : '<br>Neprozkoumané území<br><br>'); 
                    var description = config.states[d.name] ? '<br><br> Úroveň znalosti: ' + Math.round(100 * config.states[d.name].skill) + '%' : "";

                    return [name + description, ''];
                }
            }
            map.addLayer('states',  {
                name: 'glowbg'
            })
            map.addLayer('states', bgLayer)
            map.addLayer('states', statesLayer )

            map.addFilter('myglow', 'glow', {
                    size: 2,
                    color: '#ddd',
                    inner: true
                });
                map.getLayer('bg').applyFilter('myglow');
            map.addFilter('oglow', 'glow', {
                size: 4,
                color: '#333',
                strength: 2,
                inner: false
            });
            map.getLayer('glowbg').applyFilter('oglow');

           /* 
            .addLayer('states', {
                name: 'bgback'
            });

            map.addFilter('oglow', 'glow', {
                size: 10,
                color: '#988',
                strength: 1,
                inner: false
            });
            map.getLayer('bgback').applyFilter('oglow');
            map.addFilter('myglow', 'glow', {
                size: 20,
                color: '#945C1B',
                inner: true
            });
            map.getLayer('bg').applyFilter('myglow');

            map.addFilter('myglow', 'glow', { size: 9, color: '#945C1B', inner: true });
            map.getLayer('bg').applyFilter('myglow');
            */
            resize();
            callback && callback();
        })
    })
    var myMap = {
        map: map,
        highlightState : function(state, color) {
            var color = color || NEUTRAL;
            var layer = map.getLayer('states');
            statePath = layer.getPaths({ name: state })[0];
            if (statePath) {
                statePath.svgPath.attr('fill', color);
                statePath.svgPath.attr('fill-opacity', 1);
            }
        },
        blink : function(state, count) {
            var count = count || 0;
            var that = this
            if (count < 6) {
                color = count % 2 == 0 ? "white" : NEUTRAL;
                that.highlightState(state, color);
                setTimeout(function(){
                    that.blink(state, ++count)
                }, 50)
            }
        },
        clearHighlights : function () {
            var layer = map.getLayer('states');
            //layer.style('fill', "");
            layer.style('fill-opacity', 0);
        }
    }
    return myMap; 
}

function inputKeyUp(e) {
    e.which = e.which || e.keyCode;
    if(e.which == 13) {
        var ngView = $("#ng-view").children().scope();
        if (!ngView.select && ngView.question && ngView.question.type == 1) {
            $("select.select2").select2("open");
        }
        $('.btn-primary:not([disabled="disabled"])').click();
    }
}

