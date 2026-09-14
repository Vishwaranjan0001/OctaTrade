/*
  Shared geometry maths for the OctaTrade hero scene.

  Everything here is built on the regular octagon, which is the product's
  brand geometry ("Octa" — eight sides of the market). Keeping the maths in one
  module means the rings, the order-flow paths and the depth layers all agree on
  the same vertex positions.
*/

/** The octagon is drawn point-up-rotated so a flat edge faces the viewer. */
export const OCT_PHASE = Math.PI / 8;
export const OCT_SIDES = 8;

/**
 * Returns the eight vertices of a regular octagon.
 * Input  : radius.
 * Output : Array<[x, y]> of length 8.
 */
export function octagonVertices(radius) {
  return Array.from({ length: OCT_SIDES }, (_, index) => {
    const angle = (Math.PI / 4) * index + OCT_PHASE;
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
  });
}

/**
 * Position of a point travelling the octagon's perimeter.
 *
 * Purpose : order-flow particles move along the ring path rather than on a
 *           circle, so the motion traces the brand geometry exactly.
 * Input   : radius, t (perimeter fraction 0..1, wraps).
 * Output  : [x, y]
 */
export function octagonPerimeterPoint(radius, t) {
  const wrapped = ((t % 1) + 1) % 1;
  const scaled = wrapped * OCT_SIDES;
  const edge = Math.floor(scaled);
  const along = scaled - edge;

  const angleA = (Math.PI / 4) * edge + OCT_PHASE;
  const angleB = (Math.PI / 4) * ((edge + 1) % OCT_SIDES) + OCT_PHASE;

  const ax = radius * Math.cos(angleA);
  const ay = radius * Math.sin(angleA);
  const bx = radius * Math.cos(angleB);
  const by = radius * Math.sin(angleB);

  return [ax + (bx - ax) * along, ay + (by - ay) * along];
}

/**
 * Builds a closed octagon outline as a flat position array for a LineLoop.
 * Input  : radius, z depth.
 * Output : Float32Array of 8 * 3 components.
 */
export function octagonLinePositions(radius, z = 0) {
  const vertices = octagonVertices(radius);
  const positions = new Float32Array(vertices.length * 3);
  vertices.forEach(([x, y], index) => {
    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = z;
  });
  return positions;
}
