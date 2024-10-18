const bestFilms = "http://127.0.0.1:8000/api/v1/titles/?sort_by=-imdb_score"
const movieById = "http://127.0.0.1:8000/api/v1/titles/"
const genresUrl = `http://127.0.0.1:8000/api/v1/genres/`
const genreMovieUrl = `http://127.0.0.1:8000/api/v1/titles/`


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

            const content = `
                <img class="section-best-movie" src="${res.image_url ?? ""}" alt="Movie image">
                <p>Title: ${res.title}</p>
                <p>Genre(s): ${res.genres}</p>
                <p>Date published: ${res.date_published}</p>
                <p>Rated: ${res.rated}</p>
                <p>IMDB Score: ${res.imdb_score}</p>
                <p>Director(s): ${res.directors}</p>
                <p>Actors: ${res.actors}</p>
                <p>Duration: ${res.duration} minutes</p>
                <p>Country: ${res.countries}</p>
                <p>World Box Office: ${(res.worldwide_gross_income) ? res.worldwide_gross_income : "Not available"}</p>
                <p>Description: ${res.description}</p>
                <button class="close-modal">Close</button>
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
            <h2>${bestMovieAllTime.title}</h2>
            <p>${movie.long_description}</p>
            <button id="${idMovie}" class=" button-best-movie modal-trigger">Détails</button>
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
        const idMovie = dataMovies[i].id;
        let data = `
            <article class="article-with-image">
                <img src="${dataMovies[i].image_url}" alt="Movie image">
                <div class="overlay-list">
                    <h2>${dataMovies[i].title}</h2>
                    <button id="${idMovie}" class="btn-overlay modal-trigger">Détail</button>
                </div>
            </article>
        `;
        section.innerHTML += data;
    }
    // Plus besoin d'appeler `modal(movieById)` ici car l'event delegation gère tout
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
createOtherCategory(2)





