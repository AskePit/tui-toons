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

    translate(x, y, z) {
        const e = this.elements
        e[12] += x
        e[13] += y
        e[14] += z
        return this
    }

    scale(x, y, z) {
        const e = this.elements
        e[0] *= x
        e[5] *= y
        e[10] *= z
        return this
    }

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

    applyToVector(vec) {
        const e = this.elements
        const x = vec.x, y = vec.y, z = vec.z
        const w = 1.0

        return new Vec3(
            e[0] * x + e[4] * y + e[8] * z + e[12] * w,
            e[1] * x + e[5] * y + e[9] * z + e[13] * w,
            e[2] * x + e[6] * y + e[10] * z + e[14] * w
        )
    }

    lookAt(eye, target, up) {
        const zAxis = eye.clone().sub(target).normalize()
        const xAxis = up.clone().cross(zAxis).normalize()
        const yAxis = zAxis.clone().cross(xAxis)

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

        e[12] = -xAxis.dot(eye)
        e[13] = -yAxis.dot(eye)
        e[14] = -zAxis.dot(eye)
        e[15] = 1

        return this
    }

    clone() {
        const result = new Matrix4x4()
        result.elements.set(this.elements)
        return result
    }
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

    constructor() {
        this.viewportWidth = 4
        this.viewportHeight = 2
        this.focus = -1
    }

    getRay(u, v) {
        const direction = new Vec3(u*this.viewportWidth - this.viewportWidth/2, v*this.viewportHeight - this.viewportHeight/2, this.focus)
        return new Ray(new Vec3(0, 0, 0), direction)
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
        return new Vec3(BACKGROUND_LIGHT, BACKGROUND_LIGHT, BACKGROUND_LIGHT).mul(1 - t).add(new Vec3(BACKGROUND_DARK, BACKGROUND_DARK, BACKGROUND_DARK).mul(t))
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

for(let row = 0; row<HEIGHT; ++row) {
    for(let col = 0; col<WIDTH; ++col) {
        let c = new Vec3(0, 0, 0)
        const NS = 100
        for(let s = 0; s<NS; ++s) {
            const u = (col + Math.random()) / WIDTH
            const v = (row + Math.random()) / HEIGHT

            const ray = camera.getRay(u, v)
            c.add(color(ray, world))
        }
        c.div(NS)

        const r = 100*c.x
        const g = 100*c.y
        const b = 100*c.z
        const avg = (r + g + b) / 3

        builder.append(getGraySymbolHtml(INVERT_COLORS ? 100-avg : avg))
    }
    builder.append('<br>')
}

tui.innerHTML = builder.toString()