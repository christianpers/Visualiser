(function(){

	var Wave = function(){


	};

	if (!window.obj)
		window.obj = {};

	window.obj.Wave = Wave;

	var p = Wave.prototype;

	// Wave.DAMPING = .99;
	// Wave.ITERATIONS = 5;
	// Wave.NUM_POINTS = 50;
	// Wave.SPRING_CONSTANT = .005;
	// Wave.SPRING_CONSTANT_BASELINE = .005;
	// Wave.Y_OFFSET = 300;
	// Wave.NUM_BACKGROUND_WAVES = 7;
	// Wave.BACKGROUND_WAVE_MAX_HEIGHT = 5;
	// Wave.BACKGROUND_WAVE_COMPRESSION = 1/5;

	Wave.DAMPING = .90;
	Wave.ITERATIONS = 5;
	Wave.NUM_POINTS = 200;
	Wave.SPRING_CONSTANT = .005;
	Wave.SPRING_CONSTANT_BASELINE = .005;
	Wave.Y_OFFSET = 300;
	Wave.NUM_BACKGROUND_WAVES = 20;
	Wave.BACKGROUND_WAVE_MAX_HEIGHT = 10;
	Wave.BACKGROUND_WAVE_COMPRESSION = 1/20;

	p.init = function(ctx, canvas, audioCtx, parent, audioBufferSource){

		this.ctx = ctx;
		this.canvas = canvas;
		this.audioCtx = audioCtx;

		

		this.beatOffset = 0;

		// this._beatDetektor = new BeatDetektor();
		// this._vu = new BeatDetektor.modules.vis.VU();
		// this._bassKick = new BeatDetektor.modules.vis.BassKick();

		// this._scriptNode = audioCtx.createScriptProcessor(2048,1,1);

		// this._audioCanvasObj = {};
		// var audioCanvas = document.createElement('canvas');
		// audioCanvas.id = 'audioCanvas';
		// parent.appendChild(audioCanvas);
		// this._audioCanvasObj.canvas = audioCanvas;

		// this._audioCanvasObj.ctx = audioCanvas.getContext('2d');

		// audioBufferSource.connect(this._scriptNode);

		// this._scriptNode.addEventListener('audioprocess', this._onAudioProcess.bind(this));
		// this._scriptNode.connect(audioCtx.destination);

		this._ftimer = 0;

		this.sineOffsets = [];
		this.sineAmplitudes = [];
		this.sineStretches = [];
		this.offsetStretches = [];

		this.currentOffset = 0;

		this.mouseClickToUse = false;
		this.mousePoint = {x:undefined, y: undefined};

		this.colorTheme = ColorThemes.getRandomTheme();
		this._spectrumAnalyzer.colorTheme = this.colorTheme;



		for (var i=0;i<Wave.NUM_BACKGROUND_WAVES;i++){
		
			var sineOffset = -1 + 2*Math.random();
			this.sineOffsets.push(sineOffset);
		
			var sineAmplitude = Math.random() * Wave.BACKGROUND_WAVE_MAX_HEIGHT;
			this.sineAmplitudes.push(sineAmplitude);
		
			var sineStretch = Math.random() * Wave.BACKGROUND_WAVE_COMPRESSION;
			this.sineStretches.push(sineStretch);
		
			var offsetStretch = Math.random() * Wave.BACKGROUND_WAVE_COMPRESSION;
			this.offsetStretches.push(offsetStretch);
		}

		this.wavePoints = this.makeWavePoints(Wave.NUM_POINTS);

		this.update();

		window.addEventListener('keyup', this._onKeyboardUp.bind(this));

		this.canvas.addEventListener('click', this._onMouseClick.bind(this));
	};

	p._onKeyboardUp = function(e){

		if (e.keyCode == 75)
			this.currentOffset += 1;
	};

	p._onMouseClick = function(e){

		this.mouseClickToUse = true;
		this.mousePoint.x = e.x;
		this.mousePoint.y = e.y;
	};

	// p._onAudioProcess = function(e){

	// 	// console.log('on audio process');

	// 	var ctx = this._audioCanvasObj.ctx;
	// 	var canvas = this._audioCanvasObj.canvas;

	// 	var inputArrayL = e.inputBuffer.getChannelData(0);
	// 	this._beatDetektor.process(this.audioCtx.currentTime, inputArrayL);
	// 	this._bassKick.process(this._beatDetektor);

	// 	// this._ftimer += this._beatDetektor.last_update;
	// 	// if (this._ftimer > 1.0 / 24.0) {
	// 	// 	this._vu.process(this._beatDetektor, this._ftimer);
	// 	// 	this._ftimer = 0;
	// 	// }



	// 	ctx.clearRect(0,0,canvas.width, canvas.height);
	// 	var fillStyle = this._bassKick.is_kick ? this.colorTheme[2] : 'transparent';
	// 	ctx.fillStyle = fillStyle;
	// 	ctx.fillRect(0,0,canvas.width, canvas.height);

	// 	if (this._bassKick.is_kick){
	// 		this.showBeat();
	// 	}
			
	// };

	p.showBeat = function(val){

		this.beatOffset = val;

		this.mouseClickToUse = true;
		this.mousePoint.x = val * this.canvas.width;
		this.mousePoint.y = this.canvas.height/2;
	};

	p.makeWavePoints = function(numPoints){

	
		var t = []
		for (var i=0;i<numPoints;i++){
			var newPoint = {
				x : i / numPoints *  this.canvas.width,
				y : Wave.Y_OFFSET,
				spd : {y:0},
				mass : 1

			}
			t[i] = newPoint;
		}

		return t;
	};

	p.overlapSines = function(x){

		var result = 0;
		for (var i=0;i<Wave.NUM_BACKGROUND_WAVES;i++){
			result = result + this.sineOffsets[i] + this.sineAmplitudes[i] * Math.sin(x * this.sineStretches[i] + this.currentOffset * this.sineOffsets[i]);
		}

		return result;
	};

	p.updateWavePoints = function(points){

		for (var i=0;i<Wave.ITERATIONS;i++){

			for (var n=0;n<points.length;n++){

				// debugger;

				var p = points[n];

				var force = 0;
				var forceFromLeft, forceFromRight;

				if (n == 0){
					var dy = points[points.length-1].y - p.y;
					forceFromLeft = Wave.SPRING_CONSTANT * dy;
			
				}else{
					var dy = points[n-1].y - p.y;
					forceFromLeft = Wave.SPRING_CONSTANT * dy;
			
				}

				if (n == points.length-1){
					var dy = points[0].y - p.y;
					forceFromRight = Wave.SPRING_CONSTANT * dy;

				}else{

					var dy = points[n+1].y - p.y;
					forceFromRight = Wave.SPRING_CONSTANT * dy;
				}

				// apply force toward the baseline
				var dy = Wave.Y_OFFSET - p.y;
				
				var forceToBaseline = Wave.SPRING_CONSTANT_BASELINE * dy;

				// forceToBaseline *= this.beatOffset/10;

				force += forceFromLeft;
				force += forceFromRight;
				force += forceToBaseline;

				var acceleration = force / p.mass;

			
				p.spd.y = Wave.DAMPING * p.spd.y + acceleration;

				p.y = p.y + p.spd.y;

	

			}
		}
	};

	p.update = function(){


		if (this.mouseClickToUse){

			this.mouseClickToUse = false;

			var closestPoint = null;
			var closestDistance = undefined;
			for (var i=0;i<this.wavePoints.length;i++){
				var p = this.wavePoints[i];
				var distance = Math.abs(this.mousePoint.x - p.x)
				if (closestDistance === undefined){
					closestPoint = p;
					closestDistance = distance;
				}else{
					if (distance <= closestDistance){
						closestPoint = p;
						closestDistance = distance;
					}
				}
			}

			closestPoint.y = this.mousePoint.y;

			// debugger;
		}


		// this.currentOffset += .006;

		// this._spectrumAnalyzer.update();
		// this._spectrumAnalyzer.render();

		this.updateWavePoints(this.wavePoints);

		this.draw();

		requestAnimationFrame(this.update.bind(this));
	};

	p.draw = function(){

		this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);

		// Baseline
		// this.ctx.strokeStyle = 'purple';
		// this.ctx.beginPath();
		// this.ctx.moveTo(0,Wave.Y_OFFSET);
		// this.ctx.lineTo(this.canvas.width, Wave.Y_OFFSET);
		// this.ctx.stroke();
		// this.ctx.closePath();

		// DRAW POINTS AND LINE
		for (var i=0;i<this.wavePoints.length;i++){
			var p = this.wavePoints[i];
			// this.ctx.beginPath();
			// this.ctx.strokeStyle = 'gray';
			// this.ctx.arc(p.x, Wave.Y_OFFSET + this.overlapSines(p.x), 4, 0, 2*Math.PI);
			// this.ctx.stroke();
			// this.ctx.closePath();

			this.ctx.beginPath();
			this.ctx.strokeStyle = 'blue';
			this.ctx.arc(p.x, p.y + this.overlapSines(p.x),40,0,2*Math.PI);
			this.ctx.stroke();
			this.ctx.closePath();

			// DRAW LINES BETWEEN CIRCLES
			// if (i > 0){
			// 	var leftPoint = this.wavePoints[i-1];
			// 	this.ctx.beginPath();
			// 	this.ctx.strokeStyle = 'black';
			// 	this.ctx.moveTo(leftPoint.x, leftPoint.y + this.overlapSines(leftPoint.x));
			// 	this.ctx.lineTo(p.x, p.y + this.overlapSines(p.x));
			// 	this.ctx.stroke();
			// 	this.ctx.closePath();
			// }
		}
	};

})();