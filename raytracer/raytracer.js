import init, { render_frame, move_camera_up, move_camera_down, move_camera_left, move_camera_right, move_camera_forward, move_camera_backward, rotate_camera, change_camera_fov } from './raytracer_backend.js';

await init(); // Initialize the WASM module

function render() {
    let frame = render_frame().replaceAll(' ', '&nbsp').replaceAll('\n', '<br>') // Get the rendered frame
    tui.innerHTML = frame
    //requestAnimationFrame(renderLoop);
}

const MOUSE_SENSITIVITY = 0.01
const WHEEL_SENSITIVITY = 0.001
const KEYBOARD_SENSITIVITY = 0.2
const KEY_COOLDOWN_MS = 0

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
        move_camera_forward(KEYBOARD_SENSITIVITY)
    } else if (el.key == 's') {
        move_camera_backward(KEYBOARD_SENSITIVITY)
    } else if (el.key == 'a') {
        move_camera_left(KEYBOARD_SENSITIVITY)
    } else if (el.key == 'd') {
        move_camera_right(KEYBOARD_SENSITIVITY)
    } else if (el.key == 'q') {
        move_camera_down(KEYBOARD_SENSITIVITY)
    } else if (el.key == 'e') {
        move_camera_up(KEYBOARD_SENSITIVITY)
    }

    render()
    lastPressTime = time
}

tui.onwheel = (el) => {
    change_camera_fov(el.deltaY * WHEEL_SENSITIVITY)
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

    rotate_camera(-el.movementY * MOUSE_SENSITIVITY, -el.movementX * MOUSE_SENSITIVITY)
    render()
}

render();