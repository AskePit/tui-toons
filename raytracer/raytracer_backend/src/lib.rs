#![allow(dead_code)]

mod wasm_layer;

use getrandom::getrandom;
use glam::{vec3, Affine3A, EulerRot, Mat3A, Quat, Vec3};
use std::cmp::PartialEq;
use std::f32::consts::PI;
use std::fmt::Debug;
use std::sync::Arc;

#[derive(Clone, Debug)]
pub struct HitRecord {
    pub t: f32,
    pub p: Vec3,
    pub normal: Vec3,
    pub material: Arc<dyn Material>,
}

#[derive(Copy, Clone, Debug)]
pub struct Ray {
    origin: Vec3,
    direction: Vec3,
}

impl Ray {
    fn new(origin: Vec3, direction: Vec3) -> Self {
        Ray { origin, direction }
    }

    fn point_at(&self, t: f32) -> Vec3 {
        self.origin + t * self.direction
    }
}

pub trait Material: Debug {
    fn scatter(&self, _in_ray: &Ray, _hit: &HitRecord) -> Option<(Vec3, Ray)> {
        None
    }
}

fn rand_unit() -> f32 {
    let mut buf = [0u8; 4];
    getrandom(&mut buf).expect("Failed to generate random bytes");

    // Convert bytes to u32
    let random_u32 = u32::from_ne_bytes(buf);

    // Convert u32 to f32 in the range [0.0, 1.0]
    random_u32 as f32 / (u32::MAX - 1) as f32
}

fn rand_min_max(min: f32, max: f32) -> f32 {
    let unit = rand_unit();
    min + unit * (max - min)
}

// return Vec3
fn random_in_unit_sphere() -> Vec3 {
    let mut p;

    loop {
        p = (Vec3::new(rand_unit(), rand_unit(), rand_unit())) * 2.0 - Vec3::ONE;
        if p.length_squared() >= 1.0 {
            break;
        }
    }

    p
}

#[derive(Clone, Debug)]
pub struct Lambertian {
    albedo: Vec3,
}

impl Lambertian {
    pub fn new(albedo: Vec3) -> Self {
        Lambertian { albedo }
    }
}

impl Material for Lambertian {
    fn scatter(&self, _in_ray: &Ray, hit: &HitRecord) -> Option<(Vec3, Ray)> {
        let target = hit.p + hit.normal + random_in_unit_sphere();
        let scattered = Ray::new(hit.p, target - hit.p);

        Some((self.albedo, scattered))
    }
}

#[derive(Clone, Debug)]
pub struct Metal {
    albedo: Vec3,
    fuzz: f32,
}

impl Metal {
    pub fn new(albedo: Vec3, fuzz: f32) -> Self {
        Metal {
            albedo,
            fuzz: if fuzz < 1.0 { fuzz } else { 1.0 },
        }
    }
}

impl Material for Metal {
    fn scatter(&self, in_ray: &Ray, hit: &HitRecord) -> Option<(Vec3, Ray)> {
        let reflected = in_ray.direction.normalize().reflect(hit.normal);
        let scattered = Ray::new(hit.p, reflected + self.fuzz * random_in_unit_sphere());
        if scattered.direction.dot(hit.normal) < 0.0 {
            Some((self.albedo, scattered))
        } else {
            None
        }
    }
}

fn schlick(cosine: f32, refraction_index: f32) -> f32 {
    let mut r0 = (1.0 - refraction_index) / (1.0 + refraction_index);
    r0 = r0 * r0;
    r0 + (1.0 - r0) * (1.0 - cosine).powi(5)
}

#[derive(Clone, Debug)]
pub struct Dielectric {
    refraction_index: f32,
}

impl Dielectric {
    pub fn new(refraction_index: f32) -> Self {
        Dielectric { refraction_index }
    }
}

impl Material for Dielectric {
    fn scatter(&self, in_ray: &Ray, hit: &HitRecord) -> Option<(Vec3, Ray)> {
        let outward_normal;
        let ni_over_nt;
        let reflected = in_ray.direction.reflect(hit.normal);
        let cosine;

        if in_ray.direction.dot(hit.normal) > 0.0 {
            outward_normal = -hit.normal;
            ni_over_nt = self.refraction_index;
            cosine = self.refraction_index * in_ray.direction.dot(hit.normal)
                / in_ray.direction.length();
        } else {
            outward_normal = hit.normal;
            ni_over_nt = 1.0 / self.refraction_index;
            cosine = -in_ray.direction.dot(hit.normal) / in_ray.direction.length();
        }

        let refracted = in_ray.direction.refract(outward_normal, ni_over_nt);
        let reflect_prob = if refracted != Vec3::ZERO {
            schlick(cosine, self.refraction_index)
        } else {
            1.0
        };

        let scattered = if rand_unit() < reflect_prob {
            Ray::new(hit.p, reflected)
        } else {
            Ray::new(hit.p, refracted)
        };

        Some((Vec3::ONE, scattered))
    }
}

