/**
 * FreestyleHelper - Core logic for generating song structures, rhymes, and word pairs
 * 
 * This file will contain functions for:
 * - Song structure generation
 * - Rhyme scheme generation
 * - English rhyme generation (using Datamuse API)
 * - Swedish rhyme generation (scraping www.rimlexikon.se)
 */

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Returns a collection of predefined song structures
 */
function getSongStructures() {
    return [
        {
            name: "Verse-Chorus",
            parts: [
                { type: "Verse", bars: 8 },
                { type: "Chorus", bars: 4 },
                { type: "Verse", bars: 8 },
                { type: "Chorus", bars: 4 }
            ]
        },
        {
            name: "Verse-Chorus-Bridge",
            parts: [
                { type: "Verse", bars: 8 },
                { type: "Chorus", bars: 4 },
                { type: "Verse", bars: 8 },
                { type: "Chorus", bars: 4 },
                { type: "Bridge", bars: 4 },
                { type: "Chorus", bars: 4 }
            ]
        },
        {
            name: "16 Bar Verse",
            parts: [
                { type: "Verse", bars: 16 }
            ]
        },
        {
            name: "Intro-Verse-Outro",
            parts: [
                { type: "Intro", bars: 4 },
                { type: "Verse", bars: 12 },
                { type: "Outro", bars: 4 }
            ]
        },
        {
            name: "Verse-Hook-Verse",
            parts: [
                { type: "Verse", bars: 12 },
                { type: "Hook", bars: 4 },
                { type: "Verse", bars: 12 },
                { type: "Hook", bars: 4 }
            ]
        }
    ];
}

/**
 * Generates a song structure
 * @param {string} structureName - Optional name of the structure to use (random if not specified)
 * @returns {Object} The selected song structure
 */
function generateSongStructure(structureName = null) {
    const structures = getSongStructures();

    if (structureName) {
        const requestedStructure = structures.find(structure =>
            structure.name.toLowerCase() === structureName.toLowerCase());
        if (requestedStructure) {
            return requestedStructure;
        }
    }

    // Select random structure if none specified or specified wasn't found
    const randomIndex = Math.floor(Math.random() * structures.length);
    return structures[randomIndex];
}

/**
 * Returns a collection of predefined rhyme schemes
 */
function getRhymeSchemes() {
    return [
        {
            name: "AABB",
            description: "Simple couplets",
            generator: (lineCount) => {
                const scheme = [];
                let currentChar = 'A';

                for (let i = 0; i < lineCount; i += 2) {
                    scheme.push(currentChar, currentChar);
                    // Move to next letter (A -> B -> C, etc.)
                    currentChar = String.fromCharCode(currentChar.charCodeAt(0) + 1);
                }

                return scheme.slice(0, lineCount);
            }
        },
        {
            name: "ABAB",
            description: "Simple Alternating",
            generator: (lineCount) => {
                const scheme = [];
                let currentChar = 'A';

                for (let i = 0; i < lineCount; i += 4) {
                    // Add ABAB pattern
                    scheme.push(currentChar); // A
                    scheme.push(String.fromCharCode(currentChar.charCodeAt(0) + 1)); // B
                    scheme.push(currentChar); // A
                    scheme.push(String.fromCharCode(currentChar.charCodeAt(0) + 1)); // B

                    // Move to next pair of letters (A,B -> C,D -> E,F etc)
                    currentChar = String.fromCharCode(currentChar.charCodeAt(0) + 2);
                }

                return scheme.slice(0, lineCount);
            }
        }
    ];
}

/**
 * Generates a rhyme scheme for a given number of lines
 * @param {number} lineCount - Number of lines to generate a scheme for
 * @param {string} schemeName - Optional name of scheme to use (random if not specified)
 * @returns {Object} The rhyme scheme with name and array of rhyme letters
 */
function generateRhymeScheme(lineCount, schemeName = null) {
    const schemes = getRhymeSchemes();
    let selectedScheme;

    if (schemeName) {
        selectedScheme = schemes.find(scheme =>
            scheme.name.toLowerCase() === schemeName.toLowerCase());
    }

    // If no scheme specified or specified wasn't found, select random scheme
    if (!selectedScheme) {
        const randomIndex = Math.floor(Math.random() * schemes.length);
        selectedScheme = schemes[randomIndex];
    }

    return {
        name: selectedScheme.name,
        description: selectedScheme.description,
        scheme: selectedScheme.generator(lineCount)
    };
}

