class Stroke {
	constructor(r, g, b, a, ncoords) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
		
		this.xcoords = new Float32Array(ncoords);
		this.ycoords = new Float32Array(ncoords);
		this.pcoords = new Float32Array(ncoords);
	}
}

function cast_uint_float(uint) {
	const buf = new ArrayBuffer(4);
	new DataView(buf).setUint32(0, uint, true);
	return new Float32Array(buf)[0];
}

class NoteKitDrawing {
	constructor(data) {
		this.width = data[0];
		this.height = data[1];
		
		var pos = 3;
		this.strokes = Array(data[2]);
		for(var nstrokes = 0; nstrokes<data[2]; nstrokes++) {
			let r = cast_uint_float(data[pos  ]);
			let g = cast_uint_float(data[pos+1]);
			let b = cast_uint_float(data[pos+2]);
			let a = cast_uint_float(data[pos+3]);
			let ncoords = data[pos+4];
			
			const stroke = new Stroke(r, g, b, a, ncoords);
			
			for(var coord = 0; coord<ncoords; coord++) {
				stroke.xcoords[coord] = cast_uint_float(data[pos+5+coord]);
				stroke.ycoords[coord] = cast_uint_float(data[pos+5+coord+  ncoords]);
				stroke.pcoords[coord] = cast_uint_float(data[pos+5+coord+2*ncoords]);
			}
			
			this.strokes[nstrokes] = stroke;
			pos += 5+3*ncoords;
		}
	}
}

function encoded_string_to_stream(encoded) {
	// this is a terrible solution, but I guess that's to be expected from js ¯\_(ツ)_/¯
	// Credits to Goran.it on SO; https://stackoverflow.com/a/21797381/10890264
	// Licensed under CC-BY-SA 4.0
	var binary_string = atob(encoded);
	var bytes = new Uint8Array(binary_string.length);
	for (var i = 0; i < binary_string.length; i++) {
		bytes[i] = binary_string.charCodeAt(i);
	}

	return new ReadableStream({
		start(controller) {
			controller.enqueue(bytes);
			controller.close();
		}
	});
}

async function notekit_drawing_from_string(encoded) {
	const zlib = new DecompressionStream("deflate");
	return new NoteKitDrawing(new Uint32Array(
		await (
			await new Response(encoded_string_to_stream(encoded).pipeThrough(zlib)).blob()
		).arrayBuffer()
	));
}

notekit_drawing_from_string("eNqFirEJACAQA8/SBVxH0RVcxu7n/srXrxTEQLiERAE1B25Jjptakd5gNKd1Ul27U8/8/FJ+ngQaFJs=")
.then(console.log)
.catch(console.err);

