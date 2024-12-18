// x: float
// y: float
// z: float
class Vec3 {
    x // float
    y // float
    z // float

    constructor(x, y, z) {
        this.x = x
        this.y = y
        this.z = z
    }

    negate() {
        this.x = -this.x
        this.y = -this.y
        this.z = -this.z

        return this
    }

    at(i) {
        if (i == 0) {return x}
        if (i == 1) {return y}
        if (i == 2) {return y}
    }

    add(other) {
        this.x += other.x
        this.y += other.y
        this.z += other.z

        return this
    }

    sub(other) {
        this.x -= other.x
        this.y -= other.y
        this.z -= other.z

        return this
    }

    mul(coef) {
        this.x *= coef
        this.y *= coef
        this.z *= coef

        return this
    }

    div(coef) {
        this.x /= coef
        this.y /= coef
        this.z /= coef

        return this
    }

    lengthSquared() {
        return this.x*this.x + this.y*this.y + this.z*this.z
    }

    length() {
        return Math.sqrt(this.lengthSquared())
    }

    normalize() {
        this.div(this.length())
        return this
    }

    clone() {
        return new Vec3(this.x, this.y, this.z)
    }
}

// v1: Vec3
// v2: Vec3
// return float
function dot(v1, v2) {
    return v1.x*v2.x + v1.y*v2.y + v1.z*v2.z
}

// v1: Vec3
// v2: Vec3
// return Vec3
function cross(v1, v2) {
    return new Vec3(
        v1.y*v2.z - v1.z*v2.y,
       -v1.x*v2.z - v1.z*v2.x,
        v1.x*v2.y - v1.y*v2.x
    )
}

class Ray {
    origin // Vec3
    direction // Vec3

    constructor(origin, direction) {
        this.origin = origin
        this.direction = direction
    }

    // return Vec3
    pointAt(t) {
        return this.origin.clone().add(this.direction.clone().mul(t))
    }
}

class Matrix4x4 {
    elements // Float32Array(16)

    constructor() {
        this.elements = new Float32Array(16)
        this.identity()
    }

    identity() {
        const e = this.elements
        e.fill(0)
        e[0] = e[5] = e[10] = e[15] = 1
        return this
    }

    // v: Vec3
    translate(v) {
        const e = this.elements
        e[12] += v.x
        e[13] += v.y
        e[14] += v.z
        return this
    }

    // s: float
    scale(s) {
        const e = this.elements
        e[0] *= s
        e[5] *= s
        e[10] *= s
        return this
    }

    // angle: float
    rotateX(angle) {
        const e = this.elements
        const c = Math.cos(angle)
        const s = Math.sin(angle)

        const m10 = e[4], m11 = e[5], m12 = e[6], m13 = e[7]
        const m20 = e[8], m21 = e[9], m22 = e[10], m23 = e[11]

        e[4] = c * m10 + s * m20
        e[5] = c * m11 + s * m21
        e[6] = c * m12 + s * m22
        e[7] = c * m13 + s * m23

        e[8] = c * m20 - s * m10
        e[9] = c * m21 - s * m11
        e[10] = c * m22 - s * m12
        e[11] = c * m23 - s * m13

        return this
    }

    // angle: float
    rotateY(angle) {
        const e = this.elements
        const c = Math.cos(angle)
        const s = Math.sin(angle)

        const m00 = e[0], m01 = e[1], m02 = e[2], m03 = e[3]
        const m20 = e[8], m21 = e[9], m22 = e[10], m23 = e[11]

        e[0] = c * m00 - s * m20
        e[1] = c * m01 - s * m21
        e[2] = c * m02 - s * m22
        e[3] = c * m03 - s * m23

        e[8] = c * m20 + s * m00
        e[9] = c * m21 + s * m01
        e[10] = c * m22 + s * m02
        e[11] = c * m23 + s * m03

        return this
    }

