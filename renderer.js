let size = {set: "true"};
let alto =450;
let ancho = 380;
let active = false;
const div = document.getElementById("login");
const div2 = document.getElementById("iniciando");
const slider = document.getElementById("slide");
const cuerpo = document.querySelector(".contenido");
const dropdown = document.querySelector(".static");
const prog = document.getElementById("programacion");

const timeouts = {}; // almacén de timeouts dinámicos

let slides = null;
let currentSlide = 0;
let htm='';
let datos=[];
let proximos=[];
let inmediatos=[];
let datoReal = 0;

var valoresValidos = ['Resuelto', 'Escalado', 'Contacto No Efectivo', 'Nivel 0', 'Llamada tipo comercial'];
var todosvaloresValidos = ['----','Agendado', 'Registro de Actividad', 'Resuelto', 'Escalado', 'Contacto No Efectivo', 'Nivel 0', 'Llamada tipo comercial'];


iniciar();
window.electronAPI.mensaje((event, mensaje) => {
    console.log('Mensaje recibido del main process:', mensaje);
});

async function iniciar(){
    

    const result = await window.electronAPI.iniciar();
    if(!result){
         htm =   `
            <div class="bar"></div>
            <div class="cont">
                <h3>Inicia session para guardar cambios</h3>
                <button id="login " onclick="login()" >Login to Google Drive</button>
            </div>
         `;  
         div.innerHTML=htm;      
    }else{
        if(div){
            libro();
         }   

         if(div){
            setTimeout(() => {
                div.classList.add("hidden");
                div2.classList.remove("hidden");
            }, 2000);
         }
         
    };   
}

async function login() {

    try {
        await window.electronAPI.sendLogin();
        
        console.log("no hay error");
        window.electronAPI.onLoggedIn((data, token) => {
            console.log('Received data from main process:', data,' token: ',token);
            div.innerHTML=`<h3>Iniciaste seccion correctamente</h3>`;
            setTimeout(() => {
                div.innerHTML='';
                location.reload();
            }, 2000);
        });
    } catch (error) {
        console.log(error);
    }
    
};

