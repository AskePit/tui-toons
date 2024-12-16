function StringBuilder(value) {
    this.strings = new Array()
    this.append(value)
}

StringBuilder.prototype.append = function (value) {
    if (value) {
        this.strings.push(value)
    }
}

StringBuilder.prototype.clear = function () {
    this.strings.length = 0
}

StringBuilder.prototype.toString = function () {
    return this.strings.join("")
}

function getGraySymbol(intensity) {
    const symbols = " ·:;znkW"
    const index = Math.round(intensity * (symbols.length - 1) / 100)
    return symbols[index]
}

let tui = document.getElementById("tui")
let tuiHead = document.getElementById("tui-head")

const WIDTH = 150
const HEIGHT = 80
const FILL_SYMBOL = 'x'
const CURSOR_SYMBOL = '█'

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

    tui.style.width = (width * WIDTH + 10) + 'px'
    tuiHead.style.width = (width * WIDTH + 10) + 'px'
    tui.style.height = (height * HEIGHT + 10) + 'px'
}

computeSizes(FILL_SYMBOL)

class Rules {
    birthRule
    survivalRule
    initialFillPercent
    wrap

    constructor(birthRule, survivalRule, initialFillPercent, wrap) {
        this.birthRule = birthRule
        this.survivalRule = survivalRule
        this.initialFillPercent = initialFillPercent
        this.wrap = wrap
    }
}

const GAME_OF_LIFE = new Rules([3], [2, 3], 12, false)
const INEVITABLE_EXPANSION = new Rules([3, 4], [3, 4], 10)
const DIAMOEBA = new Rules([3, 5, 6, 7, 8], [5, 6, 7, 8], 51, false)
const DAY_AND_NIGHT = new Rules([3, 6, 7, 8], [3, 4, 6, 7, 8], 50, true)
const ANNEAL = new Rules([4, 6, 7, 8], [3, 5, 6, 7, 8], 48, true)

const rulesArray = [INEVITABLE_EXPANSION, DIAMOEBA, DAY_AND_NIGHT];
const randomRulesIndex = Math.floor(Math.random() * rulesArray.length)
const RULES = rulesArray[randomRulesIndex];

if (RULES == GAME_OF_LIFE) {
    tuiHead.innerText += " GAME OF LIFE"
} else if (RULES == INEVITABLE_EXPANSION) {
    tuiHead.innerText += " INEVITABLE EXPANSION"
} else if (RULES == DIAMOEBA) {
    tuiHead.innerText += " SWAMP DROWNING"
} else if (RULES == DAY_AND_NIGHT) {
    tuiHead.innerText += " CONTINENTS BIRTH"
} else if (RULES == ANNEAL) {
    tuiHead.innerText += " ANNEAL"
}

function update(old)
{
    let res = []

    for (let r = 0; r < HEIGHT; ++r) {
        res.push([])
        for (let c = 0; c < WIDTH; ++c) {

            let neighboursCount = 0
            for (let nr = r - 1; nr <= r + 1; ++nr) {
                for (let nc = c - 1; nc <= c + 1; ++nc) {
                    if (nr == r && nc == c) continue

                    const wrappedR = RULES.wrap ? ((nr + HEIGHT) % HEIGHT) : Math.max(0, Math.min(nr, HEIGHT-1))
                    const wrappedC = RULES.wrap ? ((nc + WIDTH) % WIDTH) : Math.max(0, Math.min(nc, WIDTH-1))
                    neighboursCount += old[wrappedR][wrappedC]
                }
            }

            const isOldAlive = old[r][c]
            let isNewAlive = isOldAlive
            if (isOldAlive) {
                isNewAlive = RULES.survivalRule.some((el) => el == neighboursCount)
            } else {
                isNewAlive = RULES.birthRule.some((el) => el == neighboursCount)
            }
            res[r].push(isNewAlive)
        }
    }

    return res
}

let world = []

for (let r = 0; r < HEIGHT; ++r) {
    world.push([])
    for (let c = 0; c < WIDTH; ++c) {
        world[r].push(Math.random() <= (RULES.initialFillPercent / 100))
    }
}

let builder = new StringBuilder()

setInterval(() => {
    tui.innerHTML = ''
    builder.clear()
    world = update(world)

    for (let r = 0; r<HEIGHT; ++r) {
        for (let c = 0; c<WIDTH; ++c) {
            builder.append((world[r][c]) ? FILL_SYMBOL : '&nbsp')
        }
        builder.append('<br>')
    }
    
    tui.innerHTML = builder.toString()
}, 200);

cursorState = false
setInterval(() => {
    if (cursorState) {
        tuiHead.innerText = tuiHead.innerText.slice(0, -1);
    } else {
        tuiHead.innerText += CURSOR_SYMBOL;
    }
    cursorState = !cursorState
}, 600);