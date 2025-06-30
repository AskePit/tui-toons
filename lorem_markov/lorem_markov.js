setTuiMode(TuiMode.TEXT)

const markovChain = {};

const PRIDE_AND_PREJUDICE = {
    url: 'https://api.allorigins.win/raw?url=https://www.fulltextarchive.com/book/pride-and-prejudice/',
    name: 'PrideAndPrejudiceEnCorpus',
}
const WAR_AND_PEACE = {
    url: 'https://api.allorigins.win/raw?url=https://www.fulltextarchive.com/book/war-and-peace/',
    name: 'WarAndPeaceEnCorpus',
}
const VORONOI_MANHATTAN_RANDOM = {
    url: 'https://askepit.github.io/blog/voronoi_manhattan_random/',
    name: 'VoronoiManhattanRandomEnCorpus',
}
const VORONOI_MANHATTAN_RANDOM_RU = {
    url: 'https://api.allorigins.win/raw?url=https://habr.com/ru/articles/794572/',
    name: 'VoronoiManhattanRandomRuCorpus',
}

function saveLocalDict(key, obj) {
    localStorage.setItem(key, JSON.stringify(obj));
}

function loadLocalDict(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
}

let CURRENT_CORPUS = PRIDE_AND_PREJUDICE;

const cachedCorpus = loadLocalDict(CURRENT_CORPUS.name)

if (cachedCorpus) {
    Object.assign(markovChain, cachedCorpus);
    generateLoremIpsum(200);
} else {
    tui.innerText = 'Loading corpus...';
    fetch(CURRENT_CORPUS.url)
        .then(response => response.text())
        .then(htmlString => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');
            const paragraphs = doc.querySelectorAll('p');

            const data = Array.from(paragraphs).map(p => p.textContent).join(' ');

            loadCorpus(data);
            generateLoremIpsum(200);
        })
        .catch(err => console.error('Fetch error:', err));
}

function loadCorpus(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);

    for (let i = 0; i < words.length - 1; i++) {
        const word = words[i];
        const nextWord = words[i + 1];

        if (!markovChain[word]) {
            markovChain[word] = [];
        }
        markovChain[word].push(nextWord);
    }

    saveLocalDict(CURRENT_CORPUS.name, markovChain);
}

function generateLoremIpsum(length) {
    const words = Object.keys(markovChain);
    const startWord = markovChain[words[Math.floor(Math.random() * words.length)]];
    let currentWord = startWord;
    const result = [currentWord];

    for (let i = 1; i < length; i++) {
        const nextWords = markovChain[currentWord];
        if (!nextWords || nextWords.length === 0) {
            currentWord = markovChain[words[Math.floor(Math.random() * words.length)]];
        } else {
            currentWord = nextWords[Math.floor(Math.random() * nextWords.length)];
        }
        result.push(currentWord);
    }

    const text = '<br>' + result.join(' ');
    tui.innerHTML = text;
}
