import {
    Group, BoxGeometry, CylinderGeometry,
    MeshStandardMaterial, Mesh,
    MeshBasicMaterial,
    Shape, ExtrudeGeometry, SplineCurve, Vector2, Vector3
} from 'three'

// ─── Primary layout constants ─────────────────────────────────────────────────
const NECK_W = 0.30    // neck width
const NECK_H = 3.20    // neck height
const NECK_D = 0.15    // neck depth
const BODY_DEPTH = 0.25    // body extrusion depth

// ─── Z-plane constants (everything above the body face is derived here) ───────
const bodyFront = BODY_DEPTH / 2 + 0.03   // = 0.155  body front face (half-depth + bevel)
const pickupH = 0.03                     // pickup depth (thin)
const pickupTop = bodyFront + pickupH      // = 0.185  top (front) of any pickup
const stringZNut = bodyFront + 0.05        // = 0.205  string height at the nut
const stringZBr = bodyFront + 0.09        // = 0.245  string height at the bridge

// ─── Fretboard ───────────────────────────────────────────────────────────────
const FB_D = 0.025
// Neck group z-offset: push the neck forward so the fretboard's front face
// sits at bodyFront + 0.01, flush with the body like a real bolt-on neck.
//   Fretboard front (in neck-local space) = NECK_D/2 + FB_D = 0.10
//   Target in scene = bodyFront + 0.01 = 0.165
//   → neckGroup.position.z = 0.165 - 0.10 = 0.065
const NECK_Z_OFFSET = bodyFront + 0.01 - (NECK_D / 2 + FB_D)  // = 0.065

// ─── Derived Y positions ──────────────────────────────────────────────────────
const NECK_CY = 1.05
const NECK_TOP_Y = NECK_CY + NECK_H / 2     // = 2.65
const NECK_BOT_Y = NECK_CY - NECK_H / 2     // = −0.55

// Nut — y position
const NUT_Y = NECK_TOP_Y - 0.04        // = 2.61

// Body: shape-local y ∈ [0.8, −1.3]; BODY_OFFSET_Y shifts into scene space
const BODY_OFFSET_Y = NECK_BOT_Y - 0.8      // = −1.35
const BODY_TOP_Y = BODY_OFFSET_Y + 0.8   // = −0.55
const BODY_BOT_Y = BODY_OFFSET_Y - 1.3   // = −2.65
const BODY_HEIGHT = BODY_TOP_Y - BODY_BOT_Y // = 2.10

// Bridge y: sits in the lower third of the body
const BRIDGE_Y = BODY_BOT_Y + BODY_HEIGHT * 0.22   // ≈ −2.19

// ─── Clearance check (compile-time sanity) ────────────────────────────────────
// zAt(y) = string z at any y along the run. Both pickups must clear pickupTop by ≥ 0.02.
// Neck pickup:   BODY_TOP_Y − 0.20  = −0.75  → zAt ≈ 0.233  clearance ≈ 0.048  ✓
// Bridge pickup: BODY_TOP_Y − 1.26  = −1.81  → zAt ≈ 0.242  clearance ≈ 0.057  ✓

// ─── Materials ────────────────────────────────────────────────────────────────
const neckMat = new MeshStandardMaterial({ color: 0xf2e8cf, roughness: 0.6 })
const fretboardMat = new MeshStandardMaterial({ color: 0x243029, roughness: 0.85 })
const nutMat = new MeshStandardMaterial({ color: 0xf2e8cf, roughness: 0.4 })
const bodyMat = new MeshStandardMaterial({ color: 0xbc4749, roughness: 0.3, metalness: 0.2 })
const headstockMat = new MeshStandardMaterial({ color: 0x6a994e, roughness: 0.7 })
const pegMat = new MeshStandardMaterial({ color: 0xcfcfcf, metalness: 0.8, roughness: 0.35 })
const pickupMat = new MeshStandardMaterial({ color: 0x111111, roughness: 0.4 })
const stringMat = new MeshStandardMaterial({ color: 0xd4d4d4, metalness: 0.9, roughness: 0.25 })

// ─── Helper: add a box mesh to a group ───────────────────────────────────────
function box(w, h, d, mat, parent, px = 0, py = 0, pz = 0, rx = 0) {
    const m = new Mesh(new BoxGeometry(w, h, d), mat)
    m.position.set(px, py, pz)
    m.rotation.x = rx
    parent.add(m)
    return m
}

