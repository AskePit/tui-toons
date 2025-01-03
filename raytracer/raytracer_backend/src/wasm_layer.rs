use crate::Game;
use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;

thread_local! {
    static GAME: RefCell<Option<Rc<RefCell<Game>>>> = const { RefCell::new(None) };
}

#[wasm_bindgen]
pub fn init_world() {
    GAME.with(|game| {
        *game.borrow_mut() = Some(Rc::new(RefCell::new(Game::new())));
    });
}

#[wasm_bindgen]
pub fn render_frame() -> String {
    GAME.with(|game| {
        if let Some(ref game) = *game.borrow() {
            return game.borrow().render_frame();
        }
        String::new()
    })
}