/**
 * Extended list of seed words for English rhymes
 */
const englishSeedWords = ["abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent", "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique", "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake", "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain", "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become", "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology", "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body", "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread", "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy", "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call", "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas", "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry", "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category", "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century", "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase", "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child", "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle", "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk", "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close", "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut", "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort", "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control", "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost", "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle", "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek", "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial", "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup", "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle", "dad", "damage", "damp", "dance", "danger", "daring", "dash", "daughter", "dawn", "day", "deal", "debate", "debris", "decade", "december", "decide", "decline", "decorate", "decrease", "deer", "defense", "define", "defy", "degree", "delay", "deliver", "demand", "demise", "denial", "dentist", "deny", "depart", "depend", "deposit", "depth", "deputy", "derive", "describe", "desert", "design", "desk", "despair", "destroy", "detail", "detect", "develop", "device", "devote", "diagram", "dial", "diamond", "diary", "dice", "diesel", "diet", "differ", "digital", "dignity", "dilemma", "dinner", "dinosaur", "direct", "dirt", "disagree", "discover", "disease", "dish", "dismiss", "disorder", "display", "distance", "divert", "divide", "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin", "domain", "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft", "dragon", "drama", "drastic", "draw", "dream", "dress", "drift", "drill", "drink", "drip", "drive", "drop", "drum", "dry", "duck", "dumb", "dune", "during", "dust", "dutch", "duty", "dwarf", "dynamic", "eager", "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo", "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "eight", "either", "elbow", "elder", "electric", "elegant", "element", "elephant", "elevator", "elite", "else", "embark", "embody", "embrace", "emerge", "emotion", "employ", "empower", "empty", "enable", "enact", "end", "endless", "endorse", "enemy", "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist", "enough", "enrich", "enroll", "ensure", "enter", "entire", "entry", "envelope", "episode", "equal", "equip", "era", "erase", "erode", "erosion", "error", "erupt", "escape", "essay", "essence", "estate", "eternal", "ethics", "evidence", "evil", "evoke", "evolve", "exact", "example", "excess", "exchange", "excite", "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist", "exit", "exotic", "expand", "expect", "expire", "explain", "expose", "express", "extend", "extra", "eye", "eyebrow", "fabric", "face", "faculty", "fade", "faint", "faith", "fall", "false", "fame", "family", "famous", "fan", "fancy", "fantasy", "farm", "fashion", "fat", "fatal", "father", "fatigue", "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel", "female", "fence", "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "figure", "file", "film", "filter", "final", "find", "fine", "finger", "finish", "fire", "firm", "first", "fiscal", "fish", "fit", "fitness", "fix", "flag", "flame", "flash", "flat", "flavor", "flee", "flight", "flip", "float", "flock", "floor", "flower", "fluid", "flush", "fly", "foam", "focus", "fog", "foil", "fold", "follow", "food", "foot", "force", "forest", "forget", "fork", "fortune", "forum", "forward", "fossil", "foster", "found", "fox", "fragile", "frame", "frequent", "fresh", "friend", "fringe", "frog", "front", "frost", "frown", "frozen", "fruit", "fuel", "fun", "funny", "furnace", "fury", "future", "gadget", "gain", "galaxy", "gallery", "game", "gap", "garage", "garbage", "garden", "garlic", "garment", "gas", "gasp", "gate", "gather", "gauge", "gaze", "general", "genius", "genre", "gentle", "genuine", "gesture", "ghost", "giant", "gift", "giggle", "ginger", "giraffe", "girl", "give", "glad", "glance", "glare", "glass", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow", "glue", "goat", "goddess", "gold", "good", "goose", "gorilla", "gospel", "gossip", "govern", "gown", "grab", "grace", "grain", "grant", "grape", "grass", "gravity", "great", "green", "grid", "grief", "grit", "grocery", "group", "grow", "grunt", "guard", "guess", "guide", "guilt", "guitar", "gun", "gym", "habit", "hair", "half", "hammer", "hamster", "hand", "happy", "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk", "hazard", "head", "health", "heart", "heavy", "hedgehog", "height", "hello", "helmet", "help", "hen", "hero", "hidden", "high", "hill", "hint", "hip", "hire", "history", "hobby", "hockey", "hold", "hole", "holiday", "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse", "hospital", "host", "hotel", "hour", "hover", "hub", "huge", "human", "humble", "humor", "hundred", "hungry", "hunt", "hurdle", "hurry", "hurt", "husband", "hybrid", "ice", "icon", "idea", "identify", "idle", "ignore", "ill", "illegal", "illness", "image", "imitate", "immense", "immune", "impact", "impose", "improve", "impulse", "inch", "include", "income", "increase", "index", "indicate", "indoor", "industry", "infant", "inflict", "inform", "inhale", "inherit", "initial", "inject", "injury", "inmate", "inner", "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire", "install", "intact", "interest", "into", "invest", "invite", "involve", "iron", "island", "isolate", "issue", "item", "ivory", "jacket", "jaguar", "jar", "jazz", "jealous", "jeans", "jelly", "jewel", "job", "join", "joke", "journey", "joy", "judge", "juice", "jump", "jungle", "junior", "junk", "just", "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid", "kidney", "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "kiwi", "knee", "knife", "knock", "know", "lab", "label", "labor", "ladder", "lady", "lake", "lamp", "language", "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law", "lawn", "lawsuit", "layer", "lazy", "leader", "leaf", "learn", "leave", "lecture", "left", "leg", "legal", "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson", "letter", "level", "liar", "liberty", "library", "license", "life", "lift", "light", "like", "limb", "limit", "link", "lion", "liquid", "list", "little", "live", "lizard", "load", "loan", "lobster", "local", "lock", "logic", "lonely", "long", "loop", "lottery", "loud", "lounge", "love", "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics", "machine", "mad", "magic", "magnet", "maid", "mail", "main", "major", "make", "mammal", "man", "manage", "mandate", "mango", "mansion", "manual", "maple", "marble", "march", "margin", "marine", "market", "marriage", "mask", "mass", "master", "match", "material", "math", "matrix", "matter", "maximum", "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media", "melody", "melt", "member", "memory", "mention", "menu", "mercy", "merge", "merit", "merry", "mesh", "message", "metal", "method", "middle", "midnight", "milk", "million", "mimic", "mind", "minimum", "minor", "minute", "miracle", "mirror", "misery", "miss", "mistake", "mix", "mixed", "mixture", "mobile", "model", "modify", "mom", "moment", "monitor", "monkey", "monster", "month", "moon", "moral", "more", "morning", "mosquito", "mother", "motion", "motor", "mountain", "mouse", "move", "movie", "much", "muffin", "mule", "multiply", "muscle", "museum", "mushroom", "music", "must", "mutual", "myself", "mystery", "myth", "naive", "name", "napkin", "narrow", "nasty", "nation", "nature", "near", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve", "nest", "net", "network", "neutral", "never", "news", "next", "nice", "night", "noble", "noise", "nominee", "noodle", "normal", "north", "nose", "notable", "note", "nothing", "notice", "novel", "now", "nuclear", "number", "nurse", "nut", "oak", "obey", "object", "oblige", "obscure", "observe", "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer", "office", "often", "oil", "okay", "old", "olive", "olympic", "omit", "once", "one", "onion", "online", "only", "open", "opera", "opinion", "oppose", "option", "orange", "orbit", "orchard", "order", "ordinary", "organ", "orient", "original", "orphan", "ostrich", "other", "outdoor", "outer", "output", "outside", "oval", "oven", "over", "own", "owner", "oxygen", "oyster", "ozone", "pact", "paddle", "page", "pair", "palace", "palm", "panda", "panel", "panic", "panther", "paper", "parade", "parent", "park", "parrot", "party", "pass", "patch", "path", "patient", "patrol", "pattern", "pause", "pave", "payment", "peace", "peanut", "pear", "peasant", "pelican", "pen", "penalty", "pencil", "people", "pepper", "perfect", "permit", "person", "pet", "phone", "photo", "phrase", "physical", "piano", "picnic", "picture", "piece", "pig", "pigeon", "pill", "pilot", "pink", "pioneer", "pipe", "pistol", "pitch", "pizza", "place", "planet", "plastic", "plate", "play", "please", "pledge", "pluck", "plug", "plunge", "poem", "poet", "point", "polar", "pole", "police", "pond", "pony", "pool", "popular", "portion", "position", "possible", "post", "potato", "pottery", "poverty", "powder", "power", "practice", "praise", "predict", "prefer", "prepare", "present", "pretty", "prevent", "price", "pride", "primary", "print", "priority", "prison", "private", "prize", "problem", "process", "produce", "profit", "program", "project", "promote", "proof", "property", "prosper", "protect", "proud", "provide", "public", "pudding", "pull", "pulp", "pulse", "pumpkin", "punch", "pupil", "puppy", "purchase", "purity", "purpose", "purse", "push", "put", "puzzle", "pyramid", "quality", "quantum", "quarter", "question", "quick", "quit", "quiz", "quote", "rabbit", "raccoon", "race", "rack", "radar", "radio", "rail", "rain", "raise", "rally", "ramp", "ranch", "random", "range", "rapid", "rare", "rate", "rather", "raven", "raw", "razor", "ready", "real", "reason", "rebel", "rebuild", "recall", "receive", "recipe", "record", "recycle", "reduce", "reflect", "reform", "refuse", "region", "regret", "regular", "reject", "relax", "release", "relief", "rely", "remain", "remember", "remind", "remove", "render", "renew", "rent", "reopen", "repair", "repeat", "replace", "report", "require", "rescue", "resemble", "resist", "resource", "response", "result", "retire", "retreat", "return", "reunion", "reveal", "review", "reward", "rhythm", "rib", "ribbon", "rice", "rich", "ride", "ridge", "rifle", "right", "rigid", "ring", "riot", "ripple", "risk", "ritual", "rival", "river", "road", "roast", "robot", "robust", "rocket", "romance", "roof", "rookie", "room", "rose", "rotate", "rough", "round", "route", "royal", "rubber", "rude", "rug", "rule", "run", "runway", "rural", "sad", "saddle", "sadness", "safe", "sail", "salad", "salmon", "salon", "salt", "salute", "same", "sample", "sand", "satisfy", "satoshi", "sauce", "sausage", "save", "say", "scale", "scan", "scare", "scatter", "scene", "scheme", "school", "science", "scissors", "scorpion", "scout", "scrap", "screen", "script", "scrub", "sea", "search", "season", "seat", "second", "secret", "section", "security", "seed", "seek", "segment", "select", "sell", "seminar", "senior", "sense", "sentence", "series", "service", "session", "settle", "setup", "seven", "shadow", "shaft", "shallow", "share", "shed", "shell", "sheriff", "shield", "shift", "shine", "ship", "shiver", "shock", "shoe", "shoot", "shop", "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shy", "sibling", "sick", "side", "siege", "sight", "sign", "silent", "silk", "silly", "silver", "similar", "simple", "since", "sing", "siren", "sister", "situate", "six", "size", "skate", "sketch", "ski", "skill", "skin", "skirt", "skull", "slab", "slam", "sleep", "slender", "slice", "slide", "slight", "slim", "slogan", "slot", "slow", "slush", "small", "smart", "smile", "smoke", "smooth", "snack", "snake", "snap", "sniff", "snow", "soap", "soccer", "social", "sock", "soda", "soft", "solar", "soldier", "solid", "solution", "solve", "someone", "song", "soon", "sorry", "sort", "soul", "sound", "soup", "source", "south", "space", "spare", "spatial", "spawn", "speak", "special", "speed", "spell", "spend", "sphere", "spice", "spider", "spike", "spin", "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray", "spread", "spring", "spy", "square", "squeeze", "squirrel", "stable", "stadium", "staff", "stage", "stairs", "stamp", "stand", "start", "state", "stay", "steak", "steel", "stem", "step", "stereo", "stick", "still", "sting", "stock", "stomach", "stone", "stool", "story", "stove", "strategy", "street", "strike", "strong", "struggle", "student", "stuff", "stumble", "style", "subject", "submit", "subway", "success", "such", "sudden", "suffer", "sugar", "suggest", "suit", "summer", "sun", "sunny", "sunset", "super", "supply", "supreme", "sure", "surface", "surge", "surprise", "surround", "survey", "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear", "sweet", "swift", "swim", "swing", "switch", "sword", "symbol", "symptom", "syrup", "system", "table", "tackle", "tag", "tail", "talent", "talk", "tank", "tape", "target", "task", "taste", "tattoo", "taxi", "teach", "team", "tell", "ten", "tenant", "tennis", "tent", "term", "test", "text", "thank", "that", "theme", "then", "theory", "there", "they", "thing", "this", "thought", "three", "thrive", "throw", "thumb", "thunder", "ticket", "tide", "tiger", "tilt", "timber", "time", "tiny", "tip", "tired", "tissue", "title", "toast", "tobacco", "today", "toddler", "toe", "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue", "tonight", "tool", "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise", "toss", "total", "tourist", "toward", "tower", "town", "toy", "track", "trade", "traffic", "tragic", "train", "transfer", "trap", "trash", "travel", "tray", "treat", "tree", "trend", "trial", "tribe", "trick", "trigger", "trim", "trip", "trophy", "trouble", "truck", "true", "truly", "trumpet", "trust", "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel", "turkey", "turn", "turtle", "twelve", "twenty", "twice", "twin", "twist", "two", "type", "typical", "ugly", "umbrella", "unable", "unaware", "uncle", "uncover", "under", "undo", "unfair", "unfold", "unhappy", "uniform", "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", "update", "upgrade", "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use", "used", "useful", "useless", "usual", "utility", "vacant", "vacuum", "vague", "valid", "valley", "valve", "van", "vanish", "vapor", "various", "vast", "vault", "vehicle", "velvet", "vendor", "venture", "venue", "verb", "verify", "version", "very", "vessel", "veteran", "viable", "vibrant", "vicious", "victory", "video", "view", "village", "vintage", "violin", "virtual", "virus", "visa", "visit", "visual", "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote", "voyage", "wage", "wagon", "wait", "walk", "wall", "walnut", "want", "warfare", "warm", "warrior", "wash", "wasp", "waste", "water", "wave", "way", "wealth", "weapon", "wear", "weasel", "weather", "web", "wedding", "weekend", "weird", "welcome", "west", "wet", "whale", "what", "wheat", "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife", "wild", "will", "win", "window", "wine", "wing", "wink", "winner", "winter", "wire", "wisdom", "wise", "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word", "work", "world", "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write", "wrong", "yard", "year", "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo"];

/**
 * Extended list of seed words for Swedish rhymes
 */
const swedishSeedWords = ["övergiva", "förmåga", "kapabel", "om", "ovan", "frånvarande", "absorbera", "abstrakt", "absurd", "missbruk", "tillgång", "olycka", "konto", "anklaga", "uppnå", "syra", "akustisk", "förvärva", "över", "agera", "handling", "skådespelare", "skådespelerska", "faktisk", "anpassa", "lägga till", "missbrukare", "adress", "justera", "erkänna", "vuxen", "avancera", "råd", "aerobisk", "affär", "ha råd", "rädd", "igen", "ålder", "agent", "hålla med", "framför", "mål", "luft", "flygplats", "gång", "alarm", "album", "alkohol", "alert", "utomjording", "alla", "gränd", "tillåta", "nästan", "ensam", "alfa", "redan", "också", "ändra", "alltid", "amatör", "fantastisk", "bland", "mängd", "road", "analytiker", "ankare", "antik", "ilska", "vinkel", "arg", "djur", "ankel", "meddela", "årlig", "en annan", "svar", "antenn", "antikvitet", "ångest", "någon", "isär", "ursäkt", "visa sig", "äpple", "godkänna", "april", "båge", "arktisk", "område", "arena", "argumentera", "arm", "beväpnad", "rustning", "armé", "runt", "arrangera", "gripa", "anlända", "pil", "konst", "artefakt", "artist", "konstverk", "fråga", "aspekt", "överfall", "tillgång", "assistera", "anta", "astma", "atlet", "atom", "attack", "delta", "attityd", "attrahera", "auktion", "revision", "augusti", "moster", "författare", "bil", "höst", "genomsnitt", "avokado", "undvika", "vaken", "medveten", "iväg", "fantastisk", "hemsk", "pinsamt", "axel", "bebis", "ungkarl", "bacon", "märke", "väska", "balans", "balkong", "boll", "bambu", "banan", "banderoll", "bar", "knappt", "fynd", "tunna", "bas", "grundläggande", "korg", "strid", "strand", "böna", "skönhet", "eftersom", "bli", "nötkött", "före", "börja", "bete sig", "bakom", "tro", "nedanför", "bälte", "bänk", "fördel", "bäst", "förråda", "bättre", "mellan", "bortom", "cykel", "bud", "cykel", "binda", "biologi", "fågel", "födelse", "bitter", "svart", "blad", "skylla", "filt", "explosion", "dyster", "välsigna", "blind", "blod", "blomma", "blus", "blå", "oskärpa", "rodna", "bräda", "båt", "kropp", "koka", "bomb", "ben", "bonus", "bok", "öka", "gräns", "tråkig", "låna", "chef", "botten", "studsa", "låda", "pojke", "konsol", "hjärna", "märke", "mässing", "modig", "bröd", "bris", "tegel", "bro", "kort", "ljus", "ta med", "rask", "broccoli", "trasig", "brons", "kvast", "bror", "brun", "borste", "bubbla", "kompis", "budget", "buffel", "bygga", "glödlampa", "massa", "kula", "bunt", "bunker", "börda", "burgare", "spricka", "buss", "företag", "upptagen", "smör", "köpare", "surr", "kål", "stuga", "kabel", "kaktus", "bur", "tårta", "samtal", "lugn", "kamera", "läger", "burk", "kanal", "avbryta", "godis", "kanon", "kanot", "duk", "ravin", "kapabel", "huvudstad", "kapten", "bil", "kol", "kort", "last", "matta", "bära", "vagn", "fall", "kontanter", "kasino", "slott", "avslappnad", "katt", "katalog", "fånga", "kategori", "boskap", "fångad", "orsak", "varning", "grotta", "tak", "selleri", "cement", "folkräkning", "århundrade", "flingor", "säker", "stol", "krita", "mästare", "förändra", "kaos", "kapitel", "avgift", "jaga", "chatta", "billig", "kontrollera", "ost", "kock", "körsbär", "bröst", "kyckling", "hövding", "barn", "skorsten", "val", "välja", "kronisk", "fnissa", "bit", "kärna"];

/**
 * Get a random seed word based on language
 * @param {string} lang - Language code (en/sv)
 * @returns {string} A random seed word
 */
function getRandomSeedWord(lang = 'en') {
    const seedWords = lang === 'en' ? englishSeedWords : swedishSeedWords;
    return seedWords[Math.floor(Math.random() * seedWords.length)];
}

/**
 * Get rhyming words in English using Datamuse API with enhanced variation
 * @param {string} word - The word to find rhymes for
 * @param {number} limit - Maximum number of rhymes to return (default: 10)
 * @returns {Array} An array of rhyming words
 */
async function getEnglishRhymes(word, limit = 10) {
    try {
        // Randomly select which type of rhyme/word relationship to use
        const rhymeTypes = [
            { code: 'rel_rhy', description: 'Perfect rhymes' },
            { code: 'rel_nry', description: 'Near rhymes' },
            { code: 'sl', description: 'Sounds like' },
            { code: 'rel_hom', description: 'Homophones' }
        ];

        // 60% chance to use perfect rhymes, 40% chance to use other types
        const selectedType = Math.random() < 0.6 ?
            rhymeTypes[0] :
            rhymeTypes[Math.floor(Math.random() * (rhymeTypes.length - 1)) + 1];

        // Use Datamuse API with the selected relationship type
        const response = await axios.get(`https://api.datamuse.com/words?${selectedType.code}=${encodeURIComponent(word)}&max=${limit * 2}`);

        // Extract just the words from the response
        let rhymes = response.data.map(item => item.word);

        // If we get enough rhymes, return them with info about type
        if (rhymes.length >= 5) {
            // Shuffle the array to get different results each time
            rhymes = shuffleArray(rhymes).slice(0, limit);

            return {
                word,
                rhymes,
                note: selectedType.description
            };
        }

        // If not enough results, try a fallback to perfect rhymes
        if (selectedType.code !== 'rel_rhy') {
            const fallbackResponse = await axios.get(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(word)}&max=${limit}`);
            const fallbackRhymes = fallbackResponse.data.map(item => item.word);

            if (fallbackRhymes.length > 0) {
                return {
                    word,
                    rhymes: shuffleArray(fallbackRhymes).slice(0, limit),
                    note: `${selectedType.description} (with perfect rhyme fallback)`
                };
            }
        }

        // If still not enough, try to get related words instead
        const relatedResponse = await axios.get(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(word)}&max=${limit}`);
        const relatedWords = relatedResponse.data.map(item => item.word);

        if (relatedWords.length > 0) {
            return {
                word,
                rhymes: shuffleArray(relatedWords).slice(0, limit),
                note: "Related words (no rhymes found)"
            };
        }

        // Last fallback for very unusual words
        return {
            word,
            rhymes: [],
            note: "No rhymes or related words found for this term."
        };
    } catch (error) {
        console.error(`Error fetching English rhymes for "${word}":`, error.message);
        return {
            word,
            rhymes: [],
            error: "Failed to fetch rhymes"
        };
    }
}

/**
 * Helper function to shuffle an array (Fisher-Yates algorithm)
 * @param {Array} array - The array to shuffle
 * @returns {Array} The shuffled array
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Simple in-memory cache for Swedish rhymes to reduce load on rimlexikon.se
const swedishRhymeCache = new Map();
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Enhanced Swedish rhyme generation with multiple sources
 * @param {string} word - The word to find rhymes for
 * @param {number} limit - Maximum number of rhymes to return (default: 10)
 * @returns {Object} Object containing the word and an array of rhyming words
 */
async function getSwedishRhymes(word, limit = 10) {
    // Normalize the word (lowercase, trim spaces)
    const normalizedWord = word.toLowerCase().trim();

    try {
        // Check cache first to reduce load on external services
        if (swedishRhymeCache.has(normalizedWord)) {
            const cachedItem = swedishRhymeCache.get(normalizedWord);
            // Check if cache is still valid
            if (Date.now() - cachedItem.timestamp < CACHE_EXPIRY) {
                return {
                    word: normalizedWord,
                    rhymes: shuffleArray(cachedItem.rhymes).slice(0, limit),
                    source: 'cache'
                };
            } else {
                // Cache expired, remove it
                swedishRhymeCache.delete(normalizedWord);
            }
        }

        // Try to get rhymes from the primary source (rimlexikon.se)
        const primaryRhymes = await fetchSwedishRhymesFromRimlexikon(normalizedWord);

        // Try a second approach: Variations of the word for more options
        const variations = generateSwedishWordVariations(normalizedWord);
        let secondaryRhymes = [];

        // Only try secondary sources if primary source has too few results
        if (primaryRhymes.length < 5 && variations.length > 0) {
            // Try to get rhymes for word variations (pick up to 2 random variations)
            const variationsToTry = shuffleArray(variations).slice(0, 2);
            for (const variation of variationsToTry) {
                if (variation !== normalizedWord) {
                    const variationRhymes = await fetchSwedishRhymesFromRimlexikon(variation);
                    secondaryRhymes = [...secondaryRhymes, ...variationRhymes];
                }
            }
        }

        // Combine results, remove duplicates, and limit
        let combinedRhymes = [...new Set([...primaryRhymes, ...secondaryRhymes])];

        // Remove the original word if it somehow got included
        combinedRhymes = combinedRhymes.filter(rhyme => rhyme !== normalizedWord);

        // Cache the results
        swedishRhymeCache.set(normalizedWord, {
            rhymes: combinedRhymes,
            timestamp: Date.now()
        });

        // If no rhymes found at all, handle gracefully
        if (combinedRhymes.length === 0) {
            return {
                word: normalizedWord,
                rhymes: [],
                note: "Inga rim hittades för detta ord." // "No rhymes found for this word" in Swedish
            };
        }

        // Return with a shuffle for more variety each time
        return {
            word: normalizedWord,
            rhymes: shuffleArray(combinedRhymes).slice(0, limit)
        };
    } catch (error) {
        console.error(`Error fetching Swedish rhymes for "${normalizedWord}":`, error.message);

        // More comprehensive error handling with specific messages
        if (error.code === 'ECONNABORTED') {
            return {
                word: normalizedWord,
                rhymes: [],
                note: "Timeout vid anslutning till rimordbok." // "Timeout connecting to rhyme dictionary" in Swedish
            };
        } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
            return {
                word: normalizedWord,
                rhymes: [],
                note: "Kunde inte ansluta till rimordbok. Kontrollera din internetanslutning." // "Could not connect to rhyme dictionary. Check your internet connection." in Swedish
            };
        } else if (error.response) {
            // Handle specific HTTP error responses
            if (error.response.status === 404) {
                return {
                    word: normalizedWord,
                    rhymes: [],
                    note: "Ordet hittades inte i rimlexikon." // "The word was not found in the rhyme dictionary" in Swedish
                };
            } else if (error.response.status === 429) {
                return {
                    word: normalizedWord,
                    rhymes: [],
                    note: "För många förfrågningar till rimordboken. Vänta en stund och försök igen." // "Too many requests to the rhyme dictionary. Wait a moment and try again." in Swedish
                };
            } else if (error.response.status >= 500) {
                return {
                    word: normalizedWord,
                    rhymes: [],
                    note: "Rimordboken är tillfälligt otillgänglig. Försök igen senare." // "The rhyme dictionary is temporarily unavailable. Try again later." in Swedish
                };
            }
        }

        // Generic fallback for any other errors
        return {
            word: normalizedWord,
            rhymes: [],
            note: "Kunde inte hämta rim. Försök igen senare." // "Could not fetch rhymes. Try again later." in Swedish
        };
    }
}

