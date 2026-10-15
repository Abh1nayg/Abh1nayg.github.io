import {
    Group, BoxGeometry, MeshStandardMaterial, Mesh,
    Shape, ExtrudeGeometry, SplineCurve, Vector2
} from 'three'

/**
 * Guitar silhouette — total height ≈ 5.3 units, centred at the group's origin.
 *
 * Layout (group-local Y):
 *   Neck top    ≈ +2.65
 *   Neck bottom ≈ -0.55  ← joins body top at the same Y
 *   Body bottom ≈ -2.65
 *
 * Parts
 * ─────
 *  Neck : BoxGeometry  0.3 w × 3.2 h × 0.15 d   centred at y = +1.05
 *  Body : ExtrudeGeometry from a SplineCurve outline   offset to y = -1.35
 *
 * TODO: headstock, tuning pegs, frets, strings, sound-hole.
 */
export function createGuitar() {
    const guitar = new Group()

    // ── Materials ────────────────────────────────────────────────────────────
    const neckMat = new MeshStandardMaterial({ color: 0xc8a96e, roughness: 0.6 })
    const bodyMat = new MeshStandardMaterial({ color: 0x7a1212, roughness: 0.3, metalness: 0.2 })

    // ── Neck ─────────────────────────────────────────────────────────────────
    const neckGeo = new BoxGeometry(0.3, 3.2, 0.15)
    const neck = new Mesh(neckGeo, neckMat)
    neck.position.y = 1.05   // top = 1.05 + 1.6 = 2.65 | bottom = 1.05 − 1.6 = −0.55
    guitar.add(neck)

    // ── Body outline ─────────────────────────────────────────────────────────
    // Right-half control points (x ≥ 0), ordered top → bottom.
    // x = 0 at both ends keeps the seam kink-free.
    const rightPts = [
        [ 0,    0.8  ],   // top centre  (neck pocket)
        [ 0.5,  0.95 ],   // upper horn tip
        [ 0.65, 0.5  ],   // upper bout shoulder
        [ 0.5,  0.05 ],   // waist
        [ 0.6,  -0.4 ],
        [ 0.75, -0.85],   // widest point of lower bout
        [ 0.5,  -1.2 ],
        [ 0,    -1.3 ],   // bottom centre
    ]

    // Mirror to produce the left half (reversed, x negated, shared endpoints excluded)
    const leftPts = [...rightPts].reverse().slice(1, -1).map(([x, y]) => [-x, y])

    // Closed loop: right side down → left side up → back to start
    const loopPts = [...rightPts, ...leftPts, rightPts[0]].map(([x, y]) => new Vector2(x, y))

    // Smooth with a Catmull-Rom spline, then build the Shape
    const smoothPts = new SplineCurve(loopPts).getPoints(120)
    const bodyShape = new Shape(smoothPts)

    const bodyGeo = new ExtrudeGeometry(bodyShape, {
        depth:           0.25,
        bevelEnabled:    true,
        bevelThickness:  0.03,
        bevelSize:       0.03,
        bevelSegments:   3,
    })
    bodyGeo.translate(0, 0, -0.125)   // centre on the depth axis

    const body = new Mesh(bodyGeo, bodyMat)
    // Shift so shape-local y = 0.8 lands at scene y = −0.55 (= neck bottom)
    body.position.y = -1.35
    guitar.add(body)

    return guitar
}
