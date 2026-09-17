const state = { books: [], filter: "todos", query: "" };
const grid = document.querySelector("#book-grid");
const empty = document.querySelector("#empty-state");
const dialog = document.querySelector("#book-dialog");
const dialogContent = document.querySelector("#dialog-content");

const cleanSeries = (series) => series === "SERIES_TITLE" ? "Clássicos pastorais" : series;
const categoryFor = (book) => cleanSeries(book.series) || "avulsos";
const fullTitle = (book) => book.subtitle ? `${book.title}: ${book.subtitle}` : book.title;
const coverPath = (book) => `assets/covers/${book.asin}.jpg`;

function matches(book) {
  const category = categoryFor(book).toLocaleLowerCase("pt-BR");
  const filterMatch = state.filter === "todos" || category === state.filter;
  const haystack = `${book.title} ${book.subtitle} ${book.author}`.toLocaleLowerCase("pt-BR");
  return filterMatch && haystack.includes(state.query);
}

function render() {
  const books = state.books.filter(matches);
  grid.innerHTML = books.map(book => `
    <article class="book-card">
      <div class="book-cover-wrap">
        <img src="${coverPath(book)}" alt="Capa de ${fullTitle(book)}" loading="lazy">
      </div>
      <p class="book-series">${cleanSeries(book.series) || "Confessai Publicações"}</p>
      <h3>${book.title}</h3>
      <p class="book-subtitle">${book.subtitle || ""}</p>
      <div class="book-meta"><span>${book.author}</span><span>${book.price}</span></div>
      <div class="book-actions">
        <button type="button" data-details="${book.asin}">Conhecer</button>
        <a href="${book.amazonUrl}" target="_blank" rel="noopener">Comprar na Amazon ↗</a>
      </div>
    </article>
  `).join("");
  empty.hidden = books.length > 0;
}

function showBook(asin, push = true) {
  const book = state.books.find(item => item.asin === asin);
  if (!book) return;
  dialogContent.innerHTML = `
    <div class="dialog-layout">
      <img src="${coverPath(book)}" alt="Capa de ${fullTitle(book)}">
      <div class="dialog-copy">
        <p class="eyebrow">${cleanSeries(book.series) || "CONFESSAI PUBLICAÇÕES"}</p>
        <h2>${book.title}</h2>
        <p class="subtitle">${book.subtitle || ""}</p>
        <p><strong>${book.author}</strong> · ${book.price}</p>
        <div class="dialog-description">${book.description}</div>
        <a class="button button-primary" href="${book.amazonUrl}" target="_blank" rel="noopener">Comprar na Amazon</a>
      </div>
    </div>`;
  dialog.showModal();
  if (push) history.pushState({ asin }, "", `?livro=${asin}`);
}

document.addEventListener("click", event => {
  const details = event.target.closest("[data-details]");
  if (details) showBook(details.dataset.details);
  const filterLink = event.target.closest("[data-filter-link]");
  if (filterLink) {
    state.filter = filterLink.dataset.filterLink.toLocaleLowerCase("pt-BR");
    document.querySelectorAll("[data-filter]").forEach(btn => btn.classList.toggle("active", btn.dataset.filter === state.filter));
    render();
    document.querySelector("#catalogo").scrollIntoView();
  }
});

document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach(btn => btn.classList.toggle("active", btn === button));
    render();
  });
});

document.querySelector("#catalog-search").addEventListener("input", event => {
  state.query = event.target.value.trim().toLocaleLowerCase("pt-BR");
  render();
});

document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener("close", () => {
  if (location.search) history.pushState({}, "", location.pathname + location.hash);
});
window.addEventListener("popstate", event => {
  const asin = new URLSearchParams(location.search).get("livro");
  if (asin) showBook(asin, false);
  else if (dialog.open) dialog.close();
});
document.querySelector("#year").textContent = new Date().getFullYear();

fetch("data/catalogo.json")
  .then(response => response.json())
  .then(books => {
    state.books = books;
    render();
    const asin = new URLSearchParams(location.search).get("livro");
    if (asin) showBook(asin, false);
  })
  .catch(() => {
    empty.hidden = false;
    empty.textContent = "Não foi possível carregar o catálogo.";
  });