pub trait Hitable: Debug {
    fn hit(&self, _ray: &Ray, _t_min: f32, _t_max: f32) -> Option<HitRecord> {
        None
    }
}

const ORBIT_DT: usize = 30; // ms

#[derive(Clone, Debug)]
pub struct Sphere {
    center: Vec3,
    radius: f32,
    material: Arc<dyn Material>,
}

impl Sphere {
    pub fn new(center: Vec3, radius: f32, material: Arc<dyn Material>) -> Self {
        Sphere {
            center,
            radius,
            material,
        }
    }
}

impl Hitable for Sphere {
    fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> Option<HitRecord> {
        let oc = ray.origin - self.center;
        let a = ray.direction.dot(ray.direction);
        let b = 2.0 * oc.dot(ray.direction);
        let c = oc.dot(oc) - self.radius * self.radius;
        let d = b * b - 4.0 * a * c;

        if d > 0.0 {
            let mut temp = (-b - d.sqrt()) / a;
            if temp < t_max && temp > t_min {
                let p = ray.point_at(temp);
                let normal = (p - self.center) / self.radius;
                let material = self.material.clone();

                return Some(HitRecord {
                    p,
                    t: temp,
                    normal,
                    material,
                });
            }

            temp = (-b + d.sqrt()) / a;
            if temp < t_max && temp > t_min {
                let p = ray.point_at(temp);
                let normal = (p - self.center) / self.radius;
                let material = self.material.clone();

                return Some(HitRecord {
                    p,
                    t: temp,
                    normal,
                    material,
                });
            }
        }

        None
    }
}

#[derive(Clone, Debug)]
pub struct Plane {
    point: Vec3,
    normal: Vec3,
    material: Arc<dyn Material>,
}

impl Plane {
    fn new(point: Vec3, normal: Vec3, material: Arc<dyn Material>) -> Self {
        Plane {
            point,
            normal,
            material,
        }
    }
}

impl Hitable for Plane {
    fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> Option<HitRecord> {
        let denom = self.normal.dot(ray.direction);
        if denom == 0.0 {
            return None;
        }
        let numer = self.normal.dot(self.point - ray.origin);

        let t = numer / denom;
        if t < t_min || t > t_max {
            return None;
        }

        Some(HitRecord {
            t,
            p: ray.point_at(t),
            normal: self.normal,
            material: self.material.clone(),
        })
    }
}

#[derive(Clone, Debug)]
pub struct Cube {
    center: Vec3,
    size: f32,
    half: f32,
    rotation: Quat,
    inverse_rotation: Quat,
    planes: [Plane; 6],
    material: Arc<dyn Material>,
}

const CUBE_IGNORED_BOUNDS: [u8; 6] = [1, 1, 2, 2, 0, 0];

impl Cube {
    fn new(center: Vec3, size: f32, rotation: Quat, material: Arc<dyn Material>) -> Self {
        let half = size / 2.0;

        Self {
            center,
            size,
            half,
            rotation,
            inverse_rotation: rotation.inverse(),
            planes: [
                Plane::new(vec3(0.0, half, 0.0), vec3(0.0, 1.0, 0.0), material.clone()),
                Plane::new(
                    vec3(0.0, -half, 0.0),
                    vec3(0.0, -1.0, 0.0),
                    material.clone(),
                ),
                Plane::new(vec3(0.0, 0.0, half), vec3(0.0, 0.0, 1.0), material.clone()),
                Plane::new(
                    vec3(0.0, 0.0, -half),
                    vec3(0.0, 0.0, -1.0),
                    material.clone(),
                ),
                Plane::new(
                    vec3(-half, 0.0, 0.0),
                    vec3(-1.0, 0.0, 0.0),
                    material.clone(),
                ),
                Plane::new(vec3(half, 0.0, 0.0), vec3(1.0, 0.0, 0.0), material.clone()),
            ],
            material,
        }
    }
}

