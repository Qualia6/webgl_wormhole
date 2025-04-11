const fragmentShaderSource = `#version 300 es
precision mediump float;
out vec4 fragColor;
in vec2 uv;
uniform vec2 screenResolution;
uniform float Timer;
uniform sampler2D uColorSampler;
uniform sampler2D uDustSampler;
uniform sampler2D uMultiplySampler;

float spikes(float t) {
	float saw = abs(fract(t) * 2. - 1.);
	saw *= saw;
	return saw * saw;
}

void main() {
	const float uFog = 1.2;

	vec2 st = vec2(uv.s - Timer*2., uv.t*2. -Timer*10.);
	vec3 color = texture(uColorSampler, st).rgb * vec3(0.3, 0.5, 0.7);

	st = vec2(uv.s*2. +Timer*6., uv.t -Timer*6.);
	color += texture(uColorSampler, st).rgb * vec3(0.7, 0.5, 0.3);

	float flash = spikes(Timer * 19.) * 0.4 + spikes(Timer * 36. + 0.1) * 0.3 + 0.3;
	st = vec2(uv.s +Timer*2., uv.t*2. -Timer*6.);
	color *= mix(texture(uMultiplySampler, st).rgb, vec3(1.), flash);

	flash = spikes(Timer * 17.+0.35) * 0.4 + spikes(Timer * 31. + 0.2) * 0.3 + 0.3;
	st = vec2(uv.s -Timer*2., uv.t -Timer*3.);
	color *= mix(texture(uMultiplySampler, st).rgb, vec3(1.), flash);

	color *= color.r + color.g + color.b;
	color *= 0.25 * color;

	st = vec2(uv.s*1.2 -Timer*1., uv.t*0.3 -Timer*5.);
	vec3 cccc = texture(uDustSampler, st).rgb;
	color.r = mix(color.r, cccc.r*1.2, cccc.r);
	color.g = mix(color.g, cccc.g*1.2, cccc.g);
	color.b = mix(color.b, cccc.b*1.2, cccc.b);

	st = vec2(uv.s*1.5, uv.t*0.5 -Timer*11.);
	cccc = texture(uDustSampler, st).rgb;
	color.r = mix(color.r, cccc.r*1.6, cccc.r);
	color.g = mix(color.g, cccc.g*1.6, cccc.g);
	color.b = mix(color.b, cccc.b*1.6, cccc.b);

	float fog = exp(uv.t - 1.);
	color = mix(color, vec3(0.17, 0.13, 0.36), (1. - fog) * uFog);

	fragColor = vec4(color, 1.);
}`
