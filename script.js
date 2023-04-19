let ipGlobal = '';
let mascaraGlobal = '';
let numeroSubredesGlobal = '';
let hostPorSubredGlobal = '';
onload = (event) => {
    cambioRadio();
    document.getElementById("direccion_red").value = "15.0.0.0";
    document.getElementById("peticion").value = "250";
    ipGlobal = '';
    mascaraGlobal = '';
    numeroSubredesGlobal = '';
    hostPorSubredGlobal = '';
}

fn = () => {
    document.getElementById("totalidad").style.display = "none";
    //debugger
    let DOMaviso = document.getElementById("aviso");
    DOMaviso.innerHTML = '';
    let ip = document.getElementById("direccion_red").value;
    let peticion = document.getElementById("peticion").value;

    if (!esEnteroPositivo(peticion)) {
        avisoError("Los datos ingresados no son validos");
        return 0;
    }
    let numeroSubredes = 0, numeroHostPorSubred = 0;
    if (!esIpValida(ip)) {
        avisoError("Hay un error en la IP de la red");
        return 0;
    }
    let mascara = obtenerMascara(ip);
    if (mascara == "255.255.255.255" || mascara == "0.0.0.0") {
        avisoError("Red invalida");
        return 0;
    }
    let valor = Number(document.getElementById("peticion").value);
    valor += 2;
    if (document.getElementById("rd_numero_subredes").checked) {
        numeroSubredes = valor;
        numeroSubredes = masCercanoADos(numeroSubredes);
        numeroHostPorSubred = obtenerHostPorSubred(mascara, numeroSubredes);
    }
    else if (document.getElementById("rd_host_subred").checked) {
        numeroHostPorSubred = valor;
        numeroHostPorSubred = masCercanoADos(numeroHostPorSubred);
        numeroSubredes = obtenerNumeroSubredes(mascara, numeroHostPorSubred);
    }
    else {
        avisoError("Error al obtener la entrada de subredes/host");
        return 0;
    }
    
    document.getElementById("subredesTeoricas").innerHTML = numeroSubredes;
    document.getElementById("subredesPracticas").innerHTML = numeroSubredes - 2;
    document.getElementById("hostTeoricos").innerHTML = numeroHostPorSubred;
    document.getElementById("hostPracticos").innerHTML = numeroHostPorSubred - 2;
    document.getElementById("totalidad").style.display = "";
    ipGlobal = ip;
    mascaraGlobal = mascara;
    numeroSubredesGlobal = numeroSubredes;
    hostPorSubredGlobal = numeroHostPorSubred;
    //console.log(obtenerNuevaMascara(mascara,numeroSubredes));
    let nuevaMascara = obtenerNuevaMascara(mascara, numeroSubredes)
    nuevaMascara = nuevaMascara.split('.');
    mascara_ = mascara.split('.');
    console.log(nuevaMascara);
    nuevaMascara.forEach((valor,posicion) => {
        //debugger;
        document.getElementById(`superior${posicion}`).innerHTML = valor;
        if(nuevaMascara[posicion] == mascara_[posicion] && nuevaMascara[posicion]!=0)document.getElementById(`inferior${posicion}`).innerHTML = "Red";
        else if(nuevaMascara[posicion] === "0")document.getElementById(`inferior${posicion}`).innerHTML = "Host";
        else if(nuevaMascara[posicion] != mascara_[posicion] && nuevaMascara[posicion] == 255)document.getElementById(`inferior${posicion}`).innerHTML = "Subred";
        else document.getElementById(`inferior${posicion}`).innerHTML = "Subred y host";
        document.getElementById(`siguiente${posicion}`).innerHTML = Number(nuevaMascara[posicion]).toString(2).padEnd(8,0);
        document.getElementById(`siguiente${posicion}`).style = "padding: 0 !important";
    });

    let table = new PaginatedTable((numeroSubredes / 10) + 1, 10, [ip, mascara, numeroHostPorSubred]);
    table.iniciar();
}







