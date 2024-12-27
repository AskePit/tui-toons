#![allow(dead_code)]

use glam::{vec3, Affine3A, EulerRot, Quat, Vec3};
use std::cmp::PartialEq;
use std::f32::consts::PI;
use std::fmt::Debug;
use std::sync::Arc;

#[derive(Clone, Debug)]
struct HitRecord {
    t: f32,
    p: Vec3,
    normal: Vec3,
    material: Arc<dyn Material>,
}

#[derive(Copy, Clone, Debug)]
struct Ray {
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

trait Material: Debug {
    fn scatter(&self, _in_ray: &Ray, _hit: &HitRecord) -> Option<(Vec3, Ray)> {
        None
    }
}

// return Vec3
fn random_in_unit_sphere() -> Vec3 {
    let mut p;

    loop {
        p = (Vec3::new(
            rand::random_range(0.0..=1.0),
            rand::random_range(0.0..=1.0),
            rand::random_range(0.0..=1.0),
        )) * 2.0
            - Vec3::ONE;
        if p.length_squared() >= 1.0 {
            break;
        }
    }

    p
}

#[derive(Clone, Debug)]
struct Lambertian {
    albedo: Vec3,
}

impl Lambertian {
    fn new(albedo: Vec3) -> Self {
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
struct Metal {
    albedo: Vec3,
    fuzz: f32,
}

impl Metal {
    fn new(albedo: Vec3, fuzz: f32) -> Self {
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
struct Dielectric {
    refraction_index: f32,
}

impl Dielectric {
    fn new(refraction_index: f32) -> Self {
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

        let scattered = if rand::random_range(0.0..=1.0) < reflect_prob {
            Ray::new(hit.p, reflected)
        } else {
            Ray::new(hit.p, refracted)
        };

        Some((Vec3::ONE, scattered))
    }
}

trait Hitable: Debug {
    fn hit(&self, _ray: &Ray, _t_min: f32, _t_max: f32) -> Option<HitRecord> {
        None
    }
}

const ORBIT_DT: usize = 30; // ms

#[derive(Clone, Debug)]
struct Sphere {
    center: Vec3,
    radius: f32,
    material: Arc<dyn Material>,
}

impl Sphere {
    fn new(center: Vec3, radius: f32, material: Arc<dyn Material>) -> Self {
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
struct Plane {
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
struct Cube {
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
struct HitablesList {
    hitables: Vec<Box<dyn Hitable>>,
}

impl HitablesList {
    fn new(hitables: Vec<Box<dyn Hitable>>) -> Self {
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

struct Camera {
    viewport_width: f32,
    viewport_height: f32,
    focus: f32,
    transform: Affine3A,
}

impl Camera {
    fn new() -> Self {
        Self {
            viewport_width: 4.0,
            viewport_height: 2.0,
            focus: -1.0,
            transform: Default::default(),
        }
    }

    fn get_ray(&self, u: f32, v: f32) -> Ray {
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

type World = HitablesList;

#[derive(PartialEq)]
enum RenderMode {
    Normals,
    Materials,
}

fn color(r: &Ray, world: &World, depth: usize, render_mode: RenderMode) -> Vec3 {
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

    const REFLECTIONS_COUNT: usize = 3;

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

fn generate_globe(
    spheres_count: usize,
    y_level: f32,
    min_x: f32,
    max_x: f32,
    min_z: f32,
    max_z: f32,
) -> HitablesList {
    let mut spheres = vec![];

    for _ in 0..spheres_count {
        let material_rand = rand::random_range(0.0..=1.0);
        let material: Box<dyn Material> = if material_rand < 0.33 {
            Box::new(Metal::new(
                vec3(
                    rand::random_range(0.0..=1.0),
                    rand::random_range(0.0..=1.0),
                    rand::random_range(0.0..=1.0),
                ),
                rand::random_range(0.0..=1.0),
            ))
        } else if material_rand < 0.66 {
            Box::new(Lambertian::new(vec3(
                rand::random_range(0.0..=1.0),
                rand::random_range(0.0..=1.0),
                rand::random_range(0.0..=1.0),
            )))
        } else {
            Box::new(Dielectric::new(rand::random_range(0.0..=1.0) + 1.0))
        };

        let shape_rand = rand::random_range(0.0..=1.0);
        let shape: Box<dyn Hitable> = if shape_rand > 0.5 {
            Box::new(Sphere::new(
                vec3(
                    rand::random_range(min_x..=max_x),
                    y_level,
                    rand::random_range(min_z..=max_z),
                ),
                rand::random_range(0.1..=4.0),
                material.into(),
            ))
        } else {
            Box::new(Cube::new(
                vec3(
                    rand::random_range(min_x..=max_x),
                    y_level,
                    rand::random_range(min_z..=max_z),
                ),
                rand::random_range(0.2..=8.0),
                Quat::from_euler(
                    EulerRot::XYZ,
                    rand::random_range(0.0..=2.0 * PI),
                    rand::random_range(0.0..=2.0 * PI),
                    rand::random_range(0.0..=2.0 * PI),
                ),
                material.into(),
            ))
        };

        spheres.push(shape)
    }

    HitablesList::new(spheres)
}

const INVERT_COLORS: bool = false;

//const WORLD: HitablesList = generate_globe(12, 0.0, -25.0, 25.0, -50.0, -4.0);
