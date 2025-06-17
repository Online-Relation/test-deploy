import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
console.log("OPENAI_API_KEY is set:", Boolean(process.env.OPENAI_API_KEY));

export default openai;