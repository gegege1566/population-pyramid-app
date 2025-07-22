module.exports = function(app) {
  // WebSocketのタイムアウトを延長
  app.use((req, res, next) => {
    res.set({
      'Keep-Alive': 'timeout=120'
    });
    next();
  });
};