impl Hitable for Cube {
    fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> Option<HitRecord> {
        let local_ray = Ray::new(
            self.inverse_rotation.mul_vec3(ray.origin - self.center),
            self.inverse_rotation.mul_vec3(ray.direction),
        );

        let mut rec = None;
        let mut closest = t_max;

        for i in 0..6 {
            let tmp_rec = self.planes[i].hit(&local_ray, t_min, closest);
            if tmp_rec.is_none() {
                continue;
            }
            let tmp_rec = tmp_rec.unwrap();

            let mut bounds_check = true;
            for bound in 0..3 {
                if bound == CUBE_IGNORED_BOUNDS[i] {
                    continue;
                }

                if bound == 0 {
                    if tmp_rec.p.x < -self.half || tmp_rec.p.x > self.half {
                        bounds_check = false;
                        break;
                    }
                } else if bound == 1 {
                    if tmp_rec.p.y < -self.half || tmp_rec.p.y > self.half {
                        bounds_check = false;
                        break;
                    }
                } else if bound == 2 {
                    if tmp_rec.p.z < -self.half || tmp_rec.p.z > self.half {
                        bounds_check = false;
                        break;
                    }
                }
            }

            if bounds_check {
                closest = tmp_rec.t;
                rec = Some(tmp_rec);
            }
        }

        if let Some(ref mut rec) = &mut rec {
            rec.p = self.rotation.mul_vec3(rec.p) + self.center;
            rec.normal = self.rotation.mul_vec3(rec.normal).normalize();
        }

        rec
    }
}

#[derive(Debug)]
pub struct HitablesList {
    pub hitables: Vec<Box<dyn Hitable>>,
}

impl HitablesList {
    pub fn new(hitables: Vec<Box<dyn Hitable>>) -> Self {
        HitablesList { hitables }
    }
}

impl Hitable for HitablesList {
    fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> Option<HitRecord> {
        let mut rec = None;
        let mut closest = t_max;

        for i in 0..self.hitables.len() {
            let tmp_rec = self.hitables[i].hit(ray, t_min, closest);
            if tmp_rec.is_some() {
                let tmp_rec = tmp_rec.unwrap();
                closest = tmp_rec.t;
                rec = Some(tmp_rec);
            }
        }

        rec
    }
}

#[derive(Clone, Debug)]
pub struct Camera {
    viewport_width: f32,
    viewport_height: f32,
    focus: f32,
    transform: Affine3A,
}

impl Camera {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_ray(&self, u: f32, v: f32) -> Ray {
        let direction = vec3(
            u * self.viewport_width - self.viewport_width / 2.0,
            v * self.viewport_height - self.viewport_height / 2.0,
            self.focus,
        );
        Ray::new(
            self.transform.transform_point3(Vec3::ZERO),
            self.transform.transform_vector3(direction),
        )
    }
}

impl Default for Camera {
    fn default() -> Self {
        Self {
            viewport_width: 4.0,
            viewport_height: 2.0,
            focus: -1.0,
            transform: Default::default(),
        }
    }
}

fn ambient_color(r: &Ray) -> Vec3 {
    let unit_direction = r.direction.normalize();
    let t = 0.5 * (unit_direction.y + 1.0);
    const BACKGROUND_LIGHT: f32 = 1.0;
    const BACKGROUND_DARK: f32 = 0.0;
    Vec3::splat(BACKGROUND_LIGHT) * (1.0 - t) + Vec3::splat(BACKGROUND_DARK) * t
}

fn fake_ambient_color() -> Vec3 {
    const BACKGROUND_BRIGHTNESS: f32 = 0.0;
    Vec3::splat(BACKGROUND_BRIGHTNESS)
}

pub struct RenderParams {
    width: usize,
    height: usize,
    render_mode: RenderMode,
    invert_colors: bool,
}

impl Default for RenderParams {
    fn default() -> Self {
        Self {
            width: 160,
            height: 80,
            render_mode: RenderMode::Materials,
            invert_colors: false,
        }
    }
}

#[derive(Debug)]
pub struct World {
    pub camera: Camera,
    pub objects: HitablesList,
}

impl World {
    pub fn make_plane_default() -> Self {
        Self::make_plane(12, 0.0, -25.0, 25.0, -50.0, -4.0)
    }

