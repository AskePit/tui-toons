use crate::Game;
use std::cell::RefCell;
use wasm_bindgen::prelude::*;

thread_local! {
    static GAME: RefCell<Game> = RefCell::new(Game::new());
}

#[wasm_bindgen]
pub fn render_frame() -> String {
    GAME.with(|game| game.borrow().render_frame())
}

#[wasm_bindgen]
pub fn move_camera_up(step: f32) {
    GAME.with(|game| game.borrow_mut().move_camera_up(step))
}

#[wasm_bindgen]
pub fn move_camera_down(step: f32) {
    GAME.with(|game| game.borrow_mut().move_camera_down(step))
}

#[wasm_bindgen]
pub fn move_camera_left(step: f32) {
    GAME.with(|game| game.borrow_mut().move_camera_left(step))
}

#[wasm_bindgen]
pub fn move_camera_right(step: f32) {
    GAME.with(|game| game.borrow_mut().move_camera_right(step))
}

#[wasm_bindgen]
pub fn move_camera_forward(step: f32) {
    GAME.with(|game| game.borrow_mut().move_camera_forward(step))
}

#[wasm_bindgen]
pub fn move_camera_backward(step: f32) {
    GAME.with(|game| game.borrow_mut().move_camera_backward(step))
}

#[wasm_bindgen]
pub fn rotate_camera(pitch: f32, yaw: f32) {
    GAME.with(|game| game.borrow_mut().rotate_camera(pitch, yaw))
}

#[wasm_bindgen]
pub fn change_camera_fov(step: f32) {
    GAME.with(|game| game.borrow_mut().change_camera_fov(step))
}
