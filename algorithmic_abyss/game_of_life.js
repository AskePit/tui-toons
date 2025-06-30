setTuiMode(TuiMode.IMAGE)

class Rules {
    birthRule
    survivalRule
    initialFillPercent
    initialFillCount
    initialFillSquare
    wrap

    constructor(birthRule, survivalRule, initialFillPercent = 0.0, initialFillCount = 2, wrap, initialFillSquare = false) {
        this.birthRule = birthRule
        this.survivalRule = survivalRule
        this.initialFillPercent = initialFillPercent
        this.initialFillCount = initialFillCount
        this.initialFillSquare = initialFillSquare
        this.wrap = wrap
    }
}

const AI_CORRUPTION = new Rules([2, 3, 4], [1, 2], initialFillPercent=0.0, initialFillCount=2, wrap=true, initialFillSquare=true)
const CRYSTAL_MAZE = new Rules([1], [1, 2, 3, 4], initialFillPercent=0, initialFillCount=2, wrap=true)
const LAVA = new Rules([3, 4], [2, 3, 4], initialFillPercent=4, initialFillCount=0, wrap=false)
const GAME_OF_LIFE = new Rules([3], [2, 3], initialFillPercent=12, initialFillCount=0, wrap=false)
const INEVITABLE_EXPANSION = new Rules([3, 4], [3, 4], initialFillPercent=10, initialFillCount=0, wrap=false)
const DIAMOEBA = new Rules([3, 5, 6, 7, 8], [5, 6, 7, 8], initialFillPercent=51, initialFillCount=0, wrap=false)
const DAY_AND_NIGHT = new Rules([3, 6, 7, 8], [3, 4, 6, 7, 8], initialFillPercent=50, initialFillCount=0, wrap=true)
const ANNEAL = new Rules([4, 6, 7, 8], [3, 5, 6, 7, 8], initialFillPercent=48, initialFillCount=0, wrap=true)

const DEBUG_TEST_RULE = false
const TEST_RULE = GAME_OF_LIFE

const rulesArray = [LAVA, INEVITABLE_EXPANSION, DIAMOEBA, DAY_AND_NIGHT, AI_CORRUPTION, CRYSTAL_MAZE];
const randomRulesIndex = Math.floor(Math.random() * rulesArray.length)
const RULES = DEBUG_TEST_RULE ? TEST_RULE : rulesArray[randomRulesIndex];

if (RULES == TEST_RULE) {
    tuiHead.innerHTML += " TEST"
} else if (RULES == GAME_OF_LIFE) {
    tuiHead.innerHTML += " GAME_OF_LIFE"
} else if (RULES == INEVITABLE_EXPANSION) {
    tuiHead.innerHTML += " INEVITABLE_EXPANSION"
} else if (RULES == DIAMOEBA) {
    tuiHead.innerHTML += " SWAMP_DROWNING"
} else if (RULES == DAY_AND_NIGHT) {
    tuiHead.innerHTML += " CONTINENTS_BIRTH"
} else if (RULES == ANNEAL) {
    tuiHead.innerHTML += " ANNEAL"
} else if (RULES == LAVA) {
    tuiHead.innerHTML += " LAVA"
} else if (RULES == CRYSTAL_MAZE) {
    tuiHead.innerHTML += " CRYSTAL_MAZE"
} else if (RULES == AI_CORRUPTION) {
    tuiHead.innerHTML += " AI_CORRUPTION"
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

if (RULES.initialFillPercent == 0) {
    for (let i = 0; i<RULES.initialFillCount; ++i) {
        if (RULES.initialFillSquare) {
            let y = getRandomInt(0, HEIGHT-1)
            let x = getRandomInt(0, WIDTH-1)

            world[y][x] = true
            world[(y + 1 + WIDTH) % WIDTH][(x + 1 + WIDTH) % WIDTH] = true
            world[(y + 1 + WIDTH) % WIDTH][x] = true
            world[y][(x + 1 + WIDTH) % WIDTH] = true
        } else {
            world[getRandomInt(0, HEIGHT-1)][getRandomInt(0, WIDTH-1)] = true
        }
    }
}

let builder = new StringBuilder()

setInterval(() => {
    tui.innerHTML = ''
    builder.clear()
    world = update(world)

    for (let r = 0; r<HEIGHT; ++r) {
        for (let c = 0; c<WIDTH; ++c) {
            builder.append((world[r][c]) ? FILL_SYMBOL : '&nbsp;')
        }
        builder.append('<br>')
    }
    
    tui.innerHTML = builder.toString()
}, 200);
