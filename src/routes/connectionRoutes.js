const express = require('express');
const router = express.Router();
const { 
    sendRequest, 
    acceptRequest, 
    getPendingRequests, 
    getMyConnections,
    rejectRequest,    // 👈 استدعاء دالة الرفض
  removeConnection  // 👈 استدعاء دالة الحذف

 }
    = require('../controllers/connectionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // حماية جميع المسارات
router.get('/connections', getMyConnections);
router.post('/connect/:userId', sendRequest);
router.put('/accept/:requestId', acceptRequest);
router.get('/requests', getPendingRequests);
router.put('/reject/:requestId', rejectRequest);
router.delete('/remove/:userId', removeConnection); 
module.exports = router;