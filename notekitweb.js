/*
 * notekitweb.js - utility for decoding and drawing notekit drawings in the web
 * Copyright (C) 2023  Florian "sp1rit" <sp1rit@national.shitposting.agency>,
 *  with some copyright retained by Matvey Soloviev.

 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

"use strict";

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

	draw_to_canvas(canvas) {
		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		canvas.width = this.width;
		canvas.height = this.height;
		this.strokes.forEach(function(stroke) {
			ctx.strokeStyle = `rgba(${Math.floor(stroke.r * 255)}, ${Math.floor(stroke.g * 255)}, ${Math.floor(stroke.b * 255)}, ${stroke.a})`;
			for (var i = 1; i < stroke.xcoords.length; i++) {
				ctx.beginPath();
				ctx.moveTo(stroke.xcoords[i-1], stroke.ycoords[i-1]);
				ctx.lineTo(stroke.xcoords[i], stroke.ycoords[i]);
				ctx.lineWidth = stroke.pcoords[i-1];
				ctx.closePath();
				ctx.stroke();
			}
		});
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
