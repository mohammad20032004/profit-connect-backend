const express = require('express');
const router = express.Router();

const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  submitProposal,
  getProposalsByProject,
  getMyProposals,
  acceptProposal,
  completeProject,
} = require('../controllers/projectController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .post(createProject)
  .get(getProjects);

router.get('/my-proposals', getMyProposals);

router.route('/:id')
  .get(getProjectById)
  .put(updateProject)
  .delete(deleteProject);

router.post('/:id/proposals', submitProposal);
router.get('/:id/proposals', getProposalsByProject);
router.post('/:id/proposals/:proposalId/accept', acceptProposal);
router.patch('/:id/complete', completeProject);

module.exports = router;
