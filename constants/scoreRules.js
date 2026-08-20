// أنواع القيود: 
// ONCE: تمنح مرة واحدة فقط في عمر الحساب (مثل رفع الصورة)
// DAILY_LIMIT: لها حد أقصى من النقاط في اليوم الواحد (مثل كتابة المنشورات)
// UNLIMITED: بدون قيود (مثل الخصومات أو العقوبات)

const SCORE_RULES = {
  // ═══════════════════════════════════════════════════════════
  //  الملف الشخصي
  // ═══════════════════════════════════════════════════════════
  UPLOAD_AVATAR:          { points: 10, type: 'ONCE' },
  COMPLETE_PROFILE:       { points: 15, type: 'ONCE' },
  ADD_SKILL:              { points: 2, type: 'DAILY_LIMIT', maxDaily: 10 },
  ADD_HEADLINE:           { points: 5, type: 'ONCE' },
  ADD_BIO:                { points: 5, type: 'ONCE' },
  ADD_LOCATION:           { points: 3, type: 'ONCE' },
  ADD_PHONE:              { points: 3, type: 'ONCE' },
  ADD_LINKEDIN:           { points: 5, type: 'ONCE' },
  ADD_GITHUB:             { points: 5, type: 'ONCE' },
  ADD_WEBSITE:            { points: 3, type: 'ONCE' },
  ADD_INDUSTRY:           { points: 5, type: 'ONCE' },
  ADD_EXPERIENCE_YEARS:   { points: 5, type: 'ONCE' },
  BIO_QUALITY_SCORE:      { points: 0, type: 'ONCE' },
  HEADLINE_QUALITY_SCORE: { points: 0, type: 'ONCE' },
  SKILLS_QUALITY_SCORE:   { points: 0, type: 'ONCE' },

  // ═══════════════════════════════════════════════════════════
  //  المنشورات والتفاعل الاجتماعي
  // ═══════════════════════════════════════════════════════════
  CREATE_POST:            { points: 5, type: 'DAILY_LIMIT', maxDaily: 20 },
  RECEIVE_LIKE:           { points: 1, type: 'DAILY_LIMIT', maxDaily: 50 },
  ADD_COMMENT:            { points: 2, type: 'DAILY_LIMIT', maxDaily: 20 },
  RECEIVE_COMMENT:        { points: 1, type: 'DAILY_LIMIT', maxDaily: 30 },
  POST_SHARED:            { points: 2, type: 'DAILY_LIMIT', maxDaily: 10 },

  // ═══════════════════════════════════════════════════════════
  //  الشركات والمتابعة
  // ═══════════════════════════════════════════════════════════
  FOLLOW_COMPANY:         { points: 1, type: 'DAILY_LIMIT', maxDaily: 10 },
  RECEIVE_COMPANY_FOLLOW: { points: 2, type: 'DAILY_LIMIT', maxDaily: 20 },
  RATE_COMPANY:           { points: 3, type: 'DAILY_LIMIT', maxDaily: 15 },
  CREATE_COMPANY:         { points: 20, type: 'ONCE' },

  // ═══════════════════════════════════════════════════════════
  //  المعرض (Portfolio)
  // ═══════════════════════════════════════════════════════════
  ADD_PORTFOLIO_ITEM:         { points: 10, type: 'DAILY_LIMIT', maxDaily: 30 },
  RECEIVE_PORTFOLIO_LIKE:     { points: 1, type: 'DAILY_LIMIT', maxDaily: 50 },
  RECEIVE_PORTFOLIO_VIEW:     { points: 1, type: 'DAILY_LIMIT', maxDaily: 20 },
  PORTFOLIO_ITEM_FEATURED:    { points: 15, type: 'DAILY_LIMIT', maxDaily: 30 },
  CREATE_PORTFOLIO_COLLECTION:{ points: 5, type: 'DAILY_LIMIT', maxDaily: 10 },

  // ═══════════════════════════════════════════════════════════
  //  الوظائف
  // ═══════════════════════════════════════════════════════════
  APPLY_FOR_JOB:              { points: 5, type: 'DAILY_LIMIT', maxDaily: 25 },
  APPLICATION_ACCEPTED:       { points: 20, type: 'UNLIMITED' },
  APPLICATION_REJECTED:       { points: -2, type: 'UNLIMITED' },
  APPLICATION_SHORTLISTED:    { points: 10, type: 'UNLIMITED' },
  POST_JOB:                   { points: 5, type: 'DAILY_LIMIT', maxDaily: 15 },
  RECEIVE_JOB_APPLICATION:    { points: 2, type: 'DAILY_LIMIT', maxDaily: 20 },

  // ═══════════════════════════════════════════════════════════
  //  المشاريع والعقود
  // ═══════════════════════════════════════════════════════════
  SUBMIT_PROPOSAL:            { points: 5, type: 'DAILY_LIMIT', maxDaily: 25 },
  PROPOSAL_ACCEPTED:          { points: 25, type: 'UNLIMITED' },
  PROPOSAL_REJECTED:          { points: -2, type: 'UNLIMITED' },
  RECEIVE_PROPOSAL:           { points: 3, type: 'DAILY_LIMIT', maxDaily: 20 },
  POST_PROJECT:               { points: 10, type: 'DAILY_LIMIT', maxDaily: 20 },
  COMPLETE_PROJECT:           { points: 50, type: 'UNLIMITED' },
  COMPLETE_MILESTONE:         { points: 15, type: 'DAILY_LIMIT', maxDaily: 40 },
  PROJECT_REVIEW_RECEIVED:    { points: 5, type: 'DAILY_LIMIT', maxDaily: 15 },

  // ═══════════════════════════════════════════════════════════
  //  المحادثات والرسائل
  // ═══════════════════════════════════════════════════════════
  SEND_MESSAGE:               { points: 1, type: 'DAILY_LIMIT', maxDaily: 20 },
  RECEIVE_MESSAGE:            { points: 1, type: 'DAILY_LIMIT', maxDaily: 30 },

  // ═══════════════════════════════════════════════════════════
  //  الشبكة الاجتماعية
  // ═══════════════════════════════════════════════════════════
  SEND_CONNECTION_REQUEST:    { points: 2, type: 'DAILY_LIMIT', maxDaily: 10 },
  CONNECTION_ACCEPTED:        { points: 5, type: 'UNLIMITED' },
  RECEIVE_CONNECTION_REQUEST: { points: 2, type: 'DAILY_LIMIT', maxDaily: 10 },
  FOLLOW_USER:                { points: 1, type: 'DAILY_LIMIT', maxDaily: 15 },
  RECEIVE_USER_FOLLOW:        { points: 1, type: 'DAILY_LIMIT', maxDaily: 30 },
  PROFILE_VIEWED:             { points: 1, type: 'DAILY_LIMIT', maxDaily: 10 },

  // ═══════════════════════════════════════════════════════════
  //  المحفظة المالية
  // ═══════════════════════════════════════════════════════════
  DEPOSIT_MONEY:              { points: 5, type: 'DAILY_LIMIT', maxDaily: 15 },
  WITHDRAW_MONEY:             { points: 3, type: 'DAILY_LIMIT', maxDaily: 10 },
  RECEIVE_PAYMENT:            { points: 10, type: 'UNLIMITED' },

  // ═══════════════════════════════════════════════════════════
  //  العقوبات
  // ═══════════════════════════════════════════════════════════
  PENALTY_VIOLATION:          { points: -20, type: 'UNLIMITED' },
  PENALTY_BAD_CONTENT:        { points: -5, type: 'UNLIMITED' },
  PENALTY_SPAM:               { points: -10, type: 'UNLIMITED' },
  PENALTY_FAKE_PROFILE:       { points: -30, type: 'UNLIMITED' },
  PENALTY_POST_REPORTED:      { points: -3, type: 'UNLIMITED' },
};

module.exports = SCORE_RULES;