const setup = async () => {
  const res = await axios.get('https://pokeapi.co/api/v2/pokemon/1')
  console.log(res.data);
}