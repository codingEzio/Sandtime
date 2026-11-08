/** Locally authored limb and pelvic point geometry in the source atlas space.
 * No assets or datasets. All contours keep the original standing figure's pose.
 */
export interface AnatomyPoint {
  x: number;
  y: number;
  r: number;
  a: number;
}
type Position = readonly [number, number];

function geometry() {
  const points: AnatomyPoint[] = [];
  function dot(x: number, y: number, r = .9, a = .9) {
    // Match the source skull's granular material without obscuring bone contours.
    // Deterministic grain jitter is mirrored with the geometry and costs no frames.
    const noise = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    const n = noise - Math.floor(noise);
    if (n < .12) return;
    const texture = .75 + .25 * Math.sin(x * 13.1 + y * 7.7) ** 2;
    const grain = r * (.6 + n);
    x += (n - .5) * .8;
    y += Math.sin(x * 3.7 - y * 9.3) * .4;
    points.push({ x, y, r: grain, a: a * texture }, {
      x: 1122 - x,
      y,
      r: grain,
      a: a * texture,
    });
  }
  function joint(cx: number, cy: number, rx: number, ry: number) {
    for (let y = -ry; y <= ry; y += 1.4) {
      for (let x = -rx; x <= rx; x += 1.4) {
        if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) dot(cx + x, cy + y, .9, .92);
      }
    }
  }
  function bone(
    start: Position,
    end: Position,
    shaft: number,
    flare: number,
    bow = 3.7,
  ) {
    const dx = end[0] - start[0],
      dy = end[1] - start[1],
      length = Math.hypot(dx, dy);
    const nx = -dy / length, ny = dx / length;
    for (let d = 0; d <= length; d += 1.3) {
      const t = d / length,
        bend = Math.sin(t * Math.PI) * Math.min(bow, length * .025);
      const x = start[0] + dx * t + nx * bend,
        y = start[1] + dy * t + ny * bend;
      const half = shaft +
        flare * (Math.exp(-t * 18) + Math.exp(-(1 - t) * 18));
      for (let across = -half; across <= half; across += 1.4) {
        dot(x + nx * across, y + ny * across);
      }
    }
  }
  function quadratic(a: Position, c: Position, b: Position): Position[] {
    const result: Position[] = [];
    for (let i = 0; i < 20; i++) {
      const t = i / 20, u = 1 - t;
      result.push([
        u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
        u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
      ]);
    }
    return result;
  }
  function inside(x: number, y: number, polygon: Position[]) {
    let hit = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i], b = polygon[j];
      if (
        (a[1] > y) !== (b[1] > y) &&
        x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]
      ) hit = !hit;
    }
    return hit;
  }
  function shape(outline: Position[], holes: Position[][] = []) {
    const xs = outline.map((p) => p[0]), ys = outline.map((p) => p[1]);
    for (let y = Math.min(...ys); y <= Math.max(...ys); y += 1.4) {
      for (let x = Math.min(...xs); x <= Math.max(...xs); x += 1.4) {
        if (
          inside(x, y, outline) && !holes.some((h) => inside(x, y, h))
        ) dot(x, y);
      }
    }
  }
  return { points, dot, joint, bone, quadratic, shape };
}

export function armPoints(profile: "masculine" | "feminine"): AnatomyPoint[] {
  const { points, joint, bone } = geometry(), feminine = profile === "feminine";
  const shoulder: Position = feminine ? [456, 329] : [443, 329];
  const elbow: Position = feminine ? [434, 468] : [415, 468];
  const wrist: Position = feminine ? [402, 654] : [386, 654];
  const offset = wrist[0] - 386;
  joint(shoulder[0], shoulder[1], 9, 10);
  bone([shoulder[0], shoulder[1] + 9], [elbow[0], elbow[1] - 7], 4.6, 4.1);
  joint(elbow[0] - 3, elbow[1], 4.6, 5);
  joint(elbow[0] + 4, elbow[1] + 1, 4.8, 4.7);
  // The medial ulna and lateral radius are distinct; radius widens distally.
  bone(
    [elbow[0] + 5, elbow[1] + 8],
    [wrist[0] + 4, wrist[1] - 9],
    2.3,
    1.2,
    2.7,
  );
  bone(
    [elbow[0] - 5, elbow[1] + 9],
    [wrist[0] - 5, wrist[1] - 8],
    2.3,
    2.5,
    2.7,
  );
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      joint(
        wrist[0] - 6 + col * 4 + (row % 2) * 1.2,
        wrist[1] - 4 + row * 4,
        1.8,
        1.9,
      );
    }
  }
  const rays: Position[][] = [
    [[392, 658], [398, 669], [402, 678], [400, 686]],
    [[388, 659], [389, 675], [387, 687], [385, 697], [384, 702]],
    [[384, 659], [383, 676], [380, 690], [379, 701], [378, 705]],
    [[380, 659], [378, 675], [375, 688], [374, 698], [373, 701]],
    [[376, 659], [374, 673], [371, 684], [370, 692], [369, 695]],
  ];
  for (const ray of rays) {
    for (let i = 1; i < ray.length; i++) {
      const a: Position = [ray[i - 1][0] + offset, ray[i - 1][1]],
        b: Position = [ray[i][0] + offset, ray[i][1]];
      bone(a, b, i === 1 ? 1.3 : .9, .35, .5);
      if (i < ray.length - 1) joint(b[0], b[1], 1.6, 1.7);
    }
  }
  return points;
}

