const { GoogleGenerativeAI } = require('@google/generative-ai');

// مفتاحك (مؤقتاً للتجربة)
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

async function testConnection() {
  console.log("⏳ جاري الاتصال بخوادم Google Gemini...");
  
  try {
    // 🌟 التعديل تم هنا: استخدمنا gemini-pro أو gemini-1.5-flash-latest
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });    
    const prompt = "مرحباً! هل تسمعني؟ أجب بكلمة واحدة فقط: نعم.";
    const result = await model.generateContent(prompt);
    
    console.log("✅ الاتصال ناجح! المفتاح صالح ويعمل بكفاءة.");
    console.log("🤖 رد الذكاء الاصطناعي:", result.response.text());
    
  } catch (error) {
    console.error("❌ عذراً، هناك مشكلة في الاتصال:");
    console.error(error.message);
  }
}

testConnection();