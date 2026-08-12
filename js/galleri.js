function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

// Skalar ner och komprimerar bilden i webbläsaren innan uppladdning, så
// varken lagringskostnad eller sidladdningstid skenar iväg.
function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error("Kunde inte bearbeta bilden")); return; }
        resolve(new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }));
      }, "image/jpeg", JPEG_QUALITY);
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Kunde inte läsa bilden")); };
    img.src = objectUrl;
  });
}

function imageCardHtml(item) {
  const who = item.uploaderName ? escapeHtml(item.uploaderName) : "Okänd";
  return `
  <div class="gallery-item">
    <img src="${item.url}" alt="Bild från ${who}" class="gallery-thumb" data-full="${item.url}">
    <div class="gallery-caption">${who}</div>
  </div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("gallery-grid");
  const emptyMsg = document.getElementById("gallery-empty-msg");
  const errorMsg = document.getElementById("gallery-error-msg");
  const uploadBtn = document.getElementById("upload-btn");
  const fileInput = document.getElementById("image-file");
  const nameInput = document.getElementById("uploader-name");
  const progressEl = document.getElementById("upload-progress");
  const uploadErrorEl = document.getElementById("upload-error");

  AbborrenDB.subscribeGalleryImages((items) => {
    grid.style.display = items.length ? "grid" : "none";
    emptyMsg.style.display = items.length ? "none" : "block";
    errorMsg.style.display = "none";
    grid.innerHTML = items.map(imageCardHtml).join("");
  }, () => {
    grid.style.display = "none";
    emptyMsg.style.display = "none";
    errorMsg.style.display = "block";
  });

  grid.addEventListener("click", (e) => {
    if (e.target.classList.contains("gallery-thumb")) {
      document.getElementById("lightbox-img").src = e.target.dataset.full;
      document.getElementById("lightbox-backdrop").classList.add("open");
    }
  });
  document.getElementById("lightbox-close").addEventListener("click", () => {
    document.getElementById("lightbox-backdrop").classList.remove("open");
  });
  document.getElementById("lightbox-backdrop").addEventListener("click", (e) => {
    if (e.target.id === "lightbox-backdrop") e.target.classList.remove("open");
  });

  uploadBtn.addEventListener("click", async () => {
    const files = Array.from(fileInput.files || []);
    uploadErrorEl.style.display = "none";
    if (files.length === 0) {
      uploadErrorEl.textContent = "Välj minst en bild att ladda upp.";
      uploadErrorEl.style.display = "block";
      return;
    }

    uploadBtn.disabled = true;
    const name = nameInput.value.trim();

    try {
      for (let i = 0; i < files.length; i++) {
        progressEl.style.display = "block";
        progressEl.textContent = `Laddar upp bild ${i + 1} av ${files.length}...`;
        const resized = await resizeImageFile(files[i]);
        await AbborrenDB.uploadGalleryImage(resized, name, (fraction) => {
          progressEl.textContent = `Laddar upp bild ${i + 1} av ${files.length}... ${Math.round(fraction * 100)}%`;
        });
      }
      progressEl.textContent = "Klart! 🎉";
      fileInput.value = "";
      setTimeout(() => { progressEl.style.display = "none"; }, 3000);
    } catch (err) {
      console.error(err);
      uploadErrorEl.textContent = "Något gick fel vid uppladdningen. Försök igen.";
      uploadErrorEl.style.display = "block";
      progressEl.style.display = "none";
    } finally {
      uploadBtn.disabled = false;
    }
  });
});
