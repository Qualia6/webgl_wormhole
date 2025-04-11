const vertexShaderSource = `#version 300 es
precision mediump float;
in vec3 vertexPosition;
in vec2 vertexUv;
out vec2 uv;
uniform float Timer;


void main() {
	vec3 vertex = vertexPosition;
	// bend in
	vertex.xy *= 0.5 / (1.5 - vertex.z);
	// // spin
	vec2 offset = vec2(cos(Timer*6.28), sin(Timer*6.28)) * 0.35;
	vertex.xy -= (1. - vertex.z) * (1. - vertex.z) * offset;
	// longer
	vertex.z *= 2.; 
	gl_Position = vec4(vertex, 1.);
	uv = vertexUv;
}`
