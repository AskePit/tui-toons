use raytracer_backend::Game;

fn main() {
    let game = Game::new();
    let frame = game.render_frame();

    println!("{}", frame);
}
