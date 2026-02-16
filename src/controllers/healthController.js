exports.check = (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
};
