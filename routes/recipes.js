const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();
 
//const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;


const BASE_URL = "https://api.spoonacular.com";

 
router.get("/random", async (req, res) => {
  try {
    const { number } = req.query; 
    const response = await axios.get(`${BASE_URL}/recipes/random`, {
      params: {
        apiKey: SPOONACULAR_API_KEY,
        number: number || 5, 
        includeNutrition: true,

        'exclude-tags': 'snack',
      },
    });

    const recipes = response.data.recipes.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      ingredients: recipe.extendedIngredients.map((ing) => ({name:ing.name,amount:ing.amount,unit:ing.unit})),
      link: recipe.sourceUrl,
      image: recipe.image,
      servings: recipe.servings,
      readyInMinutes: recipe.readyInMinutes,
      calories: recipe.nutrition.nutrients[0].amount,
      fat: recipe.nutrition.nutrients[1].amount,
      carbs: recipe.nutrition.nutrients[3].amount,
      protein: recipe.nutrition.nutrients[11].amount,
      instructions: recipe.analyzedInstructions[0].steps.map((instruction)=>({instructionNum: instruction.number,step:instruction.step})) || "",
    }));

    res.json(recipes); 
  } catch (error) {
    console.error("Error fetching random recipes",error);
    res.status(500).json({ error: "Failed to fetch random recipes",});
  }
});


router.get("/search", async (req, res) => {
  
  try {
    const { query, diet, number,minCalorie,minCarbs,minProtein,includeIngredients} = req.query; 
    const response = await axios.get(`${BASE_URL}/recipes/complexSearch`, {
      params: {
        apiKey: SPOONACULAR_API_KEY,
        addRecipeInformation	: true,
        addRecipeNutrition: true,
        fillIngredients: true,
        instructionsRequired: true,
        query,
        diet,
        includeIngredients,
        minProtein,
        minCalorie,
        minCarbs,
        number: number || 5,
      },
    });

    
    const recipes = response.data.results.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      ingredients: recipe.extendedIngredients.map((ing) => ({name:ing.name,amount:ing.amount,unit:ing.unit})),
      //ingredients: recipe.nutrition.ingredients?.map((ing) => ({name:ing.name,amount:ing.amount,unit:ing.unit})),
      link: recipe.sourceUrl,
      image: recipe.image,
      calories: recipe.nutrition.nutrients[0].amount,
      fat: recipe.nutrition.nutrients[1].amount,
      carbs: recipe.nutrition.nutrients[3].amount,
      protein: recipe.nutrition.nutrients[11].amount,
      servings: recipe.servings,
      readyInMinutes: recipe.readyInMinutes,
      instructions: recipe.analyzedInstructions[0].steps.map((instruction)=>({instructionNum: instruction.number,step:instruction.step})),
    }));

    res.json(recipes);
  } catch (error) {
    console.error("Error searching recipes");
    res.status(500).json({ error: "Failed to search recipes" });
  }
});




router.get("/findByNutrients", async(req,res) =>{
  try{
    const {number,minProtein,minCalories,minCarbs} = req.query;
    const noIdResponse = await axios.get(`${BASE_URL}/recipes/findByNutrients`,{
      params:{
        apiKey: SPOONACULAR_API_KEY,
        number,
        minCalories,
        minProtein,
        minCarbs,
        random:true,
      },
    });
    let listIds = '';
        noIdResponse.data.map((recipe)=>{
            listIds = listIds + ','+ recipe.id;
        })

    const response = await axios.get(`${BASE_URL}/recipes/informationBulk`,{
      params:{
        apiKey: SPOONACULAR_API_KEY,
        ids: listIds,
        includeNutrition: true,
  
      },
    })
  
      const recipes = response.data.map((recipe)=>(
        {
          id: recipe.id,
          title: recipe.title,
          ingredients: recipe.extendedIngredients.map((ing) => ({name:ing.name,amount:ing.amount,unit:ing.unit})),
          link: recipe.sourceUrl,
          image: recipe.image,
          calories: recipe.nutrition.nutrients[0].amount,
          fat: recipe.nutrition.nutrients[1].amount,
          carbs: recipe.nutrition.nutrients[3].amount,
          protein: recipe.nutrition.nutrients[11].amount,
          instructions: recipe.analyzedInstructions[0].steps.map((instruction)=>({instructionNum: instruction.number,step:instruction.step})),
          servings: recipe.servings,
          readyInMinutes: recipe.readyInMinutes,
        }
    ))
  
    res.json(recipes)  
    //res.json(response.data)

  } catch(error){
    console.log("Error finding recipes using Nutrients")
    res.status(500).json({error: "Couldnt find the recipes using nutrients."})
    
  }
});



 router.get("/informationBulk" ,async(req,res) =>{
  try {
  const {listIds} = req.query;
  const response = await axios.get(`${BASE_URL}/recipes/informationBulk`,{
    params:{
      apiKey: SPOONACULAR_API_KEY,
      ids: listIds,
      includeNutrition: true,

    },
  })

    const recipes = response.data.map((recipe)=>(
      {
        id: recipe.id,
        title: recipe.title,
        ingredients: recipe.extendedIngredients.map((ing) => ({name:ing.name,amount:ing.amount,unit:ing.unit})),
        link: recipe.sourceUrl,
        image: recipe.image,
        calories: recipe.nutrition.nutrients[0].amount,
        fat: recipe.nutrition.nutrients[1].amount,
        carbs: recipe.nutrition.nutrients[3].amount,
        protein: recipe.nutrition.nutrients[11].amount,
        instructions: recipe.analyzedInstructions[0].steps.map((instruction)=>({instructionNum: instruction.number,step:instruction.step})),
        servings: recipe.servings,
        readyInMinutes: recipe.readyInMinutes,
      }
  ))


  
  res.json(recipes)  
  } catch (error) {
    console.log("Error at info bulk");
    res.status(500).json({error:"Ran into a error at inofmration Bulk"})
    
  }

});






router.get("/:id", async (req, res) => {
  try {
    
    const { id } = req.params;
    const response = await axios.get(`${BASE_URL}/recipes/${id}/information`, {
      params: {
        apiKey: SPOONACULAR_API_KEY,
        includeNutrition: true,
      },
    });

    

    res.json({
      id: response.data.id,
      title: response.data.title,
      ingredients: response.data.extendedIngredients.map((ing) => ({name:ing.name,amount:ing.amount,unit:ing.unit})),
      link: response.data.sourceUrl,
      image: response.data.image,
      calories: response.data.nutrition.nutrients[0].amount,
      fat: response.data.nutrition.nutrients[1].amount,
      carbs: response.data.nutrition.nutrients[3].amount,
      protein: response.data.nutrition.nutrients[11].amount,
      instructions: recipe.analyzedInstructions[0].steps.map((instruction)=>({instructionNum: instruction.number,step:instruction.step})),
      servings: recipe.servings,
      readyInMinutes: recipe.readyInMinutes,
    }); 

  } catch (error) {
    console.error("Error fetching recipe details:",);
    res.status(500).json({ error: "Failed to fetch recipe details" });
  }
});






module.exports = router;