/**
 * Fetch Swedish rhymes from rimlexikon.se
 * @param {string} word - The word to find rhymes for
 * @returns {Array} Array of rhyming words
 */
async function fetchSwedishRhymesFromRimlexikon(word) {
    const targetUrl = `https://www.rimlexikon.se/ord/${encodeURIComponent(word)}`;

    // Fetch HTML with a proper User-Agent to identify our application
    const response = await axios.get(targetUrl, {
        headers: {
            'User-Agent': 'FreestyleHelper/1.0 (https://freestylehelper.vercel.app)',
            'Accept': 'text/html',
            'Accept-Language': 'sv,en;q=0.9'
        },
        timeout: 5000 // 5 second timeout to prevent hanging requests
    });

    // Parse HTML with cheerio
    const $ = cheerio.load(response.data);

    // Extract rhymes from word list - using a robust selector pattern
    // First try the expected selector
    let rhymeElements = $('ol.word-list li');

    // If primary selector fails, try fallback selectors
    if (rhymeElements.length === 0) {
        // Try alternative selectors that might exist if site structure changes
        rhymeElements = $('ul.word-list li, div.rhymes li, .rhyme-list li');

        // If still no rhymes found with fallback selectors
        if (rhymeElements.length === 0) {
            // Last resort: try to find any list items that might contain rhymes
            rhymeElements = $('ol li, ul li').filter(function () {
                // Simple heuristic: list items in the main content area
                return $(this).parents('nav, header, footer').length === 0;
            });
        }
    }

    // Extract rhymes
    const rhymes = [];
    rhymeElements.each((index, element) => {
        const rhymeText = $(element).text().trim();
        if (rhymeText && rhymeText !== word) {
            rhymes.push(rhymeText);
        }
    });

    return rhymes;
}

