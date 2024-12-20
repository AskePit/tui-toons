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

    // axis: normalized Vec3
    // angle: float
    #setRotationAround(axis, angle) {
        const x = axis.x, y = axis.y, z = axis.z
        const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c
    
        // Set up the rotation matrix
        this.elements.set([
            t * x * x + c,      t * x * y - s * z,  t * x * z + s * y,  0,
            t * y * x + s * z,  t * y * y + c,      t * y * z - s * x,  0,
            t * z * x - s * y,  t * z * y + s * x,  t * z * z + c,      0,
            0,                  0,                  0,                  1
        ])
    
        return this
    }

    // axis: normalized Vec3
    // angle: float
    rotateAroundWorldAxis(axis, angle) {
        // Create a rotation matrix around the world axis
        const rotation = new Matrix4x4().#setRotationAround(axis, angle)
        this.multiply(rotation)
    
        return this
    }

    // axis: normalized Vec3
    // angle: float
    rotateAroundLocalAxis(axis, angle) {
        const e = this.elements

        // Transform the local axis into world space
        const localAxis = new Vec3(
            axis.x * e[0] + axis.y * e[4] + axis.z * e[8],
            axis.x * e[1] + axis.y * e[5] + axis.z * e[9],
            axis.x * e[2] + axis.y * e[6] + axis.z * e[10]
        ).normalize()
    
        // Create a rotation matrix around the transformed local axis
        const rotation = new Matrix4x4().#setRotationAround(localAxis, angle)
        this.multiply(rotation)
    
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

const UP = new Vec3(0, 1, 0)
const DOWN = new Vec3(0, -1, 0)
const LEFT = new Vec3(0, -1, 0)
const RIGHT = new Vec3(0, 1, 0)
const TOWARDS_CAMERA = new Vec3(0, 0, 1)
const FROM_CAMERA = new Vec3(0, 0, -1)