async function libro() {
    slider.innerHTML='';
    //proximos = [];
    //inmediatos = [];
    slides = null;

    try {
        if(true){//datos.length == 0
            datos = await window.electronAPI.libro();
            console.log("casos trabajables: "+datos.length);
            datos.shift();
        };
        
       //console.log('datos:', datos);
       
       datos.forEach((dato, index) => {
        const noteDiv = document.createElement('div');;
            if(dato[16]){
                selector(dato[16], dato[1]);
            };
            if (valoresValidos.includes(dato[14]))  return;
            noteDiv.classList.add('slide-content');
           /*  noteDiv.dataset.noteId = note._id; // Asegúrate de tener un atributo de identificador para cada nota
            noteDiv.dataset.order = index; */
            const com = dato[17] ? dato[17]:"";
            let display = "";
            let agenda = null;
            if( dato[14] == "Agendado"){
                display = "block";
                agenda = formatearParaDatetimeLocal(dato[16]);
            }else{
                display = "none";
            }
            
            let opcionesHTML = '';
            todosvaloresValidos.forEach(op => {
            opcionesHTML += `<option value="${op}">${op}</option>`;
            });
            noteDiv.innerHTML = `
            <ul>
            <li onclick = "dupla (event)">${dato[1]}</li>
            <li onclick = "dupla (event)">${dato[2]}</li>
            <li onclick = "dupla (event)">${dato[3]}</li>
            <li onclick = "dupla (event)">${dato[4]}</li>
            <li onclick = "dupla (event)">${dato[12]}</li>
            <li class= "motivo" onclick = "dupla (event)">${dato[6]}</li>
            </ul> 
            
            <input type="text" placeholder="Actualizar comentario.." value='${com}' name="comentario" id="${dato[1]}-c">

            <div id="fecha-hora-${dato[1]}" style="display: ${display}; margin-top: 10px; text-align: center;">
                <input 
                    value= "${agenda}"
                    type="datetime-local" 
                    name="fechaHora"
                    style="padding: 5px 15px; margin: 0 auto; display: inline-block; border-radius: 6px; border: 1px solid #ccc;" 
                />
            </div>

            <select name="tipologia" id="select-${dato[1]}" onchange="mostrarCampoFecha('${dato[1]}')">
                ${opcionesHTML}
            </select> 
            
            `;
            slider.appendChild(noteDiv);
            if(!dato[14]) return;
            const valorDeseado = dato[14];// aqui es para setear lo ultimo tipificado

            // Obtener el elemento select que acabas de agregar al DOM
            const selectElement = document.getElementById("select-"+dato[1]);

            // Iterar sobre las opciones del select
            for (let option of selectElement.options) {
                // Comparar el valor de la opción con el valor deseado
                if (option.value === valorDeseado) {
                    // Si coincide, seleccionar la opción
                    option.selected = true;
                    // Salir del bucle ya que ya se encontró la opción
                    break;
                }
            }
       });
       slides =  document.querySelectorAll('.slide-content');

       console.log('datos leng y currentsid', datos.length, currentSlide );
       datos.length <= currentSlide ? currentSlide-- : currentSlide;
       console.log('despues de eval', currentSlide );
       showSlide2(datos[currentSlide][1]);
       showProg();
        
    } catch (error) {
        console.log(error);
    }
    
};
function mostrarCampoFecha(id) {
  const select = document.getElementById(`select-${id}`);
  const campoFecha = document.getElementById(`fecha-hora-${id}`);
  
  if (select.value === "Agendado") {
    campoFecha.style.display = "block";
  } else {
    campoFecha.style.display = "none";
  }
}
function formatearParaDatetimeLocal(fechaISO) {
  const fecha = new Date(fechaISO);
  const offset = fecha.getTimezoneOffset();
  const localDate = new Date(fecha.getTime() - offset * 60000); // Ajuste a la zona horaria local
  return localDate.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
}


async function updateFila(){
    
    console.log('real: ', datoReal, 'current: ', currentSlide);
    const ahora = new Date();

    const hora = ahora.getHours();
    const minutos = ahora.getMinutes();
    const segundos = ahora.getSeconds();

    const horaActual = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

    //console.log('este es el array actual', datos);

    let fila = datos[datoReal];


    const selectElement = document.getElementById("select-"+fila[1]);
    const tipolo = selectElement.value;
    
    const com = document.getElementById(fila[1]+"-c");
    fila[14] = tipolo;
    fila[15] = fila[15] ? parseInt(fila[15]) +1: 1;
    
    fila[17] = com.value;

    if(tipolo =="Agendado"){
        const timeElement = document.querySelector(`#fecha-hora-${fila[1]} input`);
        const timeValor = timeElement ? timeElement.value : '';
        console.log(timeValor);
        fila[16] =  new Date(timeValor).toISOString();

    }else{
        fila[16] = ahora;// horaActual;
    }

    if(valoresValidos.includes(tipolo)){
        //datos.splice(currentSlide, 1);
        fila[0]= "";
        datos = datos.slice(0, datoReal).concat(datos.slice(datoReal + 1));
    }else{
        fila[0]= "marcando";
    };
    
    await window.electronAPI.updateDocument(fila, datoReal);
    resetMaster(fila[1]);

}
function resetMaster(dato){
    buscarEliminar(proximos, dato);
    buscarEliminar(inmediatos, dato);
        
    if(timeouts[`${dato}a`]){
        cancelarTimeout(`${dato}a`);
    }
    if(timeouts[`${dato}b`]){
        cancelarTimeout(`${dato}b`);
    }
    libro();
}