export function lowerBodyPoints(
  profile: "masculine" | "feminine",
): AnatomyPoint[] {
  const { points, dot, joint, bone, quadratic: q, shape } = geometry(),
    feminine = profile === "feminine";
  // Iliac wings and the pelvic ring surround a real open obturator foramen.
  // The female pelvis is broader; the hip/knee/ankle positions follow the atlas.
  const pelvisShift = feminine ? -9 : 0;
  const shifted = (p: Position): Position => [p[0] + pelvisShift, p[1]];
  const segment = (a: Position, c: Position, b: Position) =>
    q(shifted(a), shifted(c), shifted(b));
  const wing: Position[] = [
    ...segment([548, 579], [513, 546], [482, 573]),
    ...segment([482, 573], [461, 597], [475, 621]),
    ...segment([475, 621], [486, 642], [506, 652]),
    ...segment([506, 652], [520, 674], [548, 674]),
    ...segment([548, 674], [551, 659], [537, 646]),
    ...segment([537, 646], [520, 627], [531, 610]),
    ...segment([531, 610], [548, 592], [548, 579]),
  ];
  const hole: Position[] = [
    ...segment([519, 643], [505, 638], [508, 651]),
    ...segment([508, 651], [518, 666], [534, 662]),
    ...segment([534, 662], [538, 650], [519, 643]),
  ];
  shape(wing, [hole]);
  // Sacrum tapers from the lumbar spine into the pelvic centre.
  for (let y = 580; y <= 641; y += 1.4) {
    const half = 16 - (y - 580) * .17;
    for (let x = 561 - half; x <= 561; x += 1.4) {
      if (y % 12 > 3 || Math.abs(x - 561) > half * .65) {
        // Mirrored half-shell; its transverse gaps preserve articulation.
        dot(x, y);
      }
    }
  }
  bone([548 + pelvisShift, 670], [561, 673], 2.5, 1, .3);
  const hip: Position = feminine ? [492, 655] : [503, 649];
  const shaft: Position = feminine ? [493, 678] : [500, 670];
  const knee: Position = feminine ? [523, 877] : [515, 853];
  const ankle: Position = feminine ? [533, 1108] : [522, 1103];
  // Femoral head, oblique neck and greater trochanter before the long shaft.
  joint(hip[0], hip[1], 9.5, 9.5);
  bone([hip[0] + 2, hip[1] + 2], shaft, 4.8, 2.6, 1);
  joint(shaft[0] - 7, shaft[1] + 4, 6.5, 9);
  bone(shaft, [knee[0], knee[1] - 13], 5.8, 6.8, 4.7);
  joint(knee[0] - 6, knee[1] - 7, 7, 8);
  joint(knee[0] + 6, knee[1] - 7, 7, 8);
  // Patella reads as a separate front-facing knee cap above the tibial plateau.
  joint(knee[0], knee[1] + 1, 6.8, 8.5);
  bone([knee[0] + 1, knee[1] + 12], [ankle[0] + 1, ankle[1] - 9], 5, 5, 2.8);
  bone(
    [knee[0] - 13, knee[1] + 13],
    [ankle[0] - 11, ankle[1] - 2],
    2.1,
    2.4,
    3.4,
  );
  joint(knee[0] - 12, knee[1] + 12, 3.5, 4);
  joint(ankle[0] + 3, ankle[1] - 4, 5.2, 6);
  joint(ankle[0] - 10, ankle[1] + 2, 3.5, 5.8);
  joint(ankle[0] - 2, ankle[1] + 8, 7.2, 7);
  // Tarsals support five spreading metatarsals and separately jointed toes.
  for (
    const [dx, dy, rx, ry] of [
      [-9, 17, 5, 5],
      [-1, 19, 5, 5],
      [5, 18, 4, 4],
      [-13, 25, 4, 4],
      [-5, 26, 4, 4],
      [3, 25, 3.5, 4],
    ]
  ) {
    joint(ankle[0] + dx, ankle[1] + dy, rx, ry);
  }
  const spread = feminine ? -21 : -27;
  for (let i = 0; i < 5; i++) {
    const base: Position = [ankle[0] - 10 + i * 3.8, ankle[1] + 25];
    const distal: Position = [ankle[0] + spread + i * 8.4, 1157 + i * .7];
    bone(base, distal, 1.7, .8, 1.2);
    joint(distal[0], distal[1] + 2, 2.3, 2.5);
    const tip: Position = [distal[0] - .8, 1166 + i * 1.9];
    bone([distal[0], distal[1] + 5], tip, i === 4 ? 1.7 : 1.05, .35, .3);
    joint(tip[0], tip[1], i === 4 ? 2.2 : 1.6, 1.6);
  }
  return points;
}

/** Remove only the source arm envelopes; retain clavicle/ribs/lumbar spine. */
export function sourceArmPoint(
  point: AnatomyPoint,
  profile: "masculine" | "feminine",
): boolean {
  if (point.y < 318 || point.y > 712) return false;
  const threshold = point.y < 430
    ? (profile === "feminine" ? 92 : 105)
    : point.y < 550
    ? (profile === "feminine" ? 112 : 125)
    : 145;
  return Math.abs(point.x - 561) > threshold;
}
