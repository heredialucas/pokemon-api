const { Router } = require("express");
const router = Router();
const axios = require("axios");
const { Type } = require("../db");

router.get("/", async (req, res, next) => {
  try {
    let getTypesApi = await axios.get("https://pokeapi.co/api/v2/type");
    let typesApi = getTypesApi.data.results;
    let namesTypesApi = typesApi.map((e) => e.name);

    namesTypesApi.forEach(async (e) => {
      await Type.create({
        name: e,
      });
    });

    res.json(namesTypesApi);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
