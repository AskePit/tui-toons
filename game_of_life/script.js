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

const WIDTH = 190
const HEIGHT = 70

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

const RULES = DIAMOEBA

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

let tui = document.getElementById("tui")
let builder = new StringBuilder()

setInterval(() => {
    tui.innerHTML = ''
    builder.clear()
    world = update(world)

    console.log(world)

    for (let r = 0; r<HEIGHT; ++r) {
        for (let c = 0; c<WIDTH; ++c) {
            builder.append((world[r][c]) ? 'x' : '&nbsp')
        }
        builder.append('<br>')
    }
    
    tui.innerHTML = builder.toString()
}, 200);
