const bestFilms = "http://127.0.0.1:8000/api/v1/titles/?sort_by=-imdb_score"
const movieById = "http://127.0.0.1:8000/api/v1/titles/"
const genresUrl = `http://127.0.0.1:8000/api/v1/genres/`
const genreMovieUrl = `http://127.0.0.1:8000/api/v1/titles/`
const nbStraticCategory = 2

const fetchUrl = async (url) => {
    try {
        let response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        let data = await response.json();
        return data.results;
    } catch (err) {
        throw err;
    }
};

const fetchUrlwithID = async (url, id) => {
    try {
        let response = await fetch(url + id);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        let data = await response.json();
        return data;
    } catch (err) {
        throw err;
    }
};

async function getGenres() {
    let movieCategories = [];
    let page = 1
    let nameGenre;
    let hasMorePage = true;

    while (hasMorePage) {
        try {
            let pageGenre = await fetchUrl(genresUrl + "?page=" + page);

            if (pageGenre && pageGenre.length > 0) {
                nameGenre = pageGenre.map((genre) => genre.name);
                movieCategories = movieCategories.concat(nameGenre);
                page++;
            } else {
                hasMorePage = false;
            }
        } catch (err) {
            hasMorePage = false;
        }
    }
    return movieCategories;
}

async function getBestMovieByCategorie(categorie = "all", page = 1, nbFilm = 7) {
    let movies = [];
    let maxPages = 5; // Limite le nombre de pages à parcourir pour éviter de tourner à l'infini
    let currentPage = page;

    while (movies.length < nbFilm && currentPage <= maxPages) {
        try {
            let url;
            if (categorie !== "all") {
                url = genreMovieUrl + `?genre=${categorie}&page=${currentPage}&sort_by=-imdb_score`;
            } else if (categorie === "all") {
                url = genreMovieUrl + `?page=${currentPage}&sort_by=-imdb_score`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erreur: ${response.status} - ${response.statusText}`);
            }

            const bestMovieByCategorie = await response.json();

            if (bestMovieByCategorie.results.length === 0) {
                break; // Sort si pas de résultats
            }

            movies = movies.concat(bestMovieByCategorie.results);
            currentPage++;
        } catch (e) {
            console.log("Erreur dans la récupération des films: ", e);
            break; // Sort en cas d'erreur pour éviter de tourner indéfiniment
        }
    }

    return movies.slice(0, nbFilm);
}

function createModal() {
    if (!document.querySelector(".modal-container")) {
        const body = document.querySelector("body");
        const modal = `
            <!-- The Modal -->
            <div class="modal-container">
                <div class="overlay"></div>
                <div class="modal"></div>
            </div>
        `;
        body.insertAdjacentHTML('beforeend', modal);
    }
}

function toggleModal(modalContainer) {
    modalContainer.classList.toggle("active");
}

async function modal(category) {
    createModal();
    const modalContainer = document.querySelector(".modal-container");
    const infosModal = document.querySelector(".modal");

    // Event delegation pour tous les éléments générés avec la classe `modal-trigger`
    document.body.addEventListener('click', async function (event) {
        if (event.target.classList.contains("modal-trigger")) {
            const id = event.target.id;
            const res = await fetchUrlwithID(category, id);

            const content = `<div class="modal-desc">
            <div class="info">
            <div class="title-info">
                <h2>${res.title}</h2>
                <p>${res.date_published} - ${res.genres}</p>
                <p>${res.rated} - ${res.duration} minutes (${res.countries})</p>
                <p>IMDB score: ${res.imdb_score}</p>
            </div>
                <div>
                    <p>Réalisé par: <br>${res.directors}</p>
                 </div>
            </div>
            <div>
                <img class="section-best-movie" src="${res.image_url ?? ""}" alt="Movie image">
            </div>
            </div>
                <p>Description: ${res.description}</p>
                <div>
                <p>Avec: ${res.actors}</p>
                <p>World Box Office: ${(res.worldwide_gross_income) ? res.worldwide_gross_income : "Not available"}</p>
            </div>
            <div class="btn-fermer">
                <button class="close-modal">Fermer</button>
            </div>

            `;

            infosModal.innerHTML = content;
            toggleModal(modalContainer);
        }
    });

    // Fermer le modal en cliquant sur l'overlay ou sur le bouton `close-modal`
    document.body.addEventListener('click', function (event) {
        if (event.target.classList.contains("overlay") || event.target.classList.contains("close-modal")) {
            toggleModal(modalContainer);
        }
    });
}

async function displayBestMovie() {
    const bestMovieAllTime = await fetchUrl(bestFilms).then((data) => data[0]);
    const idMovie = bestMovieAllTime.id;
    const movie = await fetchUrlwithID(movieById, idMovie);
    const sectionBestMovie = document.querySelector(".section-best-movie")
    const data = `
        <div class="best-movie-container">
            <img src="${bestMovieAllTime.image_url}">
        </div>
        <div class="info-best-movie">
            <h2 class="film-title">${bestMovieAllTime.title}</h2>
            <p>${movie.long_description}</p>
            <div class="btn-res">
            <button id="${idMovie}" class="button-best-movie modal-trigger">Détails</button>
            </div>
        </div>
            `
    sectionBestMovie.innerHTML = data
    modal(movieById)
}

async function createInputSelect(container) {
    const selectContainer = document.getElementById(container)
    const genres = await getGenres()

    const staticGenreInSite = ["Comedy", "Family", "Mystery"]
    const select = document.createElement("select")

    for (let i = 0; i < genres.length; i++) {
        if (!staticGenreInSite.includes(genres[i])) {
            const option = document.createElement("option")
            option.setAttribute("value", genres[i])
            option.textContent = genres[i]
            select.appendChild(option)
        }
    }
    select.setAttribute("class", "genre-select")
    selectContainer.appendChild(select)

}

async function createStaticCategories(dataMovies, sectionName) {
    const section = document.querySelector(`.${sectionName}`);

    for (let i = 1; i < dataMovies.length; i++) {
        let extraClass = "";

        if (i > 2) {
            extraClass = "mobile";
        }

        if (i >= 5) {
            extraClass += " tablet";
        }

        const idMovie = dataMovies[i].id;
        let data = `
            <article class="article-with-image ${extraClass}">
                <img src="${dataMovies[i].image_url}" alt="Movie image">
                <div class="overlay-list">
                    <h2>${dataMovies[i].title}</h2>
                    <button id="${idMovie}" class="btn-overlay modal-trigger">Détail</button>
                </div>
            </article>
        `;

        section.innerHTML += data;
    }

    let btnHidden = `<div class="btn-display-movies"><button class="btn-hidden">Voir plus</button></div>`;
    section.innerHTML += btnHidden;

    // Gestion du bouton "Voir plus"
    document.querySelectorAll(".btn-hidden").forEach((btn) => {
        let hiddenArticles;
        let classname = ""
        btn.addEventListener("click", () => {
            const section = btn.closest(`.${sectionName}`);
            const isTablet = window.matchMedia("(min-width: 768px) and (max-width: 1024px)").matches;
            const isMobile = window.matchMedia("(max-width: 767px)").matches;

            // Fonction pour gérer l'affichage des articles
            const toggleArticles = (className, el) => {
                let articles = section.querySelectorAll(`.article-with-image.${className}`);
                if (articles.length === 0 && className === 'mobile') {
                    articles = Array.from(section.querySelectorAll('.article-with-image')).slice(el);
                } else if (articles.length === 0 && className === 'tablet') {
                    articles = Array.from(section.querySelectorAll('.article-with-image')).slice(el);
                }
                articles.forEach(article => article.classList.toggle(className));
                return articles;
            };

            // Gérer les articles mobiles
            if (isMobile) {
                hiddenArticles = toggleArticles('mobile', -4);
                classname = "mobile"
            }
            else if (isTablet) {
                hiddenArticles = toggleArticles('tablet', -2);
                classname = "tablet"
            }
            console.log(hiddenArticles)
            btn.innerText = hiddenArticles.length > 0 && (!hiddenArticles[0].classList.contains(classname))
                ? "Voir moins"
                : "Voir plus";
        });
    });
}

async function createSectionCategory() {
    const category = ["all", "Mystery", "Family", "Comedy"]
    const container = ["best-movies-list", "mystery-movies", "famille-movies", "comedie-movies"]
    for (let i = 0; i < category.length; i++) {
        let dataMovies = await getBestMovieByCategorie(category[i])
        createStaticCategories(dataMovies, container[i])
    }
}

async function createOtherCategory(nbSection) {
    for (let i = 0; i < nbSection; i++) {
        const body = document.querySelector(".choice-categories")
        const data = `
            <div id="genre-choice${i}" class="genre-choice best-movie section-movie space-page">
                <h2 class="choice">Autres</h2>
            </div>
            <section class="select-categorie${i} best-movies-list space-page"></section>
        `
        body.innerHTML += data
        await createInputSelect(`genre-choice${i}`)
        const selectElement = document.querySelector(`#genre-choice${i} select`);
        selectElement.setAttribute("id", `genre-select${i}`)
        let dataMovies = await getBestMovieByCategorie(selectElement.value)
        createStaticCategories(dataMovies, `select-categorie${i}`)
    }

    document.querySelectorAll(".genre-select").forEach((elm) => {
        elm.addEventListener("change", async (event) => {
            const t = document.getElementById(event.target.id)
            const x = (t.closest(".genre-choice").nextElementSibling)
            x.innerHTML = ""
            let dataMovies = await getBestMovieByCategorie(event.target.value)
            const classCat = x.classList[0]
            createStaticCategories(dataMovies, classCat)
        })
    })
}

displayBestMovie()
createSectionCategory()
createOtherCategory(nbStraticCategory)