cambioRadio = () => {
    if (document.getElementById("rd_numero_subredes").checked) {
        document.getElementById("lb_peticion").innerHTML = "Numero de subredes";
        document.getElementById("peticion").placeholder = "Ingrese numero de subredes";
    }
    else if (document.getElementById("rd_host_subred").checked) {
        document.getElementById("lb_peticion").innerHTML = "Host por subred";
        document.getElementById("peticion").placeholder = "Ingrese numero de host por subred";
    }
}
esIpValida = (ip = "") => {

    try {
        let octetos = ip.split('.');
        if (octetos.length !== 4) return false;
        for (let i = 0; i < octetos.length; i++) {
            if (!(Number(octetos[i]) >= 0 && Number(octetos[i]) <= 255) || octetos[i].length > 3)
                return false;
        }
        return true;
    } catch (error) {
        return false;
    }

}
avisoError = (mensaje = "") => {
    let aviso = document.createElement("div");
    aviso.role = "alert";
    aviso.classList.add("alert");
    aviso.classList.add("alert-danger");

    aviso.innerHTML = mensaje;
    let DOMaviso = document.getElementById("aviso");
    DOMaviso.innerHTML = '';
    DOMaviso.appendChild(aviso);
}
obtenerRangoSubred = (ip, mascaraSubred, numHostsPorSubred, numSubred) => {
    // Convertir la dirección IP y la máscara de subred a números binarios
    let ipBin = convertirABinario(ip);
    let mascaraSubredBin = convertirABinario(mascaraSubred);

    // Calcular el número de subredes posibles
    let numBitsSubred = mascaraSubredBin.split('1').length - 1;
    let numSubredes = Math.pow(2, 32 - numBitsSubred) / numHostsPorSubred;

    // Se detecta si la subred que se solicita es valida
    if (numSubred < 0 || numSubred >= numSubredes) {
        throw new Error(`Numero de subred inválido ${numSubred}`);
    }

    // Calcular la dirección IP de inicio y fin de la subred solicitada
    let inicioSubredBin = (parseInt(ipBin, 2) + numHostsPorSubred * numSubred).toString(2).padStart(32, '0');
    let finSubredBin = (parseInt(inicioSubredBin, 2) + numHostsPorSubred - 1).toString(2);
    // Convertir las direcciones IP de inicio y fin a formato decimal
    let inicioSubred = convertirADecimal(inicioSubredBin);//El fin de subred se rellena con 0 a la izq
    let finSubred = convertirADecimal(finSubredBin.padStart(32, '0'));

    return [inicioSubred, finSubred];
}
obtenerMascara = (ip = "") => {
    let octetos = ip.split('.');
    let mascara = "0.0.0.0";
    let octetosMascara = mascara.split('.');
    for (let i = 0; i < octetos.length; i++) {
        if (Number(octetos[i]) === 0)
            octetosMascara[i] = '0';
        else octetosMascara[i] = "255";
    }
    mascara = octetosMascara.join('.');
    return mascara;
}
obtenerNuevaMascara = (mascara, subredes) => {
    let unosMascara = convertirABinario(mascara).split('1').length - 1;
    let unosSubred = (subredes).toString(2).split('0').length - 1;
    let nuevaMascara = '1'.repeat(unosMascara + unosSubred).padEnd(32, '0');
    return convertirADecimal(nuevaMascara);

}
obtenerHostPorSubred = (mascara = "", subredes = 0) => {
    let mascaraBinaria = convertirABinario(mascara);
    let bitsRed = 0;
    bitsRed += mascaraBinaria.split('1').length - 1;
    bitsRed += ((subredes - 1).toString(2)).length;
    let bitsHostPorSubred = 32 - bitsRed;
    return Math.pow(2, bitsHostPorSubred);
}
obtenerNumeroSubredes = (mascara = '', numHostsPorSubred) => {
    mascaraBinaria = convertirABinario(mascara);
    let numBitsSubred = mascaraBinaria.split('1').length - 1;
    let numSubredes = Math.pow(2, 32 - numBitsSubred) / numHostsPorSubred;
    return numSubredes;
}
masCercanoADos = (num) => {
    let potencia = 1;
    while (potencia < num) {
        potencia *= 2;
    }
    return potencia;
}
convertirABinario = (ip) => {
    let bin = "";
    let octetos = ip.split('.');
    for (let i = 0; i < octetos.length; i++) {
        bin += Number(octetos[i]).toString(2).padStart(8, '0');
    }
    return bin;
}
esEnteroPositivo = (valor) => {
    const enteroPositivoRegex = /^[1-9]\d*$/;
    return enteroPositivoRegex.test(valor);
}
convertirADecimal = (ipBinaria) => {
    ipBinaria = agregarPuntos(ipBinaria);
    ipDecimal = [];
    ipBinaria = ipBinaria.split('.');
    for (let i = 0; i < ipBinaria.length; i++) {
        ipDecimal.push(parseInt(ipBinaria[i], 2));
    }
    return (ipDecimal.join('.'));
}
agregarPuntos = (ipBinaria = '') => {
    const regex = /.{1,8}/g; // expresión regular para dividir en grupos de 8 caracteres
    const arr = ipBinaria.match(regex); // divide el string en grupos de 8 caracteres y los guarda en un arreglo
    return arr.join('.');
}
complementoBinario = (binario) => {
    // Convertir el string a un arreglo de caracteres para poder manipularlo
    const caracteres = binario.split("");

    // Iterar sobre el arreglo y cambiar cada dígito por su complemento
    const complemento = caracteres.map((digito) => {
        if (digito === "0") {
            return "1";
        } else if (digito === "1") {
            return "0";
        } else {
            // Si el caracter no es un 0 o un 1, devolver el mismo caracter
            return digito;
        }
    });

    // Unir los caracteres del arreglo en un string y devolverlo
    return complemento.join("");
}
async function textArea() {
    let textarea = document.getElementById("textAreaSubredes");
    // let i = 0;
    // while (true) {
    //     console.log(i);
    //     await delay(0.5);
    // }
    textarea.innerHTML = "";
    let subred = [];
    //for (let i = 0; i < numeroSubredesGlobal; i++) {
    let i = 0; // índice del carácter actual
    const intervalId = setInterval(() => {

        subred = obtenerRangoSubred(ipGlobal, mascaraGlobal, hostPorSubredGlobal, i);
        textarea.innerHTML += `Subred ${i + 1}: [${subred[0]},${subred[1]}]`;
        textarea.innerHTML += "\n";
        i++; // incrementar el índice del carácter actual
        if (i >= numeroSubredesGlobal) {
            clearInterval(intervalId); // detener el intervalo cuando se hayan agregado todos los caracteres
        }
    }, 0.1);

}