    pub fn make_plane(
        spheres_count: usize,
        y_level: f32,
        min_x: f32,
        max_x: f32,
        min_z: f32,
        max_z: f32,
    ) -> Self {
        let mut spheres = vec![];

        for _ in 0..spheres_count {
            let material_rand = rand_unit();
            let material: Box<dyn Material> = if material_rand < 0.33 {
                Box::new(Metal::new(
                    vec3(rand_unit(), rand_unit(), rand_unit()),
                    rand_unit(),
                ))
            } else if material_rand < 0.66 {
                Box::new(Lambertian::new(vec3(rand_unit(), rand_unit(), rand_unit())))
            } else {
                Box::new(Dielectric::new(rand_unit() + 1.0))
            };

            let shape_rand = rand_unit();
            let shape: Box<dyn Hitable> = if shape_rand < 0.5 {
                Box::new(Sphere::new(
                    vec3(
                        rand_min_max(min_x, max_x),
                        y_level,
                        rand_min_max(min_z, max_z),
                    ),
                    rand_min_max(0.1, 4.0),
                    material.into(),
                ))
            } else {
                Box::new(Cube::new(
                    vec3(
                        rand_min_max(min_x, max_x),
                        y_level,
                        rand_min_max(min_z, max_z),
                    ),
                    rand_min_max(0.2, 8.0),
                    Quat::from_euler(
                        EulerRot::XYZ,
                        rand_min_max(0.0, 2.0 * PI),
                        rand_min_max(0.0, 2.0 * PI),
                        rand_min_max(0.0, 2.0 * PI),
                    ),
                    material.into(),
                ))
            };

            spheres.push(shape)
        }

        Self {
            camera: Camera::new(),
            objects: HitablesList::new(spheres),
        }
    }

    pub fn make_three_spheres() -> Self {
        Self {
            camera: Camera::new(),
            objects: HitablesList::new(vec![
                Box::new(Sphere::new(
                    vec3(-1.0, -0.6, -3.0),
                    1.5,
                    Arc::new(Lambertian::new(vec3(0.4, 0.4, 0.4))),
                )),
                Box::new(Sphere::new(
                    vec3(0.0, 0.0, -1.5),
                    0.7,
                    Arc::new(Metal::new(vec3(1.0, 0.6, 0.6), 0.2)),
                )),
                Box::new(Sphere::new(
                    vec3(0.3, 0.3, -0.7),
                    0.18,
                    Arc::new(Metal::new(vec3(0.8, 0.8, 0.8), 0.1)),
                )),
            ]),
        }
    }

    fn get_gray_symbol(intensity: f32) -> char {
        const SYMBOLS: &str = " ·:;znkW";
        let n = SYMBOLS.chars().count();

        let intensity = intensity.clamp(0.0, 100.0);
        let index = (intensity * (n - 1) as f32 / 100.0).round() as usize;
        let index = index.clamp(0, n - 1);
        SYMBOLS.chars().nth(index).unwrap()
    }

    pub fn render_frame(&self, params: &RenderParams) -> String {
        let mut result = String::new();

        for row in (0..params.height).rev() {
            for col in 0..params.width {
                // NOTE: Too expensive!
                //
                // let c = new Vec3(0, 0, 0)
                // const NS = 10
                // for(let s = 0; s<NS; ++s) {
                //     let u = (col + Math.random()) / width
                //     let v = (row + Math.random()) / height

                //     let ray = camera.getRay(u, v)
                //     c.add(color(ray, world, 0))
                // }
                // c.div(NS)

                let u = col as f32 / params.width as f32;
                let v = row as f32 / params.height as f32;
                let ray = self.camera.get_ray(u, v);
                let mut c = color(&ray, self, 0, params.render_mode);

                if params.render_mode != RenderMode::Normals {
                    c = vec3(c.x.sqrt(), c.y.sqrt(), c.z.sqrt());
                }

                clamp_color(&mut c);

                let r = 100.0 * c.x;
                let g = 100.0 * c.y;
                let b = 100.0 * c.z;
                // let avg = 29.9*c.x + 58.7*c.y + 11.4*c.z
                let avg = (r + g + b) / 3.0;

                result.push(Self::get_gray_symbol(if params.invert_colors {
                    100.0 - avg
                } else {
                    avg
                }));
            }
            result.push('\n');
        }

        result
    }
}

impl Hitable for World {
    fn hit(&self, ray: &Ray, t_min: f32, t_max: f32) -> Option<HitRecord> {
        self.objects.hit(ray, t_min, t_max)
    }
}

