const express = require("express");
const axios = require("axios");
const router = express.Router();
const { OpenAI } = require('openai');
const { z } = require("zod"); // Import Zod
require("dotenv").config();
 
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const DietPlanSchema = z.object({
  messageToUser: z.string(),
  minCalorie: z.number().int().positive(),
  minProtein: z.number().int().positive(),
  minCarb: z.number().int().positive(),
  notincludedIng: z.array(z.string()),
  validres: z.number().int().positive(),
});

router.post("/chat", async (req, res) => {
  try {
    const userGoal = req.body.message; // Example: "I want to gain muscle"

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an AI dietitian that provides structured diet recommendations." },
        { role: "user", content: userGoal }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "generate_diet_plan",
            description: "Create a structured diet plan based on the user's goal",
            parameters: {
              type: "object",
              properties: {
                messageToUser: { type: "string", description: "A brief message explaining the diet plan." },
                minCalorie: { type: "integer", description: "Minimum daily calorie intake per serving(assume 3 meals a day, 2 servings per meal)." },
                minProtein: { type: "integer", description: "Minimum daily protein intake in grams per serving(assume 3 meals a day, 2 servings per meal)." },
                minCarb: { type: "integer", description: "Minimum daily carbohydrate intake in grams per per serving(assume 3 meals a day, 2 servings per meal)." },
                notincludedIng: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of ingredients to avoid, try to be specific"
                },
                validres:{type:'integer', description: "if a valid resoponse is proved respon with 1 other wise 0"},
              },
              required: ["messageToUser", "minCalorie", "minProtein", "minCarb", "notincludedIng","validres"]
            }
          }
        }
      ],
      tool_choice: "auto"
    });

    // Extract and validate AI response
    
    if(response.choices[0].message.tool_calls){
      console.log("diet ai query was detected")
      const toolCalls = response.choices[0].message.tool_calls; // ethier message.tool_calls or message.content
      const dietPlan = JSON.parse(toolCalls[0].function.arguments);
      const parsedDietPlan = DietPlanSchema.parse(dietPlan);
      //console.log(parsedDietPlan)
      res.json([parsedDietPlan,0]);
    }else{
      console.log("Non diet ai query detected(probably)")
      res.json([response.choices[0].message.content,1])
    }

  } catch (error) {
    console.error("Error at diet Ai:",);
    if (!res.headersSent) {
      res.status(500).json({ error: "Something went wrong" });
    }
  }
})









const groceryItemSchema = z.object({
  name: z.string(),
  quantity: z.number().positive(),
  units: z.string(),
});

const groceryListSchema = z.array(groceryItemSchema);

router.post("/grocery", async (req, res) => {
  try {
    // Validate input
    const validation = groceryListSchema.safeParse(req.body.groceryList);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid grocery list format." });
    }

    const groceryList = req.body.groceryList;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a grocery list optimizer. Aggregate similar ingredients and convert units into store-friendly amounts."
        },
        {
          role: "user",
          content: `
            If multiple quantities exist for the same ingredient, sum them up and round to logical store units.
            
            Example:
            Input: 
            - 2 liters of milk
            - half a glass of milk
            - 350g of rice
            - 3.8 tbsp of olive oil
    
            Output:
            {
              { "Milk": {"quantity": "2 cartons"}},
              { "Rice": {"quantity": "1 bag (~500g)"}},
              {"Olive Oil": {"quantity": "1 small bottle (500ml)"}}
            ]
    
            Process this list:
            ${groceryList.map((item) => `${item.quantity} ${item.units} of ${item.name}`).join("\n")}
    
            Return the output strictly in JSON format.
          `
        }
      ],
      temperature: 0.7,
    });
    
    // The response structure is different for chat completions
    const condensedList = JSON.parse(response.choices[0].message.content.trim());

    res.json({ condensedList });
  } catch (error) {
    console.log("Failed to condense grocery List",);
    res.status(500).json({ error: "Failed to condense grocery list." });
  }
});



























module.exports = router;
