const { evaluateContent } = require('../src/services/aiEvaluationService');

async function runTest() {
  console.log("🚀 جاري اختبار الذكاء الاصطناعي المحلي...");

  const testContent = "شاركت اليوم في ورشة عمل احترافية حول ريادة الأعمال، وتعلمت كيف أبني نموذج عمل مربح من الصفر. الخطوات واضحة والفرص متاحة لمن يبحث عنها بجدية.";

  try {
    const score = await evaluateContent(testContent);
    console.log("---------------------------------------");
    console.log("✅ النتيجة النهائية من الذكاء الاصطناعي:");
    console.log("التقييم (Score):", score);
    console.log("---------------------------------------");
    
    if (score >= 1) {
      console.log("🎉 التحليل يعمل بنجاح!");
    } else {
      console.log("⚠️ النموذج أعاد تقييماً منخفضاً، تأكد من الـ Prompt.");
    }
  } catch (error) {
    console.error("❌ حدث خطأ أثناء الاختبار:", error.message);
  }
}

runTest();