/**
 * Build a guitar Group.
 * @returns {{ group: Group, strings: Mesh[] }}
 *
 * Parts (top → bottom):
 *   neckGroup        neck, fretboard, nut, headstock + keys — shifted forward as a unit
 *   Neck pickup      thin black box just below fretboard end
 *   Bridge pickup    thin black box ~60% down the body
 *   Bridge           metal box, front face at stringZBr
 *   Body             ExtrudeGeometry from SplineCurve outline
 *   Strings (×6)     tilted, fanning from nut to bridge
 */
export function createGuitar() {
    const guitar = new Group()
    const strings = []
    const hits = []
    // Invisible, fatter twins of the strings for easy clicking/tapping.
    // If clicks never register, use { transparent: true, opacity: 0, depthWrite: false }.
    const hitMat = new MeshBasicMaterial({ visible: false })

    // ── Neck group: all neck parts shifted forward together ───────────────────
    // Shifting the group's z by NECK_Z_OFFSET puts the fretboard's front face
    // at bodyFront + 0.01, level with the body surface (bolt-on neck look).
    const neckGroup = new Group()
    neckGroup.position.z = NECK_Z_OFFSET
    guitar.add(neckGroup)

    // Neck backbone
    box(NECK_W, NECK_H, NECK_D, neckMat, neckGroup, 0, NECK_CY, 0)

    // Fretboard
    const FB_H = NECK_H - 0.1
    const FB_CY = NECK_CY - 0.05
    const FB_CZ = NECK_D / 2 + FB_D / 2
    box(NECK_W, FB_H, FB_D, fretboardMat, neckGroup, 0, FB_CY, FB_CZ)

    // Nut: tall enough that its top reaches stringZNut (in scene z, accounting for neckGroup offset)
    // nut top z (scene) = NECK_Z_OFFSET + FB_CZ + NUT_D/2 ≈ stringZNut
    // Just make the nut height match: box height in y is just a thin strip for appearance.
    const NUT_D = FB_D + 0.005
    box(NECK_W + 0.01, 0.04, NUT_D, nutMat, neckGroup, 0, NUT_Y, FB_CZ)

    // ── Headstock group (inside neckGroup — inherits the z offset + its own tilt) ──
    const HS_W = NECK_W * 1.6    // 0.48
    const HS_H = 0.8
    const HS_D = NECK_D + 0.02   // 0.17
    const plateHalfW = HS_W / 2        // 0.24

    const headstockGroup = new Group()
    headstockGroup.position.set(0, NECK_TOP_Y + HS_H / 2 + 0.02, 0)
    headstockGroup.rotation.x = -0.2
    neckGroup.add(headstockGroup)      // ← child of neckGroup, not guitar

    box(HS_W, HS_H, HS_D, headstockMat, headstockGroup)   // plate

    // Tuning keys — post + shaft + button, all added to headstockGroup
    const POST_R = 0.035
    const POST_H = 0.08
    const POST_FRONT_Z = HS_D / 2 + POST_H / 2 + 0.002
    const SHAFT_R = 0.012
    const SHAFT_LEN = 0.04
    const SHAFT_X = -(plateHalfW + SHAFT_LEN / 2)
    const BTN_W = 0.10
    const BTN_H = 0.07
    const BTN_D = 0.035
    const BTN_X = -(plateHalfW + 0.02 + BTN_W / 2)
    const KEY_SPACING = 0.11
    const KEY_START_Y = KEY_SPACING * 2.5

    for (let i = 0; i < 6; i++) {
        const py = KEY_START_Y - i * KEY_SPACING
        const POST_X = -plateHalfW + 0.09

        const post = new Mesh(new CylinderGeometry(POST_R, POST_R, POST_H, 12), pegMat)
        post.rotation.x = Math.PI / 2
        post.position.set(POST_X, py, POST_FRONT_Z)
        headstockGroup.add(post)

        const shaft = new Mesh(new CylinderGeometry(SHAFT_R, SHAFT_R, SHAFT_LEN, 8), pegMat)
        shaft.rotation.z = Math.PI / 2
        shaft.position.set(SHAFT_X, py, 0)
        headstockGroup.add(shaft)

        const btn = new Mesh(new BoxGeometry(BTN_W, BTN_H, BTN_D), pegMat)
        btn.position.set(BTN_X, py, 0)
        headstockGroup.add(btn)
    }

    // ── Body ──────────────────────────────────────────────────────────────────
    const rightPts = [
        [0, 0.8],
        [0.5, 0.95],
        [0.65, 0.5],
        [0.5, 0.05],
        [0.6, -0.4],
        [0.75, -0.85],
        [0.5, -1.2],
        [0, -1.3],
    ]
    const leftPts = [...rightPts].reverse().slice(1, -1).map(([x, y]) => [-x, y])
    const loopPts = [...rightPts, ...leftPts, rightPts[0]].map(([x, y]) => new Vector2(x, y))
    const smoothPts = new SplineCurve(loopPts).getPoints(120)
    const bodyShape = new Shape(smoothPts)

    const bodyGeo = new ExtrudeGeometry(bodyShape, {
        depth: BODY_DEPTH, bevelEnabled: true,
        bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3,
    })
    bodyGeo.translate(0, 0, -BODY_DEPTH / 2)

    const body = new Mesh(bodyGeo, bodyMat)
    body.position.y = BODY_OFFSET_Y
    guitar.add(body)

    // ── Pickups ───────────────────────────────────────────────────────────────
    const PU_W = NECK_W * 1.4   // 0.42
    // depth = pickupH, centred at bodyFront + pickupH/2 so top = pickupTop
    const PU_CZ = bodyFront + pickupH / 2

    const NECK_PU_Y = BODY_TOP_Y - 0.20
    const BRIDGE_PU_Y = BODY_TOP_Y - BODY_HEIGHT * 0.60
    box(PU_W, 0.16, pickupH, pickupMat, guitar, 0, NECK_PU_Y, PU_CZ)
    box(PU_W, 0.16, pickupH, pickupMat, guitar, 0, BRIDGE_PU_Y, PU_CZ)

    // ── Bridge ────────────────────────────────────────────────────────────────
    // Centred at bodyFront + 0.045, depth 0.09 → front face at bodyFront + 0.09 = stringZBr ✓
    const BR_W = NECK_W * 1.5   // 0.45
    const BR_H = 0.10
    const BR_D = 0.09
    const BR_CZ = bodyFront + BR_D / 2
    box(BR_W, BR_H, BR_D, pegMat, guitar, 0, BRIDGE_Y, BR_CZ)

    // ── Strings (fanning from nut to bridge) ──────────────────────────────────
    // Nut span = NECK_W * 0.8; bridge span = nut span * 1.3 (fan outward)
    const STRING_RADII = [0.014, 0.012, 0.010, 0.009, 0.008, 0.007]
    const NUT_SPAN = NECK_W * 0.80   // 0.240
    const BRIDGE_SPAN = NUT_SPAN * 1.30 // 0.312  — strings fan out toward bridge
    const up = new Vector3(0, 1, 0)

    for (let i = 0; i < 6; i++) {
        const r = STRING_RADII[i]
        // Evenly space at both ends (i / 5 goes from 0 → 1)
        const t = i / 5
        const sx = -NUT_SPAN / 2 + t * NUT_SPAN      // x at nut
        const bx = -BRIDGE_SPAN / 2 + t * BRIDGE_SPAN   // x at bridge (wider)

        const nutPt = new Vector3(sx, NUT_Y, stringZNut)
        const brgPt = new Vector3(bx, BRIDGE_Y, stringZBr)

        const dir = brgPt.clone().sub(nutPt)
        const len = dir.length()
        const mid = nutPt.clone().lerp(brgPt, 0.5)

        const mesh = new Mesh(new CylinderGeometry(r, r, len, 6), stringMat)
        mesh.position.copy(mid)
        mesh.quaternion.setFromUnitVectors(up, dir.clone().normalize())
        mesh.userData.index = i   // 0 = low E, 5 = high E
        guitar.add(mesh)
        strings.push(mesh)

        const hit = new Mesh(new CylinderGeometry(0.05, 0.05, len, 6), hitMat)
        hit.position.copy(mid)
        hit.quaternion.copy(mesh.quaternion)
        hit.userData.index = i
        guitar.add(hit)
        hits.push(hit)
    }

    return { group: guitar, strings, hits }
}