    // angle: float
    rotateZ(angle) {
        const e = this.elements
        const c = Math.cos(angle)
        const s = Math.sin(angle)

        const m00 = e[0], m01 = e[1], m02 = e[2], m03 = e[3]
        const m10 = e[4], m11 = e[5], m12 = e[6], m13 = e[7]

        e[0] = c * m00 + s * m10
        e[1] = c * m01 + s * m11
        e[2] = c * m02 + s * m12
        e[3] = c * m03 + s * m13

        e[4] = c * m10 - s * m00
        e[5] = c * m11 - s * m01
        e[6] = c * m12 - s * m02
        e[7] = c * m13 - s * m03

        return this
    }

    rotateAround(axis, angle) {
        const { x, y, z } = axis.normalize() // Ensure the axis is a unit vector
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        const t = 1 - c
    
        // Rotation matrix components
        const m00 = t * x * x + c
        const m01 = t * x * y - s * z
        const m02 = t * x * z + s * y
        const m10 = t * x * y + s * z
        const m11 = t * y * y + c
        const m12 = t * y * z - s * x
        const m20 = t * x * z - s * y
        const m21 = t * y * z + s * x
        const m22 = t * z * z + c
    
        const rotationMatrix = new Matrix4x4()
        const e = rotationMatrix.elements
    
        // Fill the rotation matrix
        e[0] = m00
        e[1] = m01
        e[2] = m02
        e[3] = 0
    
        e[4] = m10
        e[5] = m11
        e[6] = m12
        e[7] = 0
    
        e[8] = m20
        e[9] = m21
        e[10] = m22
        e[11] = 0
    
        e[12] = 0
        e[13] = 0
        e[14] = 0
        e[15] = 1
    
        // Multiply the current matrix by the rotation matrix
        this.multiply(rotationMatrix)
        return this
    }

    moveBackward(step) {
        const e = this.elements
    
        // Extract the local z-axis direction from the matrix
        const localZ = new Vec3(e[8], e[9], e[10]).normalize()
    
        // Calculate the translation vector
        const translation = localZ.mul(step)
    
        // Apply the translation to the current matrix
        this.translate(translation)
        return this
    }

    moveForward(step) {
        return this.moveBackward(-step)
    }
    
    moveLeft(step) {
        const e = this.elements
    
        // Extract the local X-axis direction from the matrix
        const localX = new Vec3(e[0], e[1], e[2]).normalize()
    
        // Calculate the translation vector
        const translation = localX.mul(-step) // Negative direction for left
    
        // Apply the translation
        this.translate(translation)
        return this
    }
    
    moveRight(step) {
        return this.moveLeft(-step)
    }
    
    moveDown(step) {
        const e = this.elements
    
        // Extract the local Y-axis direction from the matrix
        const localY = new Vec3(e[4], e[5], e[6]).normalize()
    
        // Calculate the translation vector
        const translation = localY.mul(step) // Positive direction for up
    
        // Apply the translation
        this.translate(translation)
        return this
    }
    
    moveUp(step) {
        return this.moveDown(-step)
    }

    // other: Matrix4z4
    multiply(other) {
        const a = this.elements
        const b = other.elements
        const result = new Float32Array(16)

        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i + j * 4] =
                    a[i] * b[j * 4] +
                    a[i + 4] * b[j * 4 + 1] +
                    a[i + 8] * b[j * 4 + 2] +
                    a[i + 12] * b[j * 4 + 3]
            }
        }

        this.elements = result
        return this
    }

    // vec: Vec3 as a point
    // return Vec3
    applyToPoint(point) {
        const e = this.elements
        const x = point.x, y = point.y, z = point.z
    
        return new Vec3(
            e[0] * x + e[4] * y + e[8] * z + e[12],
            e[1] * x + e[5] * y + e[9] * z + e[13],
            e[2] * x + e[6] * y + e[10] * z + e[14]
        )
    }
    
    // vec: Vec3 as a vector/direction
    // return Vec3
    applyToVector(vec) {
        const e = this.elements
        const x = vec.x, y = vec.y, z = vec.z
    
        return new Vec3(
            e[0] * x + e[4] * y + e[8] * z,
            e[1] * x + e[5] * y + e[9] * z,
            e[2] * x + e[6] * y + e[10] * z
        )
    }

    // ray: Ray
    // return Ray
    applyToRay(ray) {
        return new Ray(this.applyToPoint(ray.origin), this.applyToVector(ray.direction))
    }

    // eye: Vec3
    // target: Vec3
    // up: Vec3
    lookAt(eye, target, up) {
        const zAxis = eye.clone().sub(target).normalize()
        const xAxis = cross(up.clone(), zAxis).normalize()
        const yAxis = cross(zAxis.clone(), xAxis)

        const e = this.elements
        e[0] = xAxis.x
        e[1] = yAxis.x
        e[2] = zAxis.x
        e[3] = 0

        e[4] = xAxis.y
        e[5] = yAxis.y
        e[6] = zAxis.y
        e[7] = 0

        e[8] = xAxis.z
        e[9] = yAxis.z
        e[10] = zAxis.z
        e[11] = 0

        e[12] = dot(-xAxis, eye)
        e[13] = dot(-yAxis, eye)
        e[14] = dot(-zAxis, eye)
        e[15] = 1

        return this
    }

    clone() {
        const result = new Matrix4x4()
        result.elements.set(this.elements)
        return result
    }
}

