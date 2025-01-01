use raytracer_backend::{RenderParams, World};

fn main() {
    let world: World = World::make_plane_default();
    let frame = world.render_frame(&RenderParams::default());

    println!("{}", frame);
}