/**
 * Generate variations of Swedish words to find more rhyming options
 * @param {string} word - The original word
 * @returns {Array} Array of word variations
 */
function generateSwedishWordVariations(word) {
    const variations = [];

    // Only process words with 4+ characters
    if (word.length < 4) return variations;

    // Common Swedish word endings for nouns and verbs
    const wordEndings = [
        { ending: 'a', replacement: 'ar' },   // plural indefinite form of en-words
        { ending: 'a', replacement: 'an' },   // definite form of en-words
        { ending: 'e', replacement: 'ar' },   // plural of some en-words
        { ending: 'en', replacement: 'et' },  // switch between en/ett words
        { ending: 'et', replacement: 'en' },  // switch between ett/en words
        { ending: 'ar', replacement: 'arna' }, // definite plural of en-words
        { ending: 'or', replacement: 'orna' }, // definite plural of or-words
        { ending: 'a', replacement: 'ade' },  // past tense of -a verbs
        { ending: 'a', replacement: 'at' },   // supine of -a verbs
    ];

    // Check if the word ends with any of the defined endings
    for (const { ending, replacement } of wordEndings) {
        if (word.endsWith(ending)) {
            const stem = word.slice(0, -ending.length);
            variations.push(stem + replacement);
        }
    }

    // Add common verb tense variations if word is likely a verb
    if (word.endsWith('a')) {
        const stem = word.slice(0, -1);
        variations.push(stem + 'ar');  // present tense
        variations.push(stem + 'ade'); // past tense
        variations.push(stem + 'at');  // supine
    }

    return variations;
}

module.exports = {
    generateSongStructure,
    generateRhymeScheme,
    getEnglishRhymes,
    getSwedishRhymes,
    getRandomSeedWord, // Export the new function for use in API endpoints
    englishSeedWords,
    swedishSeedWords
};
