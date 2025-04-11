function generateCylinderVertices(total_around, total_along) {
	const data_per_vert = 5
	const buffer = new Float32Array(total_around * total_along * data_per_vert)
	let index = 0
	for (let along=0; along<total_along; along++){
		for (let around=0; around<total_around; around++){
			const angle = around / (total_around-1) * Math.PI * 2
			buffer[index+0] = Math.cos(angle)		// x
			buffer[index+1] = Math.sin(angle)	// y
			buffer[index+2] = along/(total_along-1)*2-1		// z
			buffer[index+3] = around/(total_around-1)		// u
			buffer[index+4] = along/(total_along-1)	// v
			index += 5
		}
	}
	return buffer
}

function generateCylinderIndices(total_around, total_along) {
	const vert_per_quad = 6
	const buffer = new Uint16Array(total_around * (total_along - 1) * vert_per_quad)
	let index = 0
	for (let along=0; along<total_along; along++){
		for (let around=0; around<total_around; around++){
			const current = around + along * total_around
			const next_around = ((around+1) % total_around) + along * total_around
			const next_along = current + total_around
			const diagonal = next_around + total_around
			buffer[index+0] = current
			buffer[index+1] = next_around
			buffer[index+2] = next_along
			buffer[index+3] = next_around
			buffer[index+4] = next_along
			buffer[index+5] = diagonal
			index += 6
		}
	}
	return buffer
}
