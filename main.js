
const { shell, app, BrowserWindow, ipcMain } = require('electron');
const http = require('http');
let firstLoad = true;
const { google } = require('googleapis');
const crypto = require('crypto');
const path = require('path');
const url = require('url');
const fs = require('fs');
const algorithm = 'aes-256-cbc'; // Algoritmo de cifrado AES




// Ruta segura compatible con desarrollo y producción
const envPath = path.join(app.getAppPath(), '.env');

if (fs.existsSync(envPath)) {//esto es para cargar todas las pass del env
  require('dotenv').config({ path: envPath });
} else {
  console.warn('⚠️ No se encontró el archivo .env en:', envPath);
}


const { SecretKey_env, spreadsheetId_env, clientId_env, clientSecret_env } = process.env;

const secretKey = Buffer.from(SecretKey_env, 'hex'); // Clave secreta (debe ser de 32 bytes para AES-256)
const iv = crypto.randomBytes(16); // Vector de inicialización

let oauth2Client = null;

let sheets = null;
//let spreadsheetId = "1UFbU9lV9sLO-qVmBjQIGTTIBnZKYm6oLzDW3vQGh7mQ"; //pruebas
let spreadsheetId = spreadsheetId_env;

//let hojaTrabajo = "test";//pruebas
let hojaTrabajo = "JEISSON";

////////////variables



let mainWindow;
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  mainWindow.webContents.once('did-finish-load', async () => {
    try {
      const result = await autoUpdater.checkForUpdatesAndNotify();
      if (result) {
        console.log('Actualización disponible:', result.updateInfo);
        mainWindow.webContents.send('enviar', '¡Actualización disponible!');
      } else {
        console.log('No hay actualizaciones disponibles.');
        mainWindow.webContents.send('enviar', 'Sin actualizaciones');
      }
    } catch (err) {
      console.error('Error al buscar actualizaciones:', err);
      mainWindow.webContents.send('enviar', 'Error al buscar actualizaciones: '+ err);
    }
    
  });
});

// (Opcional) Agrega listeners para feedback
    autoUpdater.on('update-available', () => {
      console.log('Actualización disponible. Descargando...');
    });

    autoUpdater.on('update-downloaded', () => {
      console.log('Actualización descargada. Instalando...');
      autoUpdater.quitAndInstall();
    });
 




function createWindow() {
    mainWindow = new BrowserWindow({
        width: 380,
        height: 450,
        frame:false,
        alwaysOnTop: true,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: `${__dirname}/preload.js`
        }
    });


    mainWindow.loadFile('vistas/index.html');
    mainWindow.on('closed', function () {
        mainWindow = null;
    });

}
ipcMain.handle('cambiar-tamano-ventana', (event, size) => {
  mainWindow.webContents.send('enviar', 'cambiando ventana');
  //console.log('Recibido evento para cambiar tamaño de ventana:', size);
  if(size.set){
      mainWindow.setSize(size.anc, size.alt);
  }else{
      mainWindow.setSize(380, 35);
  }
  
});

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});




ipcMain.handle('update-document', async (event, values, rowIndex) => {
   console.log(values, rowIndex);

    try {
      const range = await obtenerRangoPorId(spreadsheetId, values[1]); // Rango de la fila a actualizar
    
      // Actualizar los valores de la fila
      /*const updateResponse = await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: 'USER_ENTERED', // Tipo de entrada de valores
          resource: { values: [values] } // Nuevos valores para la fila
      });*/
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        resource: {
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: `${hojaTrabajo}!A${range}`,
              values: [[values[0]]]
            },
            {
              range: `${hojaTrabajo}!O${range}:R${range}`,
              values: [values.slice(14,18)]
            }
          ]
        }
      });


      console.log('Fila actualizada');
      //return updateResponse.data;
    } catch (err) {
        console.error('Error al actualizar la fila:', err);
        throw err;
    }
    
});







