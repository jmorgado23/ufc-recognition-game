if (CONFIG.background) {
  document.documentElement.style.setProperty("--bg-start", CONFIG.background.start);
  document.documentElement.style.setProperty("--bg-end", CONFIG.background.end);
}

const CSV_URL = CONFIG.datasetUrl;
const TOTAL = CONFIG.totalPerRound;

document.getElementById("siteTitle").innerText = CONFIG.title;
document.getElementById("siteSubtitle").innerText = CONFIG.subtitle;

let all = [], round = [], idx = 0, score = 0;
const cache = {};

fetch(CSV_URL).then(r => r.text()).then(t => all = parseCSV(t));

function parseCSV(csv) {
  const rows = [], cur = [];
  let val = "", q = false;
  for (let c of csv) {
    if (c === '"') q = !q;
    else if (c === ',' && !q) { cur.push(val); val = ""; }
    else if ((c === '\n' || c === '\r') && !q) {
      if (val || cur.length) { cur.push(val); rows.push([...cur]); cur.length = 0; val = ""; }
    } else val += c;
  }
  if (val || cur.length) { cur.push(val); rows.push(cur); }

  const headers = rows.shift().map(x => x.trim());
  return rows.map(r => {
    let o = {};
    headers.forEach((k, i) => o[k] = (r[i] || "").trim());
    return {
      name: o.full_name,
      aliases: o.aliases || "",
      conf: Number(o.confidence_level)
    };
  }).filter(x => x.name);
}

const pick = (a,n) => [...a].sort(()=>Math.random()-0.5).slice(0,n);

function buildRound() {
  return [
    ...pick(all.filter(x=>x.conf===5),6),
    ...pick(all.filter(x=>x.conf===4),8),
    ...pick(all.filter(x=>x.conf<=3),6)
  ].sort(()=>Math.random()-0.5);
}

function startRound() {
  gtag('event','round_start');
  round = buildRound(); idx = 0; score = 0;
  startScreen.classList.add("hidden");
  endScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  showFace();
}

function showFace() {
  progress.innerText = `${CONFIG.itemLabel} ${idx+1} of ${TOTAL} • Score ${score}`;
  guessInput.value = "";
  feedback.innerText = "";
  feedback.className = "";
  loadImage(round[idx].name);
}

function loadImage(name) {
  imageStatus.innerText = "Loading image…";
  if (cache[name]) {
    celebrityImage.src = cache[name];
    imageStatus.innerText = "";
    return;
  }
  fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`)
    .then(r=>r.json())
    .then(d=>{
      if (d.thumbnail?.source) {
        cache[name]=d.thumbnail.source;
        celebrityImage.src=d.thumbnail.source;
        imageStatus.innerText="";
      } else {
        celebrityImage.src="";
        imageStatus.innerText="Image not available";
      }
    });
}

function submitGuess() {
  const guess = guessInput.value;
  const correctName = round[idx].name;
  
  const normalizedGuess = normalizeString(guess);
  const normalizedCorrect = normalizeString(correctName);
  
  const aliases = round[idx].aliases || "";

  if (matchesNameOrAlias(guess, correctName, aliases)) {

    score += 1;
  
    feedback.innerHTML = `Correct!<br><span class="small">${correctName}</span>`;
    feedback.className = "correct";
  
    gtag('event','submit_correct');
  } else {
    feedback.innerHTML = `Incorrect!<br><span class="small">${correctName}</span>`;
    feedback.className = "incorrect";
  
    gtag('event','submit_incorrect');
  }
  setTimeout(nextFace,1200);
}

function skip() {
  const correctName = round[idx].name;
  feedback.innerHTML = `Incorrect!<br><span class="small">${correctName}</span>`;
  feedback.className = "incorrect";
  gtag('event','skip_face');
  setTimeout(nextFace,1200);
}

function nextFace() {
  idx++;
  idx < TOTAL ? showFace() : endRound();
}

function endRound() {
  gtag('event','round_complete',{ score: score });
  gameScreen.classList.add("hidden");
  endScreen.classList.remove("hidden");
  finalScore.innerText = `Your score: ${score} / ${TOTAL*CONFIG.pointsPerCorrect}`;
  headline.innerText =
    CONFIG.endMessages.find(m => score >= m.min).text;
  renderCrossLinks();
}

function shareScore() {
  const text = CONFIG.shareTemplate
    .replace("{score}", score)
    .replace("{max}", TOTAL * CONFIG.pointsPerCorrect);

  const url = CONFIG.shareUrl;

  if (navigator.share) {
    navigator.share({
      title: CONFIG.siteName,
      text: text,
      url: url
    });
  } else {
    navigator.clipboard.writeText(`${text} ${url}`).then(() => {
      alert("Link copied! Share it with friends 🙂");
    });
  }

  gtag('event', 'share_score');
}

function renderCrossLinks() {
  if (!CONFIG.relatedGames) return;

  const el = document.getElementById("crossLinks");
  if (!el) return;

  const links = CONFIG.relatedGames
    .map(g => `<a href="${g.url}">${g.name}</a>`)
    .join(" · ");

  el.innerHTML = `Or try another recognition game:<br>${links}`;
}

function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize("NFD")                 // separate accents
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s]/g, "")     // remove punctuation
    .replace(/\s+/g, " ")            // collapse spaces
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function isCloseEnough(input, answer) {
  const a = normalizeString(input);
  const b = normalizeString(answer);

  if (!a || !b) return false;
  if (a === b) return true;

  const distance = levenshtein(a, b);

  // allow small typos based on length
  if (b.length <= 5) return distance <= 1;
  if (b.length <= 10) return distance <= 2;
  return distance <= 3;
}

function matchesNameOrAlias(guess, fullName, aliases) {
  if (isCloseEnough(guess, fullName)) return true;

  if (!aliases) return false;

  const aliasList = aliases
    .split(",")
    .map(a => a.trim())
    .filter(Boolean);

  return aliasList.some(alias => isCloseEnough(guess, alias));
}
