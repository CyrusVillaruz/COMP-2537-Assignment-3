const PAGE_SIZE = 10;
let currentPage = 1;
let pokemons = [];
let numPageButtons = 5;

const updatePaginationDiv = (currentPage, numPages) => {
  $("#pagination").empty();

  const startPage = Math.max(1, currentPage - Math.floor(numPageButtons / 2));
  const endPage = Math.min(
    numPages,
    currentPage + Math.floor(numPageButtons / 2)
  );
  for (let i = startPage; i <= endPage; i++) {
    var active = "";
    if (i == currentPage) active = "active";
    if (active === "active") {
      $("#pagination").append(`
      <button class="btn btn-primary page ml-1 numberedButtons ${active}" value="${i}">${i}</button>
      `);
      continue;
    }
    $("#pagination").append(`
    <button class="btn btn-secondary page ml-1 numberedButtons ${active}" value="${i}">${i}</button>
    `);
  }
};

const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
  const selected_pokemons = pokemons.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  $("#pokeCards").empty();

  // An array of promises that will be resolved with the data for each selected pokemon.
  const pokemonPromises = selected_pokemons.map((pokemon) =>
    axios.get(pokemon.url)
  );

  /* 
  Wait for all promises to be resolved with the data for each pokemon.
  This is to prevent pokemon cards from being displayed randomly when
  the page is refreshed.
  */
  const pokemonData = await Promise.all(pokemonPromises);
  pokemonData.forEach((res) => {
    $("#pokeCards").append(`
      <div class="pokeCard card" pokeName=${res.data.name}   >
        <h3>${res.data.name.toUpperCase()}</h3> 
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
      </div>  
    `);
  });
};

const setup = async () => {
  $("#pokeCards").empty();
  let response = await axios.get(
    "https://pokeapi.co/api/v2/pokemon?offset=0&limit=810"
  );
  pokemons = response.data.results;

  paginate(currentPage, PAGE_SIZE, pokemons);
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);

  $("body").on("click", ".pokeCard", async function (e) {
    const pokemonName = $(this).attr("pokeName");
    const res = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
    );
    const types = res.data.types.map((type) => type.type.name);
    $(".modal-body").html(`
        <div style="width:200px">
        <img src="${
          res.data.sprites.other["official-artwork"].front_default
        }" alt="${res.data.name}"/>
        <div>
        <h3>Abilities</h3>
        <ul>
        ${res.data.abilities
          .map((ability) => `<li>${ability.ability.name}</li>`)
          .join("")}
        </ul>
        </div>

        <div>
        <h3>Stats</h3>
        <ul>
        ${res.data.stats
          .map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`)
          .join("")}
        </ul>

        </div>

        </div>
          <h3>Types</h3>
          <ul>
          ${types.map((type) => `<li>${type}</li>`).join("")}
          </ul>
      
        `);
    $(".modal-title").html(`
        <h2>${res.data.name.toUpperCase()}</h2>
        <h5>${res.data.id}</h5>
        `);
  });

  $("body").on("click", ".numberedButtons", async function (e) {
    currentPage = Number(e.target.value);
    paginate(currentPage, PAGE_SIZE, pokemons);

    updatePaginationDiv(currentPage, numPages);
  });
};

$(document).ready(setup);