/////////////////todo esto ya funciona para arriba
ipcMain.on('login', async () => {//login con navegador externo
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets'
    ]
  });

  // Abrir la URL de autorización en el navegador del sistema
  shell.openExternal(authUrl);

  // Crear una ventana para el servidor local
  const serverWindow = new BrowserWindow({ show: false });

  // Crear un servidor local
  const server = http.createServer((req, res) => {
    const query = url.parse(req.url, true).query;
    const code = query.code;
    // Manejar el código de autorización
    if (code) {
      handleCallback(code);
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('<html><head><style>body { display: flex; justify-content: center; align-items: center; height: 100vh; }</style></head><body><div><h1>Authentication complete.</h1><p>You can close this window.</p></div></body></html>');
      setTimeout(() => {
        server.close();
      }, 3000);
    }
    // Enviar una respuesta
    
    
  });

  // Escuchar en un puerto específico
  const port = 59988; // Elige el puerto que desees
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });

  // Manejar la terminación de la aplicación
  app.on('before-quit', () => {
    server.close();
  });

  // Manejar la redirección en la URL de autorización
  const handleCallback = (url) => {
    //const code = new URL(url).searchParams.get('code');
    console.log(url);
    if (url) {
      oauth2Client.getToken(url, (err, tokens) => {
        if (err) {
          console.error('Error retrieving access token', err);
          return;
        }
        saveToken(tokens);
        oauth2Client.setCredentials(tokens);
        sheets = google.sheets({ version: 'v4', auth: oauth2Client });
        //sheets = google.drive({ version: 'v3', auth: oauth2Client });
        serverWindow.close(); // Cerrar la ventana del servidor local
        mainWindow.webContents.send('logged_in', tokens);
      });
    }
  };

  // Cargar una URL en la ventana del servidor local
  serverWindow.loadURL(`http://localhost:${port}/`);
});
function saveToken(tokens) {
    const tokenPath = path.join(app.getPath('userData'), 'token.json');
    const tokenData = JSON.stringify(tokens);
    const encryptedToken = encrypt(tokenData);
  
    try {
      fs.writeFileSync(tokenPath, JSON.stringify(encryptedToken));
      console.log('Token saved to', tokenPath);
    } catch (error) {
      console.error('Failed to save the token:', error);
    }
  }
  function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
  }
  
  function decrypt(encryptedToken) {
    let iv = Buffer.from(encryptedToken.iv, 'hex');
    let encryptedText = Buffer.from(encryptedToken.encryptedData, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
async function refrescando() {
  return new Promise((resolve, reject) => {
    oauth2Client.refreshAccessToken((err, tokens) => {
      if (err) {
        console.error('Error refreshing access token', err);
        return reject(false);
      }
      oauth2Client.setCredentials(tokens);
      sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      saveToken(tokens);
      console.log('AccessToken was refreshed successfully');
      firstLoad = false;
      resolve(true);
    });
  });
}

  async function refreshAccessToken() {
    if (oauth2Client.credentials.expiry_date <= Date.now()) {
          const test = await refrescando();
          console.log(test);
          return test;
    }else{
      console.log('el token es aun valido y no necesita refrescarse');
      firstLoad= false;
      sheets = google.sheets({ version: 'v4', auth: oauth2Client });
      //sheets = google.drive({ version: 'v3', auth: oauth2Client });
      return true;
    }
    
  }
  
  async function loadToken() {
    
    const tokenPath = path.join(app.getPath('userData'), 'token.json');
    //console.log(app.getPath('userData'));
    oauth2Client = new google.auth.OAuth2(
      clientId_env,
      clientSecret_env,
      'http://localhost:59988'
    );
      try {
        const encryptedTokenData = fs.readFileSync(tokenPath, 'utf8');
        const encryptedToken = JSON.parse(encryptedTokenData);
        const decryptedToken = decrypt(encryptedToken);
        const tokens = JSON.parse(decryptedToken);

        oauth2Client.setCredentials(tokens);
        console.log('Token loaded and decrypted:');
        //console.log(oauth2Client);
        return await refreshAccessToken();
        //return true;
      } catch (error) {
        console.error('archivo no creado o corrupto');
        return false;
      }
  }
  
  ipcMain.handle("iniciar", async (event, query) => {
    if(!firstLoad) return true;
    try {
      const result =  loadToken();
      return result;
    } catch (error) {
      throw new Error('Failed to fetch data');
    }
  });//hasta aqui finaliza todo el proceso de login e inicio

//ESTE LEE  la hoja inicial y si no crea un libro
 /* ipcMain.handle("libro", async () => {
    let datos = [];
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and name='test' and trashed=false",
      fields: 'files(id, name)'
    });
  
    const files = response.data.files;
    if (files.length) {

                const file = files[0];
                try {
                  // ID de la hoja de Google Sheets
                   spreadsheetId = file.id;
          
                  // Nombre del rango de la hoja que deseas leer
                  const range = 'test!A1:Z';
          
                  // Leer los valores de la hoja
                  const res =  await sheets.spreadsheets.values.get({
                        spreadsheetId,
                        range,
                    });
                
          
                  const rows = res.data.values;
                  const valoresAFiltrar = new Set(['resuelto', 'escalamiento', 'no efectivo']);
                  datos = rows.filter(row => !valoresAFiltrar.has(row[13]));
              } catch (err) {
                  console.error('Error al leer la hoja:', err);
                  return [];
              }

        } 
        else {
          console.log('No files found. Creating a new one...');
      
          // Crear un nuevo archivo de hoja de cálculo
          const newFile = await drive.files.create({
            requestBody: {
              name: 'test', // Nombre del archivo
              mimeType: 'application/vnd.google-apps.spreadsheet' // Tipo de archivo
            },
            fields: 'id' // Solo necesitamos el ID del nuevo archivo
          });
          spreadsheetId = newFile.data.id;
          console.log(`New file created with ID: ${newFile.data.id}`);
        }
    return datos;
  });//este buscaba un libro por nombre sino lo creaba pero creo que es mas practico simplement buscarlo por id */

ipcMain.handle("libro", async () => {

  try {
      // Realizar una llamada a la API para obtener los datos del otro libro
      const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${hojaTrabajo}!A1:Z100` // Rango completo que contiene los IDs en la columna B
      });

     
      const data = response.data.values;
      const valoresAFiltrar = new Set(['Resuelto', 'Escalado', 'Contacto No Efectivo', 'Nivel 0', 'Llamada tipo comercial']);
      const datos = data.filter(row => !valoresAFiltrar.has(row[14]));
      return datos;

  
  } catch (error) {
      console.error('Parece que el libro cambio de id:', error);
      return [];
  }
});


  


  /////////////////////




async function actualizarOtroLibro(id, valores) {
    try {

        // Definir el ID del otro libro
        const otroSpreadsheetId = '';

        // Obtener el rango del otro libro utilizando el ID proporcionado
        const otroRange = await obtenerRangoPorId( otroSpreadsheetId, id);

        // Verificar si se encontró un rango en el otro libro
        if (otroRange) {
            // Actualizar los valores en el otro libro
            const otroUpdateResponse = await sheets.spreadsheets.values.update({
                spreadsheetId: otroSpreadsheetId,
                range: otroRange,
                valueInputOption: 'USER_ENTERED', // Tipo de entrada de valores
                resource: { values: [valores] } // Nuevos valores para la fila
            });

            console.log('Valores actualizados en el otro libro:', otroUpdateResponse.data);
        } else {
            console.log('No se encontró un rango en el otro libro para el ID proporcionado:', id);
        }
    } catch (error) {
        console.error('Error al actualizar el otro libro:', error);
        throw error;
    }
}

async function obtenerRangoPorId( spreadsheetId, id, hoja = hojaTrabajo) {
    try {
        // Realizar una llamada a la API para obtener los datos del otro libro
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${hoja}!B:B` // Rango completo que contiene los IDs en la columna B
        });

        // Buscar el ID en los datos obtenidos
        const data = response.data.values;
        const rowWithId = data.findIndex(row => row[0] === id);

        // Si se encuentra el ID, devolver el rango de la fila correspondiente
        if (rowWithId !== -1) {
            const rowIndex = rowWithId + 1; // Sumar 1 porque los índices comienzan en 0
            return rowIndex;
        } else {
            console.log('No se encontro el ID en el otro libro: '+ id);
            return null;
        }
    } catch (error) {
        console.error('Error al obtener el rango en el otro libro:', error);
        throw error;
    }
}