class HitRecord {
    t // float
    p // Vec3
    normal // Vec3
}

class Hitable {

    // ray: Ray
    // tMin: float
    // tMax: float
    // return HitRecord ot null
    hit(ray, tMin, tMax) {
        return false;
    }
}

class Sphere extends Hitable {
    center // Vec3
    radius // float

    constructor(center, radius) {
        super()
        this.center = center
        this.radius = radius
    }

    // ray: Ray
    // tMin: float
    // tMax: float
    // return HitRecord ot null
    hit(ray, tMin, tMax) {
        const oc = ray.origin.clone().sub(this.center)
        const a = dot(ray.direction, ray.direction)
        const b = 2 * dot(oc, ray.direction)
        const c = dot(oc, oc) - this.radius*this.radius
        const d = b*b - 4*a*c

        if (d > 0) {
            let temp = (-b - Math.sqrt(d))/a
            if (temp < tMax && temp > tMin) {
                let rec = new HitRecord()
                rec.t = temp
                rec.p = ray.pointAt(rec.t)
                rec.normal = rec.p.clone().sub(this.center).div(this.radius)
                return rec
            }

            temp = (-b + Math.sqrt(d))/a

            if (temp < tMax && temp > tMin) {
                let rec = new HitRecord()
                rec.t = temp
                rec.p = ray.pointAt(rec.t)
                rec.normal = rec.p.clone().sub(this.center).div(this.radius)
                return rec
            }
        }

        return null
    }
}

class HitableList extends Hitable {
    hitables // array[Hitable]

    // hitables: array[Hitable]
    constructor(hitables) {
        super()
        this.hitables = hitables
    }

    // ray: Ray
    // tMin: float
    // tMax: float
    // return HitRecord ot null
    hit(ray, tMin, tMax) {
        let rec = null;
        let tempRec = null

        let closest = tMax

        for(let i = 0; i<this.hitables.length; ++i) {
            tempRec = this.hitables[i].hit(ray, tMin, closest)
            if (tempRec) {
                closest = tempRec.t
                rec = tempRec
            }
        }

        return rec
    }
}

class Camera {
    viewportWidth // float
    viewportHeight // float
    focus // float
    transform // Matrix4x4

    constructor() {
        this.viewportWidth = 4
        this.viewportHeight = 2
        this.focus = -1
        this.transform = new Matrix4x4()
    }

    getRay(u, v) {
        const direction = new Vec3(u*this.viewportWidth - this.viewportWidth/2, v*this.viewportHeight - this.viewportHeight/2, this.focus)
        return this.transform.applyToRay(new Ray(new Vec3(0, 0, 0), direction))
    }
}

// r: Ray
// world: HitableList
// return Vec3
function color(r, world) {
    const MAXFLOAT = 999999999999999;
    let hit = world.hit(r, 0.0, MAXFLOAT)

    if (hit) {
        return (new Vec3(hit.normal.x+1, hit.normal.y+1, hit.normal.z+1)).mul(0.5)
    } else {
        const unitDirection = r.direction.normalize()
        t = 0.5*(unitDirection.y + 1.0)
        const BACKGROUND_LIGHT = 0
        const BACKGROUND_DARK = 0
        if (BACKGROUND_LIGHT == BACKGROUND_DARK) {
            return new Vec3(BACKGROUND_LIGHT, BACKGROUND_LIGHT, BACKGROUND_LIGHT)
        } else {
            return new Vec3(BACKGROUND_LIGHT, BACKGROUND_LIGHT, BACKGROUND_LIGHT).mul(1 - t).add(new Vec3(BACKGROUND_DARK, BACKGROUND_DARK, BACKGROUND_DARK).mul(t))
        }
        
    }
}

