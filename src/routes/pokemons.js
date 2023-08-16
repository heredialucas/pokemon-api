const { Router } = require("express");
const { Pokemon, Type } = require("../db");
const router = Router();
const axios = require("axios");

router.get("/", async (req, res, next) => {
  const { name } = req.query;
  try {
    if (name) {
      let getPokemonsDb = await Pokemon.findOne({
        where: {
          name: name,
        },
        attributes: { exclude: ["createdAt", "updatedAt"] },
        include: [{ model: Type, attributes: ["name"] }],
      });
      if (getPokemonsDb) {
        return res.status(200).json(getPokemonsDb);
      }

      let getPokemonsApi = await axios
        .get(`https://pokeapi.co/api/v2/pokemon/${name}`)
        .then((e) => {
          return {
            id: e.data.id,
            name: e.data.name,
            attack: e.data.stats[1]["base_stat"],
            image:
              e.data.sprites.versions["generation-v"]["black-white"].animated[
                "front_default"
              ],
            types: e.data.types.map((e) => {
              return e.type.name;
            }),
          };
        });
      if (getPokemonsApi) {
        return res.status(200).json(getPokemonsApi);
      }
    } else {
      let getPokemonsDb = await Pokemon.findAll({
        attributes: { exclude: ["createdAt", "updatedAt"] },
        include: [{ model: Type, attributes: ["name"] }],
      });

      var getPokemonsApi = [];

      for (let i = 1; i < 41; i++) {
        let pokemonsApi = await axios
          .get(`https://pokeapi.co/api/v2/pokemon/${i}`)
          .then((e) => {
            return {
              id: e.data.id,
              name: e.data.name,
              attack: e.data.stats[1]["base_stat"],
              image:
                e.data.sprites.versions["generation-v"]["black-white"].animated[
                  "front_default"
                ],
              types: e.data.types.map((e) => {
                return e.type.name;
              }),
            };
          });
        getPokemonsApi.push(pokemonsApi);
      }

      let pokemonsDb = getPokemonsDb.map((e) => e.toJSON());

      let typesArr = pokemonsDb[0]?.types.map((e) => {
        return e.name;
      });

      pokemonsDb.map((e) => {
        e.types = typesArr;
      });

      let allPokemons = [...getPokemonsApi, ...pokemonsDb];

      if (allPokemons) {
        res.status(200).json(allPokemons);
      }
    }
  } catch (error) {
    res.send("Error");
  }
});

router.get("/:id", async (req, res, next) => {
  const { id } = req.params;
  let getPokemonsApi;
  let getPokemonsDb;
  try {
    if (id.length > 6) {
      getPokemonsDb = await Pokemon.findByPk(id, {
        include: [{ model: Type, attributes: ["name"] }],
      });
      res.status(200).json(getPokemonsDb);
    } else {
      getPokemonsApi = await axios
        .get(`https://pokeapi.co/api/v2/pokemon/${id}`)
        .then((e) => {
          return {
            name: e.data.name,
            id: e.data.id,
            hp: e.data.stats[0]["base_stat"],
            attack: e.data.stats[1]["base_stat"],
            defense: e.data.stats[2]["base_stat"],
            speed: e.data.stats[5]["base_stat"],
            height: e.data.height,
            weight: e.data.weight,
            image:
              e.data.sprites.versions["generation-v"]["black-white"].animated[
                "front_default"
              ],
            types: e.data.types.map((e) => {
              return e.type.name;
            }),
          };
        });
      res.status(200).json(getPokemonsApi);
    }
  } catch (error) {
    res.json(error);
  }
});

router.post("/", async (req, res, next) => {
  const { name, hp, attack, defense, speed, height, weight, types, image } =
    req.body;
  try {
    const newPokemon = await Pokemon.create({
      name,
      hp,
      attack,
      defense,
      speed,
      height,
      weight,
      image:
        image ||
        "https://cdn.pixabay.com/photo/2016/08/15/00/50/pokeball-1594373_960_720.png",
    });

    types?.map(async (value) => {
      const [post, created] = await Type.findOrCreate({
        where: { name: value },
        defaults: { name: value },
      });
      newPokemon.addType(post);
    });
    res.status(201).send(newPokemon);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
