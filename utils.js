const WIDTH = 160
const HEIGHT = 80

const FILL_SYMBOL = 'x'
const CURSOR_SYMBOL = '█'

let tui = document.getElementById("tui")
let tuiHead = document.getElementById("tui-head")
const canvas = tui.getContext("2d", { alpha: false });

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

class StringBuilder {
    constructor(value) {
        this.strings = new Array()
        this.append(value)
    }

    append(value) {
        if (value) {
            this.strings.push(value)
        }
    }

    clear() {
        this.strings.length = 0
    }

    toString() {
        return this.strings.join("")
    }
}

function getGraySymbol(intensity) {
    const symbols = " ·:;znkW"
    const index = Math.round(intensity * (symbols.length - 1) / 100)
    return symbols[index]
}

function getGraySymbolHtml(intensity) {
    const s = getGraySymbol(intensity)
    return s == ' ' ? '&nbsp;' : s
}

function getGraySymbolHtmlColored(intensity, r, g, b) {
    const s = getGraySymbol(intensity)
    return s == ' ' ? '&nbsp;' : `<span style="color: rgb(${r},${g},${b});">${s}</span>`
}

function computeSizes(char) {
    var tuiStyle = window.getComputedStyle(tui)
    const height = parseFloat(tuiStyle.lineHeight)
    let prevWidth = 0
    let width = 0

    tui.style.fontSize = height + 'px';

    const STEP = 0.1

    while (width < height) {
        const span = document.createElement("span");
        span.style.fontFamily = tuiStyle.fontFamily;
        span.style.fontSize = tui.style.fontSize;
        span.style.whiteSpace = "nowrap";
        span.style.visibility = "hidden";
        span.textContent = char;
    
        document.body.appendChild(span);
        const rect = span.getBoundingClientRect();

        prevWidth = width
        width = rect.width
        
        document.body.removeChild(span);

        tui.style.fontSize = (parseFloat(tui.style.fontSize) + STEP) + 'px'
    }

    if (Math.abs(prevWidth - height) < Math.abs(width - height)) {
        width = prevWidth
        tui.style.fontSize = (parseFloat(tui.style.fontSize) - STEP) + 'px'
    }

    tui.width = width * WIDTH + 10
    tuiHead.style.width = (width * WIDTH + 10) + 'px'
    tui.height = height * HEIGHT + 10

    const fontSize = parseFloat(tui.style.fontSize)
    console.log(fontSize)
    canvas.font = `${tui.style.fontSize} ${tuiStyle.fontFamily}`
    console.log(canvas.font)
    canvas.textBaseline = 'top';

    return [height, fontSize]
}

const [PIXEL_SIZE, FONT_SIZE] = computeSizes(FILL_SYMBOL)

cursorState = false
setInterval(() => {
    if (cursorState) {
        tuiHead.innerHTML = tuiHead.innerHTML.slice(0, -1);
    } else {
        tuiHead.innerHTML += CURSOR_SYMBOL;
    }
    cursorState = !cursorState
}, 600);

function drawPixel(char, x, y, r, g, b) {
    canvas.strokeStyle = `rgb(${r}, ${g}, ${b})`
    canvas.strokeText(char, x * PIXEL_SIZE, y * PIXEL_SIZE); // Adjust based on font size
}

// const THEMES = [
//     '../theme-cmd.css',
//     '../theme-gitbash.css',
//     '../theme-powershell.css',
//     '../theme-ubuntu.css',
// ]

// document.getElementById('theme').href = THEMES[Math.floor(Math.random() * THEMES.length)]
