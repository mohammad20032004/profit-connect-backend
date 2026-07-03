const { translateContent } = require('../services/aiEvaluationService');

exports.translate = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'النص المطلوب ترجمته مطلوب' });
    }

    const translated = await translateContent(text);

    res.status(200).json({
      success: true,
      data: {
        original: text,
        translated,
      },
    });
  } catch (error) {
    console.error('Translate Error:', error.message);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء الترجمة' });
  }
};
