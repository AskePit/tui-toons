class Material {
    // inRay: Ray
    // hit: HitRecord
    // return [attenuation: Vec3, scattered: Ray]
    scatter(inRay, hit) {
        return [new Vec3(0, 0, 0), null]
    }
}

// return Vec3
function randomInUnitSphere() {
    let p = new Vec3(0, 0, 0)

    do {
        p = (new Vec3(Math.random(), Math.random(), Math.random())).mul(2).sub(new Vec3(1, 1, 1))
    } while(p.lengthSquared() >= 1)

    return p
}

class Lambertian extends Material {
    albedo // Vec3

    constructor(albedo) {
        super()
        this.albedo = albedo
    }

    // inRay: Ray
    // hit: HitRecord
    // return [attenuation: Vec3, scattered: Ray]
    scatter(inRay, hit) {
        const target = hit.p.clone().add(hit.normal).add(randomInUnitSphere())
        const scattered = new Ray(hit.p.clone(), target.sub(hit.p))
        const attenuation = this.albedo
        return [attenuation, scattered]
    }
}

// v: Vec3
// n: Vec3
// return Vec3
function reflect(v, n) {
    return v.clone().sub(n.clone().mul(2*dot(v, n)))
}

class Metal extends Material {
    albedo // Vec3
    fuzz // float

    constructor(albedo, fuzz) {
        super()
        this.albedo = albedo
        this.fuzz = fuzz < 1 ? fuzz : 1
    }

    // inRay: Ray
    // hit: HitRecord
    // return [attenuation: Vec3, scattered: Ray]
    scatter(inRay, hit) {
        const reflected = reflect(inRay.direction.clone().normalize(), hit.normal)
        const scattered = new Ray(hit.p.clone(), reflected.add(randomInUnitSphere().mul(this.fuzz)))
        const doScatter = dot(scattered.direction, hit.normal) < 0
        return doScatter ? [this.albedo.clone(), scattered] : [new Vec3(0, 0, 0), null]
    }
}

class HitRecord {
    t // float
    p // Vec3
    normal // Vec3
    material // Material
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

const ORBIT_DT = 30 // ms

class Sphere extends Hitable {
    center // Vec3
    radius // float
    material // Material

    orbitTransform // Matrix4x4
    orbitRadius // float, m
    orbitingSpeed // float, %/s
    orbitingProgress // float, %

    constructor(center, radius, material) {
        super()
        this.center = center
        this.radius = radius
        this.material = material
        return this
    }

    // origin: Vec3
    // rotation: Vec3
    // speed: float
    setOrbitParams(origin, radius, rotation, speed) {
        this.orbitingProgress = 0
        this.orbitingSpeed = speed
        this.orbitRadius = radius

        this.orbitTransform = new Matrix4x4()
        this.orbitTransform.translate(origin)
        this.orbitTransform.rotateX(rotation.x)
        this.orbitTransform.rotateY(rotation.y)
        this.orbitTransform.rotateZ(rotation.z)

        setInterval(() => this.rotationUpdate(), ORBIT_DT)

        return this
    }

    rotationUpdate() {
        const orbitProgressDt = ORBIT_DT / 1000 * this.orbitingSpeed
        this.orbitingProgress += orbitProgressDt
        this.orbitingProgress %= 100

        const angle = 2*Math.PI * this.orbitingProgress / 100
        const localX = this.orbitRadius * Math.cos(angle)
        const localY = this.orbitRadius * Math.sin(angle)
        const localZ = 0

        const localPoint = new Vec3(localX, localY, localZ)
        this.center = this.orbitTransform.applyToPoint(localPoint)
        render()
    }

    setRandomOrbitParams() {
        const MIN_SPEED = 10
        const MAX_SPEED = 50

        const MIN_RADIUS = 4
        const MAX_RADIUS = 10

        return this.setOrbitParams(ZERO_VEC, getRandomFloat(MIN_RADIUS, MAX_RADIUS), new Vec3(Math.random()*2*Math.PI, Math.random()*2*Math.PI, Math.random()*2*Math.PI), getRandomFloat(MIN_SPEED, MAX_SPEED))
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
                rec.material = this.material
                return rec
            }

            temp = (-b + Math.sqrt(d))/a