function showSlide(index) {
    datoReal = index;
    const act = document.getElementById("actual");
    const tt=(index+1)+" / "+datos.length;
    act.innerText=tt;
    slides.forEach((slide, i) => {
        if (i === index) {
        slide.style.display = 'block';
        } else {
        slide.style.display = 'none';
        }
    });

    console.log(proximos, inmediatos);
}
function showSlide2(index) {
    console.log(index);
    datoReal = datos.findIndex(dato =>dato[1] == index);

    if(datoReal == -1){
        resetMaster(index);
        return;
    }
    const act = document.getElementById("actual");
    const tt=(datoReal+1)+" / "+datos.length;
    act.innerText=tt;
    slides.forEach((slide, i) => {
        if (i === datoReal) {
        slide.style.display = 'block';
        } else {
        slide.style.display = 'none';
        }
    });

    console.log(proximos, inmediatos);
}

function showProg(){
    prog.innerHTML='';

    const ht = `
                <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-urgent" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="#ff2825" fill="none" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M8 16v-4a4 4 0 0 1 8 0v4" />
                    <path d="M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7" />
                    <path d="M6 16m0 1a1 1 0 0 1 1 -1h10a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z" />
                </svg>
             `;

    inmediatos.forEach(dato =>{
        const divv= document.createElement("div");
        divv.addEventListener("click", ()=>{
            showSlide2(dato); 
            currentSlide = 0 ? currentSlide: currentSlide--;
        });
        divv.classList.add("icono");
        divv.classList.add("max");
        divv.innerHTML=ht;

        prog.appendChild(divv);
    });


    const ht2 = `
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-alert-triangle" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="#00abfb" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 9v4" />
            <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
            <path d="M12 16h.01" />
            </svg>
             `;

    proximos.forEach(dato =>{
        const divv= document.createElement("div");
        divv.addEventListener("click", ()=>{
            showSlide2(dato); 
           currentSlide = 0 ? currentSlide: currentSlide--;
        });
        divv.classList.add("icono");
        divv.classList.add("min");
        divv.innerHTML=ht2;

        prog.appendChild(divv);
    });
    
}

document.querySelector('.prev').addEventListener('click', () => {
  currentSlide = (currentSlide === 0) ? slides.length - 1 : currentSlide - 1;
  showSlide(currentSlide);
});

document.querySelector('.next').addEventListener('click', () => {
  currentSlide = (currentSlide === slides.length - 1) ? 0 : currentSlide + 1;
  showSlide(currentSlide);
});
function dupla (event){
    copiar(event);
    glich();
}

function copiar(event) {
    //console.log(event); return;
    const parrafo = event.target;

    if (!navigator.clipboard) {
        console.log('Clipboard API no disponible');
        return;
    }

    navigator.clipboard.writeText(parrafo.textContent)
        .then(() => {
            console.log('Texto copiado al portapapeles!');
        })
        .catch(err => {
            console.error('Error al copiar texto: ', err);
        });
};

function glich(){

    size ={
        set:false,
        alt: alto, 
        anc: ancho
    }
    /* ipcRenderer.send('cambiar-tamano-ventana', size); */
    window.electronAPI.cambioTama(size);

};
window.addEventListener("resize", function(){
        
    if(size.set){
        alto = window.innerHeight > 150 ? window.innerHeight: 150;
        ancho = window.innerWidth > 240 ? window.innerWidth:240;
    }
});
document.getElementById('boton-cambiar-tamano').addEventListener('click', () => {
    size.set = !size.set;
    size ={
        set: size.set,
        alt: alto, 
        anc: ancho
    }
    window.electronAPI.cambioTama(size);
});


        
cuerpo.addEventListener("mouseleave", function(){
    if(!active){
        size ={
            set:false,
            alt: alto, 
            anc: ancho
        }
        window.electronAPI.cambioTama(size);
    }
    
})

dropdown.addEventListener('mouseenter', function() {
    if(!size.set){
        size.set = !size.set;
        size ={
            set: size.set,
            alt: alto, 
            anc: ancho
        }
        window.electronAPI.cambioTama(size);
   };
});


