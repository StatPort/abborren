let GENDER_OPTIONS = DEFAULT_GENDER_OPTIONS;
let MENTAL_AGE_OPTIONS = DEFAULT_MENTAL_AGE_OPTIONS;
let CLASS_OPTIONS = DEFAULT_CLASS_OPTIONS;

let personCount = 0;

function personBlockHtml(index) {
  const genderOpts = GENDER_OPTIONS.map((g) => `<option value="${g}">${g}</option>`).join("");
  const ageOpts = MENTAL_AGE_OPTIONS.map((a) => `<option value="${a}">${a}</option>`).join("");
  const classOpts = CLASS_OPTIONS.map((c) => `<option value="${c}">${c}</option>`).join("");
  return `
  <fieldset class="person-block" data-index="${index}">
    <legend>Deltagare ${index + 1}</legend>

    <label for="nickname-${index}">Nickname</label>
    <input type="text" id="nickname-${index}" class="f-nickname" required>

    <label for="age-${index}">Mental ålder</label>
    <select id="age-${index}" class="f-age" required>
      <option value="" disabled selected>Välj...</option>
      ${ageOpts}
    </select>

    <label for="gender-${index}">Kön</label>
    <select id="gender-${index}" class="f-gender" required>
      <option value="" disabled selected>Välj...</option>
      ${genderOpts}
    </select>

    <label for="hometown-${index}">Orten från vilken du har ditt första minne</label>
    <input type="text" id="hometown-${index}" class="f-hometown" required>

    <label for="attending-${index}">Jag kommer på...</label>
    <select id="attending-${index}" class="f-attending" required>
      <option value="" disabled selected>Välj...</option>
      <option value="Loppet">Jag kommer på loppet</option>
      <option value="Festen">Jag kommer på festen</option>
      <option value="Båda">Jag kommer på båda</option>
      <option value="Kommer inte">Jag kommer inte alls tyvärr, hemsk ledsen</option>
    </select>

    <label for="class-${index}">Välj klass
      <button type="button" class="info-btn class-info-btn" title="Mer info om klasser">i</button>
    </label>
    <select id="class-${index}" class="f-class" required>
      <option value="" disabled selected>Välj...</option>
      ${classOpts}
    </select>

    <label>Jag behöver parkering</label>
    <div class="radio-row">
      <label class="radio-row"><input type="radio" name="parking-${index}" class="f-parking" value="Ja" required> Ja</label>
      <label class="radio-row"><input type="radio" name="parking-${index}" class="f-parking" value="Nej"> Nej</label>
    </div>

    <label for="diet-${index}">Kost/allergier</label>
    <input type="text" id="diet-${index}" class="f-diet" placeholder="(valfritt)">
  </fieldset>`;
}

function addPersonBlock() {
  const container = document.getElementById("people-container");
  const wrapper = document.createElement("div");
  wrapper.innerHTML = personBlockHtml(personCount);
  container.appendChild(wrapper.firstElementChild);
  personCount++;
}

function readPersonBlocks() {
  const blocks = document.querySelectorAll(".person-block");
  const people = [];
  blocks.forEach((block) => {
    people.push({
      nickname: block.querySelector(".f-nickname").value,
      age: block.querySelector(".f-age").value,
      gender: block.querySelector(".f-gender").value,
      hometown: block.querySelector(".f-hometown").value,
      attending: block.querySelector(".f-attending").value,
      participantClass: block.querySelector(".f-class").value,
      parking: block.querySelector(".f-parking:checked")?.value || "",
      diet: block.querySelector(".f-diet").value
    });
  });
  return people;
}

document.addEventListener("DOMContentLoaded", async () => {
  const [genderOpts, ageOpts, classOpts] = await Promise.all([
    AbborrenDB.getConfig("genderOptions", DEFAULT_GENDER_OPTIONS),
    AbborrenDB.getConfig("mentalAgeOptions", DEFAULT_MENTAL_AGE_OPTIONS),
    AbborrenDB.getConfig("classOptions", DEFAULT_CLASS_OPTIONS)
  ]);
  GENDER_OPTIONS = genderOpts;
  MENTAL_AGE_OPTIONS = ageOpts;
  CLASS_OPTIONS = classOpts;

  addPersonBlock();

  document.getElementById("add-person-btn").addEventListener("click", addPersonBlock);

  document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("class-info-btn")) {
      document.getElementById("class-info-backdrop").classList.add("open");
    }
  });
  document.getElementById("class-info-close").addEventListener("click", () => {
    document.getElementById("class-info-backdrop").classList.remove("open");
  });
  document.getElementById("class-info-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "class-info-backdrop") e.target.classList.remove("open");
  });

  document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const people = readPersonBlocks();
    const groupLabel = people.length > 1 ? "Sällskap " + Date.now() : null;

    const submitBtn = e.target.querySelector(".submit-btn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Skickar...";

    try {
      await AbborrenDB.addSignups(people, groupLabel);

      document.getElementById("confirm-overlay").classList.add("open");
      playFanfare();

      document.getElementById("people-container").innerHTML = "";
      personCount = 0;
      addPersonBlock();
    } catch (err) {
      console.error(err);
      alert("Något gick fel vid anmälan. Försök igen.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Skicka anmälan";
    }
  });

  document.getElementById("confirm-close-btn").addEventListener("click", () => {
    document.getElementById("confirm-overlay").classList.remove("open");
  });
});
