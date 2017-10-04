const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));
 
app.get('/', function (req, res) {
  res.sendFile('index.html', {root: './public'});
});
 
app.listen(port, function () {
  console.log(`Crops in Silico Prototype UI started on port ${port}`)
});