function selector(tiempo, index){
    // Obtener la hora actual
    
    const ahora = new Date();
    const guardada = new Date(tiempo);
    let tiempoTranscurrido = 0
    const minimo = 20, medio = 0.6, maximo = 30; //tiempos a evaluar

    let timerA = 0;
    let timerB = 0;
    
    if(ahora < guardada){
        tiempoTranscurrido = 0
        timerA = (guardada - ahora) - (10*60000);
        timerB = (guardada - ahora) ;
        console.log(`entro a menor que, timer a ${timerA} , timer b ${timerB}`);
    }else{
        tiempoTranscurrido = (ahora-guardada)/60000
        timerA = (minimo - tiempoTranscurrido)*60000;
        timerB = (maximo - tiempoTranscurrido)*60000;
    }
    const restante = ahora - guardada;
    console.log("restante "+ restante);


    /*const horaActual = ahora.getHours();
    const minutoActual = ahora.getMinutes();
    const totalAhora =(horaActual*60)+minutoActual;
    // Dato de tipo hora que quieres comparar
    const datoHora = tiempo;

    // Separar el dato de hora en horas, minutos y segundos
    const partesDato = datoHora.split(":");
    const horaDato = parseInt(partesDato[0]);
    const minutoDato = parseInt(partesDato[1]);
    const totalDato = (horaDato*60)+minutoDato;

    const tiempoTranscurrido = totalAhora - totalDato;
    const minimo = 20, medio = 0.6, maximo = 30; //tiempos a evaluar
    const timerA = (minimo - tiempoTranscurrido)*60000;
    const timerB = (maximo - tiempoTranscurrido)*60000;*/
    // Comparar la hora actual con el dato de hora
    switch (true) {
    case (tiempoTranscurrido < minimo):
        iniciarTimeout( index, timerA, showProg, "a");
        iniciarTimeout( index, timerB, showProg, "b");
        /*setTimeout(() => {
            proximos.push(index)
            showProg();
        }, ((20-tiempoTranscurrido)*60000));

        setTimeout(() => {
            inmediatos.push(index);
            let indice = proximos.indexOf(index);

            // Verificar si se encontró el valor
            if (indice !== -1) {
                proximos.splice(indice, 1);
                
            };
            showProg();
        }, ((40-tiempoTranscurrido)*60000));*/
        break;
    case (tiempoTranscurrido >= minimo && tiempoTranscurrido < maximo):
        buscarAgregar(proximos, index);
        //proximos.push(index)
        iniciarTimeout( index, timerB, showProg, "b");
        /*setTimeout(() => {
            inmediatos.push(index);t indice = proximos.indexOf(index);

            // Verificar si se encontró el valor
            if (indice !== -1) {
                proximos.splice(indice, 1);
                
            };
            showProg();
        }, ((40-tiempoTranscurrido)*60000));*/
        break;
    case (tiempoTranscurrido >= maximo):
        buscarAgregar(inmediatos, index);
        //inmediatos.push(index);
        break;
    default:
        break;
    }
}

function buscarAgregar(cual, dato){
    let indice = cual.indexOf(dato);

    // Verificar si se encontró el valor
    if (indice == -1) {
       cual.push(dato);//elimina el dato de proximos para solo mostrarlo como inmd    
    };
}
function buscarEliminar(cual, dato){
    
    let indice = cual.indexOf(dato);

    // Verificar si se encontró el valor
    if (indice !== -1) {
        cual.splice(indice, 1);//elimina el dato de proximos para solo mostrarlo como inmd
        
    };
}

function iniciarTimeout(id, delay, callback, tipo) {
    timeouts[`${id}${tipo}`] = setTimeout(() => {
    if(tipo == "a"){
        buscarAgregar(proximos, id);
        //proximos.push(temporal);
    }else{
        buscarAgregar(inmediatos, id);
        //inmediatos.push(temporal);
        buscarEliminar(proximos, id);
    }
    
    callback();
    delete timeouts[`${id}${tipo}`]; // limpia después de ejecutar
  }, delay);
}

function cancelarTimeout(id) {
  if (timeouts[id]) {
    clearTimeout(timeouts[id]);
    delete timeouts[id];
    console.log(`Timeout ${id} cancelado.`);
  } else {
    console.log(`No existe un timeout con id ${id}.`);
  }
}