const INVERT_COLORS = false;

const lowerLeftCorner = new Vec3(-2, -1, -1)
const horizontal = new Vec3(4, 0, 0)
const vertical = new Vec3(0, 2, 0)
const origin = new Vec3(0, 0, 0)

const world = new HitableList([
    new Sphere(new Vec3(-1, -0.6, -3), 1.5),
    new Sphere(new Vec3(0, 0, -1.5), 0.7),
    new Sphere(new Vec3(0.3, 0.3, -0.7), 0.18)
])

const camera = new Camera()
let builder = new StringBuilder()

function render() {
    builder.clear()

    for(let row = 0; row<HEIGHT; ++row) {
        for(let col = 0; col<WIDTH; ++col) {
            // NOTE: Too expensive!
            //
            // let c = new Vec3(0, 0, 0)
            // const NS = 10
            // for(let s = 0; s<NS; ++s) {
            //     const u = (col + Math.random()) / WIDTH
            //     const v = (row + Math.random()) / HEIGHT
    
            //     const ray = camera.getRay(u, v)
            //     c.add(color(ray, world))
            // }
            // c.div(NS)

            const u = col / WIDTH
            const v = row / HEIGHT
            const ray = camera.getRay(u, v)
            const c = color(ray, world)
    
            const r = 100*c.x
            const g = 100*c.y
            const b = 100*c.z
            //const avg = 29.9*c.x + 58.7*c.y + 11.4*c.z
            const avg = (r + g + b) / 3
    
            builder.append(getGraySymbolHtml(INVERT_COLORS ? 100-avg : avg))
        }
        builder.append('<br>')
    }
    
    tui.innerHTML = builder.toString()
}

const UP = new Vec3(0, 1, 0)

const MOUSE_SENSITIVITY = 0.01
const KEYBOARD_SENSITIVITY = 0.1
const KEY_COOLDOWN_MS = 1


let lastPressTime = Date.now()

document.onkeydown = (el) => {
    if (!['w', 's', 'd', 'a', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].some((e) => e == el.key)) {
        return
    }

    const time = Date.now()
    const dt = time - lastPressTime
    if (dt < KEY_COOLDOWN_MS) {
        return
    }

    if (el.key == 'w') {
        camera.transform.moveForward(KEYBOARD_SENSITIVITY)
    } else if (el.key == 's') {
        camera.transform.moveBackward(KEYBOARD_SENSITIVITY)
    } else if (el.key == 'a') {
        camera.transform.moveLeft(KEYBOARD_SENSITIVITY)
    } else if (el.key == 'd') {
        camera.transform.moveRight(KEYBOARD_SENSITIVITY)
    } else if (el.key == 'ArrowUp') {
        camera.transform.rotateX(-KEYBOARD_SENSITIVITY)
    } else if (el.key == 'ArrowDown') {
        camera.transform.rotateX(KEYBOARD_SENSITIVITY)
    } else if (el.key == 'ArrowLeft') {
        camera.transform.rotateAround(UP, -KEYBOARD_SENSITIVITY)
    } else if (el.key == 'ArrowRight') {
        camera.transform.rotateAround(UP, KEYBOARD_SENSITIVITY)
    }

    render()
    lastPressTime = time
}

let rotateCamera = false

tui.onmousedown = (el) => {
    rotateCamera = true
}

tui.onmouseup = (el) => {
    rotateCamera = false
}

tui.onmousemove = (el) => {
    if (!rotateCamera) {
        return
    }
    camera.transform.rotateAround(UP, el.movementX * MOUSE_SENSITIVITY)
    camera.transform.rotateX(el.movementY * MOUSE_SENSITIVITY)
    render()
}

render()
