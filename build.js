// build.js
require('dotenv').config(); // Esto carga el archivo .env

const builder = require('electron-builder');

builder.build({
  publish: 'always'
}).then(() => {
  console.log('Build y publicación completadas.');
}).catch((error) => {
  console.error('Error durante build/publicación:', error);
});

