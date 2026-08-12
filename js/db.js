/*
 * Databaslager. Använder Firestore om FIREBASE_CONFIG är ifylld med riktiga
 * nycklar, annars faller den tillbaka på localStorage så sidan går att testa
 * innan Firebase är kopplat. Samma AbborrenDB-API oavsett bakände.
 * DEFAULT_TASKS kommer från config-defaults.js (måste laddas innan denna fil).
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
  // choices: array av valda alternativ (flerval tillåtet).
  // existingVoteId: om satt, skriver över den rösten istället för att lägga till en ny
  // (används av "Ändra din röst" så man inte kan rösta flera gånger).
  async function addPollVote(pollId, choices, existingVoteId) {
    const vote = { pollId, choices, createdAt: new Date().toISOString() };

    if (useFirebase) {
      if (existingVoteId) {
        await db.collection("pollVotes").doc(existingVoteId).set(vote);
        return existingVoteId;
      }
      const ref = await db.collection("pollVotes").add(vote);
      return ref.id;
    }

    const key = "pollVotes_" + pollId;
    const current = lsGet(key, []);
    if (existingVoteId) {
      const idx = current.findIndex((v) => v.id === existingVoteId);
      if (idx !== -1) {
        current[idx] = Object.assign({ id: existingVoteId }, vote);
      } else {
        current.push(Object.assign({ id: existingVoteId }, vote));
      }
      lsSet(key, current);
      notify(key);
      return existingVoteId;
    }
    const id = cryptoRandomId();
    current.push(Object.assign({ id }, vote));
    lsSet(key, current);
    notify(key);
    return id;
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
    return !!localStorage.getItem("voted_" + pollId);
  }
  function markVoted(pollId, voteId) {
    localStorage.setItem("voted_" + pollId, voteId);
  }
  function getVoteId(pollId) {
    return localStorage.getItem("voted_" + pollId);
  }

  function cryptoRandomId() {
    return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  // ---------- Uppdrag (snurra hjulet) ----------
  // Läser listan av lediga uppdrag live. Uppdrag tas bort permanent (delas mellan
  // alla besökare) när någon klickar "Acceptera uppdrag".
  function subscribeTasks(callback, onError) {
    if (useFirebase) {
      return db.collection("tasks").onSnapshot((snap) => {
        callback(snap.docs.map((d) => Object.assign({ id: d.id }, d.data())));
      }, (err) => {
        console.error("[AbborrenDB] subscribeTasks error:", err);
        if (onError) onError(err);
      });
    }
    const seedKey = "tasks_seeded";
    if (!localStorage.getItem(seedKey)) {
      const seeded = DEFAULT_TASKS.map((label) => ({ id: cryptoRandomId(), label }));
      lsSet("tasks", seeded);
      localStorage.setItem(seedKey, "yes");
    }
    const handler = () => callback(lsGet("tasks", []));
    handler();
    window.addEventListener("abborren-ls-tasks", handler);
    return () => window.removeEventListener("abborren-ls-tasks", handler);
  }

  // Markerar ett uppdrag som paxat (istället för att ta bort det) så det
  // fortsätter synas i "Paxade uppdrag"-listan med namnet på personen.
  async function acceptTask(taskId, name) {
    if (useFirebase) {
      await db.collection("tasks").doc(taskId).update({ claimedBy: name, claimedAt: new Date().toISOString() });
      return;
    }
    const current = lsGet("tasks", []);
    const idx = current.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      current[idx] = Object.assign({}, current[idx], { claimedBy: name, claimedAt: new Date().toISOString() });
    }
    lsSet("tasks", current);
    notify("tasks");
  }

  async function addTask(label) {
    if (useFirebase) {
      await db.collection("tasks").add({ label });
      return;
    }
    const current = lsGet("tasks", []);
    current.push({ id: cryptoRandomId(), label });
    lsSet("tasks", current);
    notify("tasks");
  }

  async function updateTask(taskId, fields) {
    if (useFirebase) {
      await db.collection("tasks").doc(taskId).update(fields);
      return;
    }
    const current = lsGet("tasks", []);
    const idx = current.findIndex((t) => t.id === taskId);
    if (idx !== -1) current[idx] = Object.assign({}, current[idx], fields);
    lsSet("tasks", current);
    notify("tasks");
  }

  async function deleteTask(taskId) {
    if (useFirebase) {
      await db.collection("tasks").doc(taskId).delete();
      return;
    }
    const current = lsGet("tasks", []);
    lsSet("tasks", current.filter((t) => t.id !== taskId));
    notify("tasks");
  }

  async function updateSignup(id, fields) {
    if (useFirebase) {
      await db.collection("signups").doc(id).update(fields);
      return;
    }
    const current = lsGet("signups", []);
    const idx = current.findIndex((s) => s.id === id);
    if (idx !== -1) current[idx] = Object.assign({}, current[idx], fields);
    lsSet("signups", current);
    notify("signups");
  }

  async function deleteSignup(id) {
    if (useFirebase) {
      await db.collection("signups").doc(id).delete();
      return;
    }
    const current = lsGet("signups", []);
    lsSet("signups", current.filter((s) => s.id !== id));
    notify("signups");
  }

  // ---------- Config (admin-redigerbart innehåll) ----------
  // Generisk nyckel/värde-lagring för sådant en admin ska kunna redigera:
  // svarsalternativ, polls, Q&A, osv. Seedas automatiskt med defaultValue
  // första gången ingen har skrivit något ännu.
  async function setConfig(key, value) {
    if (useFirebase) {
      await db.collection("config").doc(key).set({ value });
      return;
    }
    lsSet("config_" + key, value);
    notify("config_" + key);
  }

  function subscribeConfig(key, defaultValue, callback, onError) {
    if (useFirebase) {
      let seeding = false;
      return db.collection("config").doc(key).onSnapshot((doc) => {
        if (doc.exists) {
          callback(doc.data().value);
        } else if (!seeding) {
          seeding = true;
          db.collection("config").doc(key).set({ value: defaultValue })
            .then(() => { seeding = false; });
        }
      }, (err) => {
        console.error("[AbborrenDB] subscribeConfig error for " + key + ":", err);
        if (onError) onError(err);
      });
    }
    const lsKey = "config_" + key;
    if (lsGet(lsKey, null) === null) {
      lsSet(lsKey, defaultValue);
    }
    const handler = () => callback(lsGet(lsKey, defaultValue));
    handler();
    window.addEventListener("abborren-ls-" + lsKey, handler);
    return () => window.removeEventListener("abborren-ls-" + lsKey, handler);
  }

  // Engångsläsning av en config-nyckel (t.ex. för att fylla ett formulär vid
  // sidladdning utan att formuläret hoppar runt om admin ändrar något senare).
  // Faller tillbaka på defaultValue om Firestore inte går att nå (t.ex. innan
  // säkerhetsreglerna är publicerade) så sidan aldrig hänger sig.
  function getConfig(key, defaultValue) {
    return new Promise((resolve) => {
      let unsub = null;
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
        setTimeout(() => { if (unsub) unsub(); }, 0);
      };
      unsub = subscribeConfig(key, defaultValue, finish, () => finish(defaultValue));
    });
  }

  return {
    useFirebase,
    addSignups,
    subscribeSignups,
    updateSignup,
    deleteSignup,
    addPollVote,
    subscribePollVotes,
    hasVoted,
    markVoted,
    getVoteId,
    subscribeTasks,
    acceptTask,
    addTask,
    updateTask,
    deleteTask,
    setConfig,
    subscribeConfig,
    getConfig
  };
})();
