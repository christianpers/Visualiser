(function(){

	var SpectrumAnalyserEasy = function(){

		this.node = null;
		this._parentEl = null;
		this._canvasObj = {};
		this._audioCtx = null;
		this._processArray = [];

		this._subbands = [];
		this._subbandsHistory = [];

		this.colorTheme = [];

		this._scriptNode = null;

		for (var i=0;i<32;i++){
			var subbandHistory = [];
			// for (var k=0;k<43;k++){
			// 	subbandHistory.push(0);
			// }
			this._subbandsHistory.push(subbandHistory);
		}

		// console.log(this._subbandsHistory);

		this._currentTopDiff = 0;

	};

	if (!window.obj)
		window.obj = {};

	window.obj.SpectrumAnalyserEasy = SpectrumAnalyserEasy;

	var p = SpectrumAnalyserEasy.prototype;

	p.setup = function(ctx, parent){

		this.node = ctx.createAnalyser();
		this.node.fftSize = 2048;
		this.node.maxDecibels = -30;
		this.node.minDecibels = -100;
		this._audioCtx = ctx;
		this._parentEl = parent;
		this._canvasObj = this.createCanvasObj();
		this._processArray = new Float32Array(this.node.frequencyBinCount);
		this._minRange = 0;
		this._maxRange = ctx.sampleRate;

		this._currentEnergy = 0;
		this._historyBuffer = [];

		this._scriptNode = this._audioCtx.createScriptProcessor(this.node.fftSize,1,1);
		this.node.connect(this._scriptNode);
		this._scriptNode.addEventListener('audioprocess', this._onAudioProcess.bind(this));
		

		



	};

	p.createCanvasObj = function(){

		var canvas = document.createElement('canvas');
		canvas.className = "waveformAnalyser";
		canvas.height = this._parentEl.clientHeight;
		canvas.width = this._parentEl.clientWidth;
		this._parentEl.appendChild(canvas);
		var context = canvas.getContext("2d");

		return {el: canvas, ctx: context};

	};

	p.connect = function(node){

		node.connect(this.node);
		this._scriptNode.connect(this._audioCtx.destination);

	};

	p._onAudioProcess = function(){

		// console.log('on audio process !');
		this.update();
		this.render();
	};

	p.update = function(){

		this.node.getFloatFrequencyData(this._processArray);
		
	};

	p.render = function(){

		
		var ctx = this._canvasObj.ctx;
		var canvas = this._canvasObj.el;

		ctx.clearRect(0,0,canvas.width,canvas.height);

		
		var currentEnergy = this.getCurrentEnergy();
		var average = this.getAverageEnergy();
		var variance = this.getVariance(average);
		var c = (-0.0025714 * variance) + 1.5142857;

		// console.log('c: ',c);

		this.shiftHistory(currentEnergy);

		var diff = currentEnergy - average;
		

		if (diff > 0){

			var max = 1000000;
			// console.log('diff: ',diff);
			ctx.fillStyle = this.colorTheme[0];
			if (diff > max){
				diff = max;
			}
			ctx.fillRect(40,canvas.height, 100, -((diff / max) * canvas.height));


		}

		if (currentEnergy > (c * average)){
			console.log('sdkfnsndf');
		}

		

		
		
		
		

	};

	p.getCurrentEnergy = function(){

		var sum = 0;
		for (var i=0;i<this._processArray.length;i++){

			sum += Math.pow(this._processArray[i],2);

		}

		return sum;
	};

	p.getAverageEnergy = function(){

		var average = 0;
		for (var i=0;i<this._historyBuffer.length;i++){
			average += this._historyBuffer[i];
		}

		average *= 1/this._historyBuffer.length;

		return average;
	};

	p.getVariance = function(average){

		var sum = 0;
		for (var i=0;i<this._historyBuffer.length;i++){
			sum += this._historyBuffer[i] - average;
		}
		sum *= 1/this._historyBuffer.length;

		return sum;
	};

	p.shiftHistory = function(energy){

		this._historyBuffer.unshift(energy);
		if (this._historyBuffer.length > 43){
			this._historyBuffer.pop();
		}

	};

	


	

})();