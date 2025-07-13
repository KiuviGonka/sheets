const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'electronAPI', {
        createDocument: (document) => ipcRenderer.invoke('create-document', document),
        getDocuments: () => ipcRenderer.invoke('get-documents'),
        updateDocument: (/* id, content, order */values, index) => ipcRenderer.invoke('update-document', values, index/* { id, content, order } */),
        deleteDocument: (id) => ipcRenderer.invoke('delete-document', id),
        setDb:(name)=> ipcRenderer.invoke('setDb', name),
        cambioTama:(size)=> ipcRenderer.invoke('cambiar-tamano-ventana', size),

        sendLogin: () => ipcRenderer.send('login'), // Envia un mensaje para iniciar el proceso de login
        onLoggedIn: (callback) => ipcRenderer.on('logged_in', callback),
        iniciar: ()=> ipcRenderer.invoke('iniciar'),
        libro: ()=> ipcRenderer.invoke('libro'),
        mensaje: (callback) => ipcRenderer.on('enviar', callback)
    }
);
