/*
 * Standardvärden för allt admin-redigerbart innehåll. Används för att
 * seeda Firestore/localStorage första gången ingen admin har ändrat
 * något ännu. Redigera via admin-sidan i produktion, inte här.
 */

const DEFAULT_GENDER_OPTIONS = [
  "Kvinna",
  "Man",
  "Icke-binär",
  "Transkvinna",
  "Transman",
  "Genderqueer",
  "Annan könsidentitet",
  "Vill inte uppge"
];

const DEFAULT_MENTAL_AGE_OPTIONS = [
  "Jag lever som om det inte fanns någon morgondag",
  "Föddes som pensionär",
  "Har ett spann på 19-84",
  "Omyndig",
  "Lederna börjar kärva men det går an",
  "Jag gillar lugn och ro",
  "Tidlös & evig"
];

const DEFAULT_CLASS_OPTIONS = ["Fun Run", "Backyard", "Stafett", "Hajk!"];

const DEFAULT_POLLS = [
  {
    id: "poll1",
    question: "Vad får dig att vilja komma på festen?",
    options: [
      "Jag älskar fest",
      "Jag hatar fest men blev tvingad",
      "Jag tyckte att det lät kul bara",
      "Jag älskar korv med bröd",
      "Jag är här för att Matilda & Michael är världens härligaste människor och jag vill hänga med dem",
      "Jag vill springa världens roligaste lopp",
      "Jag vet inte",
      "Jag vill snacka politik"
    ]
  },
  {
    id: "poll2",
    question: "På fest gillar jag att...",
    options: [
      "Dansa när jag får feeling",
      "Springa runt och snacka med alla jag känner och inte känner",
      "Samtala med några få människor",
      "Träffa nytt folk",
      "Hänga med vänner",
      "Springa lopp",
      "Sitta i ett hörn och tjura",
      "Bada pool",
      "Jag gillar inte fest"
    ]
  }
];

const DEFAULT_QA = [
  {
    question: "Finns det möjlighet att duscha/byta om?",
    answer: "Yes! Innedusch, utedusch, vattenslang, sjö och pool finns. Ombyte görs på toan eller i sovrummet om man vill ha privacy. Annars på lämplig plats där man inte nakenschockar någon."
  },
  {
    question: "Vad ska man ta med?",
    answer: "Badkläder och handduk om du ska bada. Springkläder och vattenflaska om du ska springa. Skor är bra också. En påse is om du springer lopp."
  },
  {
    question: "Vad kostar en startplats till loppet?",
    answer: "En påse is. Tas med på loppdagen."
  },
  {
    question: "Får man ta med sig glas och porslin in till poolområdet?",
    answer: "Nej."
  },
  {
    question: "Vilket datum är det? Vart ska vi? Och hur hittar vi dit??",
    answer: "Smsa så skickar jag adress och tips på resväg."
  },
  {
    question: "Kommer det bli något quiz?",
    answer: "Ja, om ni vill."
  },
  {
    question: "Kommer Matilda vara enväldig domare?",
    answer: "Ja, det är korrekt."
  },
  {
    question: "Jag har ideer till loppet, festen eller appen. Vem snackar jag med?",
    answer: "Men vad kul! Vi älskar folk med idéer. Det är bara att höra av sig till oss via de vanliga kanalerna."
  }
];

const DEFAULT_TASKS = [
  "Hjälp Matilda att blanda en batch drinkar",
  "Hjälp Matilda att blanda en batch drinkar",
  "Hjälp Matilda att blanda en batch drinkar",
  "Hjälp Matilda att blanda en batch drinkar",
  "Hjälp Matilda att blanda en batch drinkar",
  "Läs upp frågorna i quizet",
  "Samla ihop folk till quiz",
  "Plocka disk",
  "Servera kaffe",
  "Fyll på med öl och bubbel till kyl",
  "Fyll på med bubbel och öl till baren från kyl",
  "Korvassistent",
  "Vara funktionär under loppet",
  "Vara funktionär under loppet",
  "Vara funktionär under loppet",
  "Vara funktionär under loppet",
  "Fyll på kyl med öl och bubbel",
  "Regnansvarig, om det kommer en skur hjälp till att plocka in dynorna",
  "Isansvarig (oklart vad det innebär, men det kommer behövas)"
];
