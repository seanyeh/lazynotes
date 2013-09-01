/**
 * From Monthly Music Hackathon NYC
 * 8/31/14
 *
 * Sean Yeh
 * 
 * License: You can do whatever you want with it :)
 */
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var CONTEXT = new window.AudioContext();
var COMPRESSOR = CONTEXT.createDynamicsCompressor();
COMPRESSOR.connect(CONTEXT.destination);
var curOsc = createOscillator(CONTEXT, 0);

var WIDTH = 800;
var HEIGHT = 500;

function createOscillator(con, midi, decay){
    var osc = con.createOscillator();
    osc.frequency.value = midiToFreq(midi);
    osc.type = 0;

    con.createGain = con.createGain || con.createGainNode;
    var gain = con.createGain();
    osc.connect(gain);
    gain.gain.value = 0.5;
    gain.connect(COMPRESSOR);
    osc.noteOn(0);

    osc.myMidi = midi;

    if (decay){
        var vol = 100;
        var id = window.setInterval(function(){
            vol -= decay;
            if (vol < 0 ){ vol = 0; }
            gain.gain.value = vol/100;

            if (vol <= 0){
                window.clearInterval(id);
            }
        }, 100);
    }
    return osc;
}


var NOTE_COLORS = [
    "red", // C
    "crimson", // C#
    "green", // D
    "#8B8878", // D#
    "yellow", // E
    "#8B0A50", // F
    "purple", // F#
    "orange", // G
    "cyan", // G#
    "white", // A
    "#5F9EA0", // Bb
    "blue" // B
];
function midiToColor(midi){
    return NOTE_COLORS[midi%12];
}

function midiToFreq(n){
    return 440 * Math.pow(2, (n-69)/12.0);
}

function setMidi(osc, midi){
    osc.myMidi = midi;
    osc.frequency.value = midiToFreq(midi);
}

var NUMS = [0,1,2,2,3,4,5,5];

var circles = [];
var oscillators = new Array(8);
var MOUSE_X, MOUSE_Y;
$(document).on('ready', function(){

    var t = Date.now();
    var oldX = 0, oldY = 0;

    var oldVelX = 0, oldVelY = 0;
    var THRESHOLD = 0.2;
    var accelX, accelY;

    init();

    $('canvas').mouseout(function(){
        if (curOsc){
            setMidi(curOsc, 0);
            // Hack because midi = 0 doesn't translate to freq = 0
            curOsc.frequency.value = 0;
        }
    });
    $('canvas').mousewheel(function(e, delta, deltaX, deltaY) {
        e.preventDefault();

        if (curOsc){
            var freq = curOsc.frequency.value;
            var deltaFreq = 5 * Math.log(freq)/Math.LN10;
            curOsc.frequency.value += deltaFreq;
        }
    });
    $('canvas').click(function(e){
        var x = e.offsetX, y = e.offsetY;
        var num = Math.floor(8 * e.offsetX / WIDTH);

        if (oscillators[num]){
            // Make current if current does not exist
            if (!curOsc){
                curOsc = oscillators[num];
            } else{
                // else remove
                oscillators[num].noteOff(0);
            }
            oscillators[num] = null;
        } else{
            var midi = 60 + num + NUMS[num];
            oscillators[num] = createOscillator(CONTEXT,midi);
        }


    });


    $('canvas').mousemove(function(e){
        circles.push(new Circle(e.offsetX, e.offsetY, 5));

        var deltaTime = Date.now() - t;
        t = Date.now();



        var deltaX = e.offsetX - oldX;
        var deltaY = e.offsetY - oldY;

        var velX = deltaX / deltaTime;



        var num = Math.floor(8 * e.offsetX / WIDTH);
        var midi = 60 + num + NUMS[num];

        var deltaV = Math.abs(velX - oldVelX);
        if (deltaV > THRESHOLD){
            // If change direction
            if (velX * oldVelX < 0){
                createOscillator(CONTEXT, midi, 5);

                circles.push(new Circle(e.offsetX, e.offsetY, 120, 
                            {opacityDelta: 0.8, radiusDelta: 0.7,
                                rgb: [255,0,122]}));
            }

        } else{
        }



        var velY = deltaY / deltaTime;


        // Now set "old" values
        oldX = e.offsetX; 
        oldY = e.offsetY;
        oldVelX = velX;
        oldVelY = velY;

        // Update currentOscillator
        if (curOsc){
            setMidi(curOsc, midi);
        }

    });
});


function draw(canvas){
    canvas.drawRect({
        fillStyle: "black",
        x: 0, y: 0,
        width: WIDTH, height: HEIGHT,
        fromCenter: false
    });


    var xUnit = WIDTH / 8;
    for (var i = 0; i < oscillators.length; i++){
        var osc = oscillators[i];
        if (osc){
            canvas.drawEllipse({
                fillStyle: midiToColor(osc.myMidi),
                x: (i + 0.5) * xUnit, y: HEIGHT - xUnit,
                width: xUnit, height: xUnit
            });

        }

        canvas.drawLine({
            x1: (i+1) * xUnit, y1: 0,
            x2: (i+1) * xUnit, y2: HEIGHT,
            strokeStyle: "white",
            strokeWidth: 1

        });
            
    }

    // Draw circles that follow the mouse
    for (var i = 0; i < circles.length; i++){
        var c = circles[i];
        if (c.isDead()){
            circles.splice(i,1);
            i--;
        } else{
            c.draw(canvas);
        }

    }
}


function Circle(x, y, radius, attrs){
    this.x = x; 
    this.y = y;
    this.radius = radius;

    
    this.opacityDelta = 1;
    this.radiusDelta = 1;

    this.dead = false;
    this.opacity = 100;


    // For colors (green and blue);
    this.rgb = [255,0,0];


    // Load custom attrs
    for (var k in attrs){
        this[k] = attrs[k];
    }
}

Circle.prototype.isDead = function(){ return this.dead; };
Circle.prototype.draw = function(canvas){
    canvas.drawEllipse({
        fillStyle: this.getColorString(),
        x: this.x, y: this.y,
        opacity: this.opacity/100,
        width: this.radius, height: this.radius
    });
    this.step();
};

Circle.prototype.getColorString = function(){
    return "rgb(" + this.rgb[0]%256 + "," + this.rgb[1]%256 + "," + this.rgb[2]%256 + ")";
};

Circle.prototype.step = function(){
    this.opacity -= this.opacityDelta;
    this.radius += this.radiusDelta;

    // Change color
    this.rgb[0] -= 2;
    this.rgb[1] += 2;

    if (this.opacity <= 0){ this.dead = true; }
};


function init(){
    var requestAnimationFrame = 
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame;
    var canvas = $("canvas");

    var tick = function(){
        requestAnimationFrame(tick);
        draw(canvas);
    };

    tick();
}
