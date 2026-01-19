class Nuvens {
	constructor() {
		this.speed = 0.5; //velocidade do movimento das nuvens
		this.offset = 0; //offset
		this.cloudWidth = 32 * LarguraMapa;
		this.cloudRows = [0, 1, 2]; 
		this.cloudElements = [];
	}

	initialize() {
		const layer2 = document.getElementById('layer2');
		if (!layer2) return;
		const children = layer2.querySelectorAll('[data-cloud="true"]'); //selecionar elementos de nuvem
		this.cloudElements = Array.from(children);
	}

	update() {
		//mexe as nuvens para a esquerda
		this.offset -= this.speed;

		//reset quando acabar
		if (this.offset <= -this.cloudWidth) {
			this.offset = 0;
		}
	}

	render() {
		//aplicar o offset a cada nuvem
		this.cloudElements.forEach(element => {
			element.style.transform = `translateX(${this.offset}px)`;
		});
	}

	setSpeed(newSpeed) {
		this.speed = newSpeed;
	}
}

let nuvens;

function InitNuvens() {
	nuvens = new Nuvens();
	nuvens.initialize();
}

function UpdateNuvens() {
	if (nuvens) {
		nuvens.update();
		nuvens.render();
	}
}

