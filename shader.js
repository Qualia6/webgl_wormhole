const canvas = document.getElementById('shaderCanvas');
/** @type {WebGL2RenderingContext} */
const gl = canvas.getContext('webgl2');

const vertexBufferByteSize = 5 * Float32Array.BYTES_PER_ELEMENT
const vertexBufferPositionByteOffset = 0 * Float32Array.BYTES_PER_ELEMENT
const vertexBufferUvByteOffset = 3 * Float32Array.BYTES_PER_ELEMENT

const vertexBuffer = generateCylinderVertices(32, 32)// position vec3, uv vec2

const vertexGpuBuffer = gl.createBuffer()
// ARRAY_BUFFER because vertex data
// STATIC_DRAW because its not updated frequently - but is read frequently
// this all just tells the gpu driver where to store the data in the gpu
gl.bindBuffer(gl.ARRAY_BUFFER, vertexGpuBuffer)
gl.bufferData(gl.ARRAY_BUFFER, vertexBuffer, gl.STATIC_DRAW)

const indexBuffer = generateCylinderIndices(32, 32);

const indexGpuBuffer = gl.createBuffer()
// ELEMENT_ARRAY_BUFFER because index of vertices data
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexGpuBuffer)
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBuffer, gl.STATIC_DRAW)


function get_shader_string_name_from_type(shader_type) {
	switch (shader_type) {
		case gl.VERTEX_SHADER: return "VERTEX"
		case gl.FRAGMENT_SHADER: return "FRAGMENT"
		default: return `?${shader_type}?`
	}
}

function createShader(gl, type, source) {
	const shader = gl.createShader(type)
	gl.shaderSource(shader, source)
	gl.compileShader(shader)
	if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		return shader
	}
	console.error(`${get_shader_string_name_from_type(type)} COMPILE ERROR: ${gl.getShaderInfoLog(shader)}`)
	gl.deleteShader(shader)
}


const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)


const shaderProgram = gl.createProgram()
gl.attachShader(shaderProgram, vertexShader)
gl.attachShader(shaderProgram, fragmentShader)
gl.linkProgram(shaderProgram)
if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	console.error(`LINK ERROR: ${gl.getProgramInfoLog(shaderProgram)}`)
	gl.deleteProgram(shaderProgram)
}

function getAttribLocationOrError(program, attribute) {
	const location = gl.getAttribLocation(program, attribute)
	if (location < 0) {
		console.error(`Attribute location of ${attribute} not found!`)
	}
	return location
}

function getUniformLocationOrError(program, uniform) {
	const location = gl.getUniformLocation(program, uniform)
	if (location < 0) {
		console.error(`Uniform location of ${uniform} not found!`)
	}
	return location
}

const vertexPositionAttribLoc = getAttribLocationOrError(shaderProgram, "vertexPosition")
const vertexUvAttribLoc = getAttribLocationOrError(shaderProgram, "vertexUv")
const screenResolutionUniform = getUniformLocationOrError(shaderProgram, "screenResolution")
const timerUniform = getUniformLocationOrError(shaderProgram, "Timer")

const colorTextureUnit = 5;
const dustTextureUnit = 6;
const multiplyTextureUnit = 7;
const colorSamplerUniform = getUniformLocationOrError(shaderProgram, 'uColorSampler')
const dustSamplerUniform = getUniformLocationOrError(shaderProgram, 'uDustSampler')
const multiplySamplerUniform = getUniformLocationOrError(shaderProgram, 'uMultiplySampler')


// tell it to use the program with the given inputs and some facts about the inputs
gl.useProgram(shaderProgram)

gl.enableVertexAttribArray(vertexPositionAttribLoc)
gl.vertexAttribPointer(
	vertexPositionAttribLoc, // what are we connecting
	3, gl.FLOAT, // so vec3
	false, // false means dont 'normalize' it
	vertexBufferByteSize, // how big is it
	vertexBufferPositionByteOffset  // how many to skip from the start(none)
)

gl.enableVertexAttribArray(vertexUvAttribLoc)
gl.vertexAttribPointer(
	vertexUvAttribLoc,
	2, gl.FLOAT, // so vec2
	false,
	vertexBufferByteSize,
	vertexBufferUvByteOffset
)


gl.clearColor(0.7, 0.1, 0.1, 1.)

gl.uniform1i(colorSamplerUniform, colorTextureUnit);
gl.uniform1i(dustSamplerUniform, dustTextureUnit);
gl.uniform1i(multiplySamplerUniform, multiplyTextureUnit);


const loadImage = (path) => new Promise(resolve => {
	const image = new Image();
	image.addEventListener('load', () => resolve(image));
	image.src = path;
})


const colorImagePromise = loadImage("./color.png")
const dustImagePromise = loadImage("./dust.png")
const multiplyImagePromise = loadImage("./multiply.png")



;(async ()=>{ // entering async so we can use await
	const [colorImage, dustImage, multiplyImage] = await Promise.all([
		colorImagePromise,
		dustImagePromise,
		multiplyImagePromise
	])

	function bindTexture(image, imageUnit) {
		const texture = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0 + imageUnit)
		gl.bindTexture(gl.TEXTURE_2D, texture)
		gl.texImage2D(
			gl.TEXTURE_2D,
			0, // does mipmap stuff - but im having it generate them for me so i can leave as 0
			gl.RGB,
			image.width, image.height, 0, // image size & 0 (0 is required always)
			gl.RGB, gl.UNSIGNED_BYTE,
			image
		)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); // Wrap horizontally
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); // Wrap vertically
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); // Mipmaps with linear filtering
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); // Linear filtering for magnification
		gl.generateMipmap(gl.TEXTURE_2D)
	}

	bindTexture(colorImage, colorTextureUnit)
	bindTexture(dustImage, dustTextureUnit)
	bindTexture(multiplyImage, multiplyTextureUnit)

	update_canvas_size()
	requestAnimationFrame(draw)
	window.addEventListener('resize', update_canvas_size) 
})()


function draw(currentTime) {
	gl.uniform1f(timerUniform, (currentTime/20000)%1)
	gl.drawElements(gl.TRIANGLES, indexBuffer.length, gl.UNSIGNED_SHORT, 0)
	requestAnimationFrame(draw)
}


function update_canvas_size() {
	canvas.width = window.innerWidth
	canvas.height = window.innerHeight
	gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
	gl.uniform2f(screenResolutionUniform, canvas.width, canvas.height)
}
