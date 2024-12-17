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

    length_squared() {
        return this.x*this.x + this.y*this.y + this.z*this.z
    }

    length() {
        return Math.sqrt(this.length_squared())
    }

    make_unit() {
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

// r: Ray
// world: HitableList
// return Vec3
function color(r, world) {
    const MAXFLOAT = 999999999999999;
    let hit = world.hit(r, 0.0, MAXFLOAT)

    if (hit) {
        return (new Vec3(hit.normal.x+1, hit.normal.y+1, hit.normal.z+1)).mul(0.5)
    } else {
        const unitDirection = r.direction.make_unit()
        t = 0.5*(unitDirection.y + 1.0)
        const BACKGROUND_LIGHT = 1
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

let builder = new StringBuilder()

for(let row = 0; row<HEIGHT; ++row) {
    for(let col = 0; col<WIDTH; ++col) {
        const u = col / WIDTH
        const v = row / HEIGHT

        const direction = lowerLeftCorner.clone().add(horizontal.clone().mul(u)).add(vertical.clone().mul(v))
        const ray = new Ray(origin, direction)
        
        const p = ray.pointAt(2)
        const c = color(ray, world)

        const r = 100*c.x
        const g = 100*c.y
        const b = 100*c.z
        const avg = (r + g + b) / 3

        builder.append(getGraySymbol(INVERT_COLORS ? 100-avg : avg))
    }
    builder.append('<br>')
}

tui.innerHTML = builder.toString()