class PaginatedTable {
    constructor(pages, subredesPorPagina, datosGenerales) {
        this.currentPage = 1;
        this.pages = Math.trunc(pages);
        this.subredesPorPagina = subredesPorPagina;
        this.datosGenerales = datosGenerales;
        this.data = null;
        this.cargado = false;
    }
    async iniciar() {
        let data = await this.fetchData(this.currentPage, this.subredesPorPagina);
        this.renderTableData(data);
    }
    async fetchData(page, subredesPorPagina) {
        const primeraSubred = (page * subredesPorPagina) - subredesPorPagina + 1;
        const ultimaSubred = primeraSubred + subredesPorPagina - 1;
        const data = [];
        let ip = this.datosGenerales[0];
        let mascara = this.datosGenerales[1];
        let hostPorSubred = this.datosGenerales[2];
        let subred = '';
        for (let i = primeraSubred; i <= ultimaSubred; i++) {
            try {
                subred = obtenerRangoSubred(ip, mascara, hostPorSubred, i - 1);
            } catch (error) {
                break;
            }

            data.push({
                numeroSubred: i,
                subredID: subred[0],
                broadcast: subred[1],
            });
        }
        return Promise.resolve(data);
        //return new Promise(data);

    }
    async goToPage(page) {

        if (page >= 1 && page <= this.pages) {
            page = page;
        }
        else if (page < 1)
            page = 1;
        else if (page > this.pages)
            page = this.pages;

        else page = 1;
        this.currentPage = page;
        //let data = await fetchData(this.currentPage, this.subredesPorPagina);
        let data = await this.fetchData(this.currentPage, this.subredesPorPagina);
        //console.log(data);
        this.renderTableData(data);
    }
    async prevPage() {
        const prevPage = this.currentPage - 1;
        if (prevPage < 1) {
            return;
        }
        this.currentPage = prevPage;
        let data = await fetchData(this.currentPage, this.subredesPorPagina);
        this.renderTableData(data);

    }
    async renderTableData(data) {

        const table = document.createElement('table');
        table.classList.add("table", "caption-top", "table-striped");
        const caption = document.createElement("caption");
        caption.textContent = `Pagina ${this.currentPage}`;
        table.appendChild(caption);
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        const th1 = document.createElement('th');
        th1.textContent = 'Numero de subred';
        const th2 = document.createElement('th');
        th2.textContent = 'ID de red';
        const th3 = document.createElement('th');
        th3.textContent = 'Broadcast';

        tr.appendChild(th1);
        tr.appendChild(th2);
        tr.appendChild(th3);
        thead.appendChild(tr);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        data.forEach((row, index) => {
            //console.log(row,index);
            const tr = document.createElement('tr');
            const td1 = document.createElement('td');
            td1.id = `td1_${index + 1}`;
            td1.textContent = row.numeroSubred;
            const td2 = document.createElement('td');
            td2.id = `td2_${index + 1}`;
            td2.textContent = row.subredID;
            const td3 = document.createElement('td');
            td3.id = `td3_${index + 1}`;
            td3.textContent = row.broadcast;

            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);


        let pagination;
        if (this.pages < 100) {
            pagination = document.createElement('div');
            pagination.classList.add('pagination');
            let ul = document.createElement('ul');
            ul.classList.add('pagination');
            for (let i = 1; i <= this.pages; i++) {
                let li = document.createElement('li');
                li.classList.add('page-item');
                const a = document.createElement('a');
                a.classList.add('page-link');
                a.textContent = i;
                a.addEventListener('click', () => {
                    this.goToPage(i);
                });
                li.appendChild(a);
                ul.appendChild(li);
            }
            pagination.appendChild(ul);
        }
        else {
            pagination = document.createElement("div");
            pagination.classList.add("input-group", "input-group-sm", "inputNavegacion");

            let primera = document.createElement("div");
            primera.classList.add("input-group-prepend");
            let botonPrimera = document.createElement("button");
            botonPrimera.classList.add("btn", "btn-outline-secondary");
            botonPrimera.innerHTML = "Primera";
            botonPrimera.addEventListener('click', () => {
                this.goToPage(1);
            });
            primera.appendChild(botonPrimera);
            pagination.appendChild(primera);




            let anterior = document.createElement("div");
            anterior.classList.add("input-group-prepend");
            let botonAnterior = document.createElement("button");
            botonAnterior.classList.add("btn", "btn-outline-secondary");
            botonAnterior.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-left-fill" viewBox="0 0 16 16">
            <path d="m3.86 8.753 5.482 4.796c.646.566 1.658.106 1.658-.753V3.204a1 1 0 0 0-1.659-.753l-5.48 4.796a1 1 0 0 0 0 1.506z"/>
          </svg>`;
            botonAnterior.addEventListener('click', () => {
                this.goToPage(this.currentPage - 1);
            });
            anterior.appendChild(botonAnterior);
            pagination.appendChild(anterior);
            let input = document.createElement("input");
            input.type = "text";
            input.classList.add("form-control");
            input.id = "inputText";
            input.placeholder = `[1 - ${Math.trunc(this.pages)}]`;
            input.addEventListener('change', (event) => {
                //debugger;
                input = event.target.value;
                this.goToPage(Number(input));
            });
            pagination.appendChild(input);
            let siguiente = document.createElement("div");
            siguiente.classList.add("input-group-append");
            let botonSiguiente = document.createElement("button");
            botonSiguiente.classList.add("btn", "btn-outline-secondary");
            botonSiguiente.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-caret-right-fill" viewBox="0 0 16 16">
            <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z"/>
          </svg>`;
            botonSiguiente.addEventListener('click', () => {
                this.goToPage(this.currentPage + 1);
            });
            siguiente.appendChild(botonSiguiente);
            pagination.appendChild(siguiente);
            let ultimo = document.createElement("div");
            ultimo.classList.add("input-group-append");
            let botonUltimo = document.createElement("button");
            botonUltimo.classList.add("btn", "btn-outline-secondary");
            botonUltimo.innerHTML = "Ultima";

            botonUltimo.addEventListener('click', () => {
                //debugger;
                this.goToPage(this.pages);
            });
            ultimo.appendChild(botonUltimo);
            pagination.appendChild(ultimo);

        }
        const container = document.getElementById("tablaDeRedes");
        container.innerHTML = '';
        container.appendChild(table);
        container.appendChild(pagination);




    }



}
