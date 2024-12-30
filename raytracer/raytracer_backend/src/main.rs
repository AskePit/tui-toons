use std::sync::Arc;
use glam::vec3;
use raytracer_backend::{clamp_color, color, generate_globe, Camera, Lambertian, Metal, RenderMode, Sphere, World};

const WIDTH: usize = 160;
const HEIGHT: usize = 80;
const RENDER_MODE: RenderMode = RenderMode::Materials;
const INVERT_COLORS: bool = false;

pub fn get_gray_symbol(intensity: f32) -> char {
    const SYMBOLS: &str = " ·:;znkW";
    let n = SYMBOLS.chars().count();

    let intensity = intensity.clamp(0.0, 100.0);
    let index = (intensity * (n - 1) as f32 / 100.0).round() as usize;
    let index = index.clamp(0, n - 1);
    SYMBOLS.chars().nth(index).unwrap()
}

fn render(world: &World, camera: &Camera) {
    print!("{esc}[2J{esc}[1;1H", esc = 27 as char);

    for row in (0..HEIGHT).rev() {
        for col in 0..WIDTH {
            // NOTE: Too expensive!
            //
            // let c = new Vec3(0, 0, 0)
            // const NS = 10
            // for(let s = 0; s<NS; ++s) {
            //     let u = (col + Math.random()) / WIDTH
            //     let v = (row + Math.random()) / HEIGHT

            //     let ray = camera.getRay(u, v)
            //     c.add(color(ray, world, 0))
            // }
            // c.div(NS)

            let u = col as f32 / WIDTH as f32;
            let v = row as f32 / HEIGHT as f32;
            let ray = camera.get_ray(u, v);
            let mut c = color(&ray, world, 0, RENDER_MODE);

            if RENDER_MODE != RenderMode::Normals {
                c = vec3(c.x.sqrt(), c.y.sqrt(), c.z.sqrt());
            }

            clamp_color(&mut c);

            let r = 100.0 * c.x;
            let g = 100.0 * c.y;
            let b = 100.0 * c.z;
            // let avg = 29.9*c.x + 58.7*c.y + 11.4*c.z
            let avg = (r + g + b) / 3.0;

            print!(
                "{}",
                get_gray_symbol(if INVERT_COLORS { 100.0 - avg } else { avg })
            );
        }
        println!();
    }
}

fn main() {
    let world: World = World::new(
        vec![
            Box::new(Sphere::new(vec3(-1.0, -0.6, -3.0), 1.5, Arc::new(Lambertian::new(vec3(0.4, 0.4, 0.4))))),
            Box::new(Sphere::new(vec3(0.0, 0.0, -1.5), 0.7, Arc::new(Metal::new(vec3(1.0, 0.6, 0.6), 0.2)))),
            Box::new(Sphere::new(vec3(0.3, 0.3, -0.7), 0.18, Arc::new(Metal::new(vec3(0.8, 0.8, 0.8), 0.1)))),
        ]
    );
    // let world: World = generate_globe(12, 0.0, -25.0, 25.0, -50.0, -4.0);
    let camera = Camera::new();

    render(&world, &camera);
}