            if (temp < tMax && temp > tMin) {
                let rec = new HitRecord()
                rec.t = temp
                rec.p = ray.pointAt(rec.t)
                rec.normal = rec.p.clone().sub(this.center).div(this.radius)
                rec.material = this.material
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

const NORMALS = 0
const MATERIALS = 1
const RENDER_MODE = MATERIALS

function ambientColor(r) {
    const unitDirection = r.direction.clone().normalize()
    t = 0.5*(unitDirection.y + 1.0)
    const BACKGROUND_LIGHT = 1
    const BACKGROUND_DARK = 0
    return new Vec3(BACKGROUND_LIGHT, BACKGROUND_LIGHT, BACKGROUND_LIGHT).mul(1 - t).add(new Vec3(BACKGROUND_DARK, BACKGROUND_DARK, BACKGROUND_DARK).mul(t))
}

function fakeAmbientColor() {
    const BACKGROUND_BRIGHTNESS = 0
    return new Vec3(BACKGROUND_BRIGHTNESS, BACKGROUND_BRIGHTNESS, BACKGROUND_BRIGHTNESS)
}

// r: Ray
// world: HitableList
// return Vec3
function color(r, world, depth) {
    const MAXFLOAT = 999999999999999;
    let hit = world.hit(r, 0.001, MAXFLOAT)

    if (!hit) {
        // We do not want our ASCII-screen be rubbished by ambient noise, but
        // we do want ambient influence our spheres. So do not show ambient
        // on a hit miss, but make it influence reflections and refractions
        if (depth > 0) {
            return ambientColor(r)
        } else {
            return fakeAmbientColor()
        }
    }

    if (RENDER_MODE == NORMALS) {
        return (new Vec3(hit.normal.x+1, hit.normal.y+1, hit.normal.z+1)).mul(0.5)
    }

    // RENDER_MODE == MATERIALS

    const REFLECTIONS_COUNT = 4

    if (depth >= REFLECTIONS_COUNT) {
        return ambientColor(r)
    }

    const [attenuation, scattered] = hit.material.scatter(r, hit)
    if (!scattered) {
        return ambientColor(r)
    }

    return color(scattered, world, depth + 1).mulVec(attenuation)
}

const INVERT_COLORS = false;

const world = new HitableList([
    new Sphere(new Vec3(-1, -0.6, -3), 1.5, new Lambertian(new Vec3(0.4, 0.4, 0.4))),
    new Sphere(new Vec3(0, 0, -1.5), 0.7, new Metal(new Vec3(1, 0.6, 0.6), 0.2)),
    new Sphere(new Vec3(0.3, 0.3, -0.7), 0.18, new Metal(new Vec3(0.8, 0.8, 0.8), 0.1)),
])

const camera = new Camera()
let builder = new StringBuilder()

function render() {
    builder.clear()

    for(let row = HEIGHT-1; row>=0; --row) {
        for(let col = 0; col<WIDTH; ++col) {
            // NOTE: Too expensive!
            //
            // let c = new Vec3(0, 0, 0)
            // const NS = 10
            // for(let s = 0; s<NS; ++s) {
            //     const u = (col + Math.random()) / WIDTH
            //     const v = (row + Math.random()) / HEIGHT
    
            //     const ray = camera.getRay(u, v)
            //     c.add(color(ray, world, 0))
            // }
            // c.div(NS)

            const u = col / WIDTH
            const v = row / HEIGHT
            const ray = camera.getRay(u, v)
            let c = color(ray, world, 0)

            if (c.x === NaN || c.y === NaN || c.z === NaN) {
                console.log(c)
            }

            if (RENDER_MODE != NORMALS) {
                c = new Vec3(Math.sqrt(c.x), Math.sqrt(c.y), Math.sqrt(c.z))
            }

            clampColor(c)
    
            const r = 100*c.x
            const g = 100*c.y
            const b = 100*c.z
            // const avg = 29.9*c.x + 58.7*c.y + 11.4*c.z
            const avg = (r + g + b) / 3

            builder.append(getGraySymbolHtml(INVERT_COLORS ? 100-avg : avg))
        }
        builder.append('<br>')
    }
    
    tui.innerHTML = builder.toString()
}

const MOUSE_SENSITIVITY = 0.01
const WHEEL_SENSITIVITY = 0.001
const KEYBOARD_SENSITIVITY = 0.1
const KEY_COOLDOWN_MS = 1

let lastPressTime = Date.now()

document.onkeydown = (el) => {
    if (!['w', 's', 'd', 'a', 'q', 'e', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].some((e) => e == el.key)) {
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
    } else if (el.key == 'q') {
        camera.transform.moveDown(KEYBOARD_SENSITIVITY)
    } else if (el.key == 'e') {
        camera.transform.moveUp(KEYBOARD_SENSITIVITY)
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

tui.onwheel = (el) => {
    camera.focus += el.deltaY * WHEEL_SENSITIVITY
    render()
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
    camera.transform.rotateAroundWorldAxis(UP, el.movementX * MOUSE_SENSITIVITY)
    camera.transform.rotateX(-el.movementY * MOUSE_SENSITIVITY)
    render()
}

render()
