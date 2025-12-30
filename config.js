window.CONFIG = {
  siteName: "UFC Recognition Game",

  title: "UFC Recognition Game",
  subtitle: "How well do you recognize UFC fighters?",

  description: "Test how well you recognize UFC fighters. One attempt per face.",

  datasetUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQl1RwMsKLP4lMDr5QK3f8LHgqAWdfEdlLP9Sz7TzvYebTD0ocMKe0lfX0rnP1z-sVPr1v3cf_8EsWi/pub?output=csv", 

  totalPerRound: 20,
  pointsPerCorrect: 10,

  itemLabel: "Fighter",

  shareTemplate:
    "I scored {score} / {max} on UFC Recognition Game. Can you beat me?",
  shareUrl: "https://ufcrecognitiongame.com",

  endMessages: [
    { min: 160, text: "You really know your UFC." },
    { min: 120, text: "Solid — but you missed some killers." },
    { min: 80,  text: "You know the faces. The names are harder." },
    { min: 0,   text: "That was rough. Time to rewatch some fights." }
  ],

  background: {
    start: "#fbe9e7",
    end: "#ffccbc"
  }

  relatedGames: [
    { name: "NBA", url: "https://nbarecognitiongame.com" },
    { name: "NFL", url: "https://nflrecognitiongame.com" },
    { name: "Soccer", url: "https://soccerrecognitiongame.com" },
    { name: "UFC", url: "https://ufcrecognitiongame.com" },
    { name: "Celebrity", url: "https://celebrityrecognitiongame.com" }
  ]

};
