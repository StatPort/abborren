/*
 * Databaslager. Använder Firestore om FIREBASE_CONFIG är ifylld med riktiga
 * nycklar, annars faller den tillbaka på localStorage så sidan går att testa
 * innan Firebase är kopplat. Samma AbborrenDB-API oavsett bakände.
 */
const AbborrenDB = (function () {
  const useFirebase = typeof FIREBASE_CONFIG !== "undefined" &&
    FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "REPLACE_ME" &&
    typeof firebase !== "undefined";

  let db = null;
  if (useFirebase) {
    firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
  } else {
    console.warn("[AbborrenDB] Firebase ej konfigurerat – använder localStorage som lokalt testläge.");
  }

  // ---------- localStorage-hjälpare ----------
  function lsGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function lsSet(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  const listeners = {};
  function notify(key) {
    (listeners[key] || []).forEach((cb) => cb(lsGet(key, [])));
    window.dispatchEvent(new CustomEvent("abborren-ls-" + key));
  }

  // ---------- Anmälningar ----------
  async function addSignups(people, groupLabel) {
    const stamped = people.map((p) => Object.assign({}, p, {
      groupLabel: groupLabel || null,
      createdAt: new Date().toISOString()
    }));

    if (useFirebase) {
      const batch = db.batch();
      stamped.forEach((p) => {
        const ref = db.collection("signups").doc();
        batch.set(ref, p);
      });
      await batch.commit();
      return;
    }

    const current = lsGet("signups", []);
    stamped.forEach((p) => current.push(Object.assign({ id: cryptoRandomId() }, p)));
    lsSet("signups", current);
    notify("signups");
  }

  function subscribeSignups(callback) {
    if (useFirebase) {
      return db.collection("signups").orderBy("createdAt", "desc")
        .onSnapshot((snap) => {
          const rows = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
          callback(rows);
        });
    }
    const handler = () => callback(lsGet("signups", []).slice().reverse());
    handler();
    window.addEventListener("abborren-ls-signups", handler);
    listeners["signups"] = listeners["signups"] || [];
    return () => window.removeEventListener("abborren-ls-signups", handler);
  }

  // ---------- Polls ----------
  async function addPollVote(pollId, choice) {
    const vote = { pollId, choice, createdAt: new Date().toISOString() };
    if (useFirebase) {
      await db.collection("pollVotes").add(vote);
      return;
    }
    const key = "pollVotes_" + pollId;
    const current = lsGet(key, []);
    current.push(vote);
    lsSet(key, current);
    notify(key);
  }

  function subscribePollVotes(pollId, callback) {
    if (useFirebase) {
      return db.collection("pollVotes").where("pollId", "==", pollId)
        .onSnapshot((snap) => {
          callback(snap.docs.map((d) => d.data()));
        });
    }
    const key = "pollVotes_" + pollId;
    const handler = () => callback(lsGet(key, []));
    handler();
    window.addEventListener("abborren-ls-" + key, handler);
    return () => window.removeEventListener("abborren-ls-" + key, handler);
  }

  function hasVoted(pollId) {
    return localStorage.getItem("voted_" + pollId) === "yes";
  }
  function markVoted(pollId) {
    localStorage.setItem("voted_" + pollId, "yes");
  }

  function cryptoRandomId() {
    return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  return {
    useFirebase,
    addSignups,
    subscribeSignups,
    addPollVote,
    subscribePollVotes,
    hasVoted,
    markVoted
  };
})();
