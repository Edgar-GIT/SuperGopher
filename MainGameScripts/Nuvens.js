class Nuvens {
	constructor() {
		this.speed = 0.5; //velocidade do movimento das nuvens
		this.offset = 0; //offset
		this.loopWidth = (typeof MAP_WIDTH_PX !== 'undefined') ? MAP_WIDTH_PX : (32 * LarguraMapa);
		this.cloudElements = [];
	}

	iniciar() {
		const layer2 = document.getElementById('layer2');
		if (!layer2) return;
		const ElementosNuvem = layer2.querySelectorAll('[data-cloud="true"]'); //selecionar elementos de nuvem
		this.cloudElements = Array.from(ElementosNuvem).map(element => {
			const baseX = element.offsetLeft;
			const width = element.width || element.getBoundingClientRect().width || 128;
			return { element, baseX, width };
		});
	}

	update() {
		//mexe as nuvens para a esquerda
		this.offset -= this.speed;

		//reset quando acabar
		if (this.offset <= -this.loopWidth) {
			this.offset = 0;
		}
	}

	render() {
		//aplicar o offset a cada nuvem
		this.cloudElements.forEach(cloud => {
			let pos = cloud.baseX + this.offset;
			if (pos <= -cloud.width) {
				pos += this.loopWidth;
			}
			const delta = pos - cloud.baseX;
			cloud.element.style.transform = `translateX(${delta}px)`;
		});
	}

	setSpeed(newSpeed) {
		this.speed = newSpeed;
	}
}

let nuvens;

function InitNuvens() {
	nuvens = new Nuvens();
	nuvens.iniciar();
}

function AtualizarNuvens() {
	if (nuvens) {
		nuvens.update();
		nuvens.render();
	}
}