#[derive(PartialEq, Copy, Clone)]
pub enum RenderMode {
    Normals,
    Materials,
}

pub fn clamp_color(c: &mut Vec3) {
    c.x = c.x.clamp(0.0, 1.0);
    c.y = c.y.clamp(0.0, 1.0);
    c.z = c.z.clamp(0.0, 1.0);
}

pub fn color(r: &Ray, world: &World, depth: usize, render_mode: RenderMode) -> Vec3 {
    let hit = world.hit(r, 0.001, f32::MAX);

    if hit.is_none() {
        // We do not want our ASCII-screen be rubbished by ambient noise, but
        // we do want ambient influence our spheres. So do not show ambient
        // on a hit miss, but make it influence reflections and refractions
        if depth > 0 {
            return ambient_color(r);
        } else {
            return fake_ambient_color();
        }
    }

    let hit = hit.unwrap();

    if render_mode == RenderMode::Normals {
        return vec3(hit.normal.x + 1.0, hit.normal.y + 1.0, hit.normal.z + 1.0) * 0.5;
    }

    // render_mode == RenderMode::Materials

    const REFLECTIONS_COUNT: usize = 5;

    if depth >= REFLECTIONS_COUNT {
        return ambient_color(r);
    }

    let scatter_res = hit.material.scatter(r, &hit);
    if scatter_res.is_none() {
        return ambient_color(r);
    }

    let (attenuation, scattered) = scatter_res.unwrap();

    color(&scattered, world, depth + 1, render_mode) * attenuation
}

pub struct Game {
    world: World,
    render_params: RenderParams,
}

impl Default for Game {
    fn default() -> Self {
        Self {
            world: World::make_plane_default(),
            render_params: RenderParams::default(),
        }
    }
}

impl Game {
    pub fn new() -> Game {
        Self::default()
    }

    pub fn move_camera_up(&mut self, step: f32) {
        let transform = &mut self.world.camera.transform;
        transform.translation += transform.matrix3.y_axis.normalize() * step;
    }

    #[inline]
    pub fn move_camera_down(&mut self, step: f32) {
        self.move_camera_up(-step);
    }

    pub fn move_camera_left(&mut self, step: f32) {
        let transform = &mut self.world.camera.transform;
        transform.translation += transform.matrix3.x_axis.normalize() * -step;
    }

    #[inline]
    pub fn move_camera_right(&mut self, step: f32) {
        self.move_camera_left(-step);
    }

    pub fn move_camera_forward(&mut self, step: f32) {
        let transform = &mut self.world.camera.transform;
        transform.translation += transform.matrix3.z_axis.normalize() * -step;
    }

    #[inline]
    pub fn move_camera_backward(&mut self, step: f32) {
        self.move_camera_forward(-step);
    }

    pub fn rotate_camera(&mut self, pitch: f32, yaw: f32) {
        self.rotate_camera_pitch(pitch);
        self.rotate_camera_yaw(yaw);
    }

    fn rotate_camera_pitch(&mut self, pitch: f32) {
        // rotation around world's X
        let rot = Mat3A::from_axis_angle(vec3(1.0, 0.0, 0.0), pitch);
        self.world.camera.transform.matrix3 *= rot;
        // // rotation around local camera's X
        // let m = &mut self.world.camera.transform.matrix3;
        //
        // let (s, c) = pitch.sin_cos();
        //
        // let yx = m.y_axis.x;
        // let yy = m.y_axis.y;
        // let yz = m.y_axis.z;
        //
        // let zx = m.z_axis.x;
        // let zy = m.z_axis.y;
        // let zz = m.z_axis.z;
        //
        // m.y_axis.x = c * yx + s * zx;
        // m.y_axis.y = c * yy + s * zy;
        // m.y_axis.z = c * yz + s * zz;
        //
        // m.z_axis.x = c * zx + s * yx;
        // m.z_axis.y = c * zy + s * yy;
        // m.z_axis.z = c * zz + s * yz;
    }

    fn rotate_camera_yaw(&mut self, yaw: f32) {
        // rotation around world's Y
        let rot = Mat3A::from_axis_angle(vec3(0.0, 1.0, 0.0), yaw);
        self.world.camera.transform.matrix3 *= rot;
    }

    pub fn change_camera_fov(&mut self, step: f32) {
        self.world.camera.focus += step;
    }

    pub fn render_frame(&self) -> String {
        self.world.render_frame(&self.render_params)
    }
}
