const express = require('express');
const path = require('path');
const app = express();

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'build')));

// すべてのルートに対してindex.htmlを返す
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
});