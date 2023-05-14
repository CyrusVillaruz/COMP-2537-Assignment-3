const PAGE_SIZE = 10;
let currentPage = 1;
let pokemons = [];
let pokemonTypes = ["normal", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost", "steel", "fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark", "fairy"];
let numPageButtons = 5;
let displayedPokemons = [];

const getPokeTypes = () => {
  const typeFilters = document.getElementsByClassName("typeFilter");
  const selectedTypes = Array.from(typeFilters)
    .filter((typeFilter) => typeFilter.checked)
    .map((typeFilter) => typeFilter.value);
  return selectedTypes;
};

const filterPokemonTypes = async (pokemons, selectedTypes) => {
  if (selectedTypes.length === 0) return pokemons;

  const pokeArray = pokemons.map((pokemon) => pokemon.name);
  const pokeAPIReq = pokeArray.map((pokeName) => axios.get(`https://pokeapi.co/api/v2/pokemon/${pokeName}`));

  try {
    const pokeResponses = await Promise.all(pokeAPIReq);
    const pokeInfo = pokeResponses.map((res) => ({
      name: res.data.name,
      types: res.data.types.map((type) => type.type.name),
      url: res.config.url
    }));

    const filteredPokeInfo = pokeInfo.filter((poke) =>
      selectedTypes.every((type) => poke.types.includes(type))
    );
    return filteredPokeInfo;
  } catch (error) {
    console.error(error);
  }
}

const updateFilteredPokemon = async () => {
  const selectedTypes = getPokeTypes();
  const filteredPokemon = await filterPokemonTypes(pokemons, selectedTypes);
  const numPages = Math.ceil(filteredPokemon.length / PAGE_SIZE);

  displayedPokemons = filteredPokemon;
    
  paginate(currentPage, PAGE_SIZE, displayedPokemons);
  updatePaginationDiv(currentPage, numPages);
  displayNumberOfPokemon(pokemons, currentPage);
}

const displayNumberOfPokemon = (pokelist, currentPage) => {
  let totalNumberOfPokemon = pokelist.length;
  let numOfPages = Math.ceil(totalNumberOfPokemon / PAGE_SIZE);
  let displayedPokemon = 0;
  let pageSize = 0;

  if (totalNumberOfPokemon === 0) {
    displayedPokemon = 0;
    $("#pokeCardsHeader").html(`<h1>Displaying ${displayedPokemon} of ${totalNumberOfPokemon} Pokemon</h1>`);
    return;
  }

  if (currentPage != numOfPages) {
    pageSize = PAGE_SIZE;
    displayedPokemon = pageSize;
  } else if (currentPage == numOfPages) {
    pageSize = totalNumberOfPokemon % PAGE_SIZE;
    displayedPokemon = pageSize;
  }
  
  $("#pokeCardsHeader").html(`<h1>Displaying ${displayedPokemon} of ${totalNumberOfPokemon} Pokemon</h1>`);
};

const updatePaginationDiv = (currentPage, numPages) => {
  $("#pagination").empty();

  const startPage = Math.max(1, currentPage - Math.floor(numPageButtons / 2));
  const endPage = Math.min(
    numPages,
    currentPage + Math.floor(numPageButtons / 2)
  );

  if (currentPage > 1) {
    $("#pagination").append(`
    <button class="btn btn-info page ml-1 prev pageBtn" value="${currentPage - 1}">Previous</button>
    `);
  }

  for (let i = startPage; i <= endPage; i++) {
    var active = "";
    if (i == currentPage) active = "active";
    if (active === "active") {
      $("#pagination").append(`
      <button class="btn btn-info page ml-1 numberedButtons ${active}" value="${i}">${i}</button>
      `);
      continue;
    }
    $("#pagination").append(`
    <button class="btn btn-secondary page ml-1 numberedButtons ${active}" value="${i}">${i}</button>
    `);
  }

  if (currentPage < numPages) {
    $("#pagination").append(`
    <button id="next" class="btn btn-info page ml-1 next pageBtn" value="1">Next</button>
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
      <div class="pokeCard card" pokeName=${res.data.name}>
        <h3>${res.data.name.toUpperCase()}</h3> 
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-info" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
      </div>  
    `);
  });

  displayNumberOfPokemon(pokemons, currentPage);
};

const setup = async () => {
  $("body").on("change", ".typeFilter", updateFilteredPokemon);

  $("#pokeCards").empty();
  let response = await axios.get(
    "https://pokeapi.co/api/v2/pokemon?offset=0&limit=810"
  );
  pokemons = response.data.results;
  displayedPokemons = pokemons;

  paginate(currentPage, PAGE_SIZE, displayedPokemons);
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);
  displayNumberOfPokemon(pokemons, currentPage);

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
    handlePagination();
  });

  $("body").on("click", ".prev", async function (e) {
    currentPage--;
    handlePagination();
  });
  
  $("body").on("click", "#next", async function (e) {
    currentPage++;
    handlePagination();
  });
  
  function handlePagination() {
    const numPages = Math.ceil(displayedPokemons.length / PAGE_SIZE);
    paginate(currentPage, PAGE_SIZE, displayedPokemons);
    updatePaginationDiv(currentPage, numPages);
    displayNumberOfPokemon(displayedPokemons, currentPage);
  }
};

$(document).ready(setup);
