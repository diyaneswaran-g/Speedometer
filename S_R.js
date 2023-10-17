
// METER

let Meter = function Meter($elm, config) {
	
	// DOM
	let $needle, $value;
	
	// Others
	
	let steps = (config.valueMax - config.valueMin) / config.valueStep,
			angleStep = (config.angleMax - config.angleMin) / steps;
	
	let margin = 10; // in %
	let angle = 0; // in degrees
	
	let value2angle = function(value) {
		let angle = ((value / (config.valueMax - config.valueMin)) * (config.angleMax - config.angleMin) + config.angleMin);

		return angle;
	};
	
	this.setValue = function(v) {
		$needle.style.transform = "translate3d(-50%, 0, 0) rotate(" + Math.round(value2angle(v)) + "deg)";
		$value.innerHTML = config.needleFormat(v);
	};
	
	let switchLabel = function(e) {
		e.target.closest(".meter").classList.toggle('meter--big-label');
	};
	
	let makeElement = function(parent, className, innerHtml, style) {

		let	e = document.createElement('div');
		e.className = className;

		if (innerHtml) {
			e.innerHTML = innerHtml;
		}

		if (style) {
			for (var prop in style) {
				e.style[prop] = style[prop];
			}
		}

		parent.appendChild(e);
		
		return e;
	};
	// Label unit
	makeElement($elm, "label label-unit", config.valueUnit);

	for (let n=0; n < steps+1; n++) {
		let value = config.valueMin + n * config.valueStep;
		angle = config.angleMin + n * angleStep;
		// Graduation numbers	
		// Red zone
		let redzoneClass = "";
		if (value > config.valueRed) {
			redzoneClass = " redzone";
		}
		
		makeElement($elm, "grad grad--" + n + redzoneClass, config.labelFormat(value), {
			left: (50 - (50 - margin) * Math.sin(angle * (Math.PI / 180))) + "%",
			top: (50 + (50 - margin) *  Math.cos(angle * (Math.PI / 180))) + "%"
		});	


	}
	
	// NEEDLE
	
	angle = value2angle(config.value);
	
	$needle = makeElement($elm, "needle", "", {
		transform: "translate3d(-50%, 0, 0) rotate(" + angle + "deg)"
	});
	
	let $axle = makeElement($elm, "needle-axle").addEventListener("click", switchLabel);
	makeElement($elm, "label label-value", "<div>" + config.labelFormat(config.value) + "</div>" + "<span>" + config.labelUnit + "</span>").addEventListener("click", switchLabel);
	
	$value = $elm.querySelector(".label-value div");
};
// DOM LOADED FIESTA
document.addEventListener("DOMContentLoaded",	function() {	
	let rpmMeter = new Meter(document.querySelector(".meter--rpm"), {
		value: 6.3,
		valueMin: 0,
		valueMax: 8000,
		valueStep: 1000,
		valueUnit: "<div>RPM</div><span>x1000</span>",
		angleMin: 30,
		angleMax: 330,
		labelUnit: "RPM",
		labelFormat: function(v) { return Math.round(v / 1000); },
		needleFormat: function(v) { return Math.round(v / 100) * 100; },
		valueRed: 6500
	});
    let speedMeter = new Meter(document.querySelector(".meter--speed"), {
		value: 203,
		valueMin: 0,
		valueMax: 220,
		valueStep: 20,
		valueUnit: "<span>Speed</span><div>Km/h</div>",
		angleMin: 30,
		angleMax: 330,
		labelUnit: "Km/h",
		labelFormat: function(v) { return Math.round(v); },
		needleFormat: function(v) { return Math.round(v); }
	});
    let gearMeter = document.querySelector('.meter--gear div');
	// USER INPUTS
	document.onkeydown = keyDown;
	document.onkeyup = keyUp;
	function keyDown(e) {
		e = e || window.event;

		if (e.keyCode == '38') { 			// up arrow
			isAccelerating = true;
		}
		else if (e.keyCode == '32') { // space bar
			isBraking = true;
		}
		else if (e.keyCode == '37') { // left arrow
		}
		else if (e.keyCode == '39') { // right arrow
		}
	}	
	function keyUp(e) {
		e = e || window.event;

		if (e.keyCode == '38') {			// up arrow
			isAccelerating = false;
		}
		else if (e.keyCode == '32') { // space bar
			isBraking = false;
		}
		else if (e.keyCode == '37') { // left arrow
			gearDown();
		}
		else if (e.keyCode == '39') { // right arrow
			gearUp();
		}
	}	
	function gearUp() {
		if (gear < gears.length - 1) {
			gear++;
			gearMeter.innerHTML = gear;
		}
	}
	function gearDown() {
		if (gear > 1) {
			gear--;
			gearMeter.innerHTML = gear;
		}
	}
	// VEHICLE CONFIG
	let 
			mass = 1000,
			cx = 0.28,
			gears = [0, 0.4, 0.7, 1.0, 1.3, 1.5, 1.68],
			transmitionRatio = 0.17,
			transmitionLoss = 0.15,
			wheelDiameter = 0.5,
			brakeTorqueMax = 300,

			gear = 1,
			speed = 10,	// in km/h
			overallRatio,
			wheelRpm,
			wheelTorque,
			brakeTorque,
			resistance,
			acceleration;
	// MOTOR CONFIG
	let 
			rpmIdle = 1200,
			rpmMax = 8000,
			rpmRedzone = 6500,
			torqueMin = 20, // in m.kg
			torqueMax = 45, // in m.kg

			torque,
			rpm = 0,
			isAccelerating = false,
			isBraking = false;
	// Helper functions
	let torqueByRpm = function(rpm) {
		let torque = torqueMin + (rpm / rpmMax) * (torqueMax - torqueMin);
		return torque;
	};
	function kmh2ms(speed) {	// Km/h to m/s
		return speed / 3.6;
	}
let lastTime = new Date().getTime(),
			nowTime,
			delta;
	// MAIN LOOP
	(function loop(){
		window.requestAnimationFrame(loop);
		// Delta time
		nowTime = new Date().getTime();
		delta = (nowTime - lastTime) / 1000; // in seconds
		lastTime = nowTime;
		let oldSpeed = speed,
				oldRpm = rpm;
		// Torque
		if (isAccelerating && rpm < rpmMax) {	// Gas!
			torque = torqueByRpm(rpm);

		} else {
			torque = -(rpm * rpm / 1000000);
		}
		
		if (isBraking) {	// Ooops...
			brakeTorque = brakeTorqueMax;
		} else {
			brakeTorque = 0;
		} 
		overallRatio = transmitionRatio * gears[gear];
		wheelTorque = torque / overallRatio - brakeTorque;
		acceleration = 20 * wheelTorque / (wheelDiameter * mass / 2);
		resistance = 0.5 * 1.2 * cx * kmh2ms(speed)^2;
		// Speed
		speed += (acceleration - resistance) * delta;
		if (speed < 0) { speed = 0; }
		wheelRpm = speed / (60 * (Math.PI * wheelDiameter / 1000));
		rpm = speed / (60 * transmitionRatio * gears[gear] * (Math.PI * wheelDiameter / 1000));
		// Idle
		if (rpm < rpmIdle) {
			rpm = oldRpm;
			speed = oldSpeed;
		}
		// Gear shifter
		if (rpm > rpmRedzone) {
			gearMeter.classList.add('redzone');

		} else {
			gearMeter.classList.remove('redzone');
		}
		// Update GUI
		speedMeter.setValue(speed);
		rpmMeter.setValue(rpm);
	})();
	// Load the sample
	getData();
	// Launch loop playing
	source.start(0);
	source2.start(0);	
});