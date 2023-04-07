onload = (event) => {
    cambioRadio();
    // const ipRed = '15.0.0.0';
    // const mascara = '255.0.0.0';
    // const numHostsPorSubred = 65536;
    // const numSubredDeseada = 255;

    // const rangoSubred = obtenerRangoSubred(ipRed, mascara, numHostsPorSubred, numSubredDeseada);
    // console.log(rangoSubred);
}
fn = () => {
    let DOMaviso = document.getElementById("aviso");
    DOMaviso.innerHTML = '';
    let ip = document.getElementById("direccion_red").value;
    let numeroSubredes = 0, numeroHostPorSubred = 0;
    if (!esIpValida(ip)) {
        avisoError("Hay un error en la IP de la red");
        return 0;
    }
    let mascara = obtenerMascara(ip);
    if (mascara == "255.255.255.255") {
        avisoError("Esa red no se puede subnetear");
        return 0;
    }
    if (document.getElementById("rd_numero_subredes").checked) {
        numeroSubredes = document.getElementById("peticion").value;
        numeroSubredes = masCercanoADos(numeroSubredes);
        numeroHostPorSubred = obtenerHostPorSubred(mascara, numeroSubredes);
    }
    else if (document.getElementById("rd_host_subred").checked) {
        numeroHostPorSubred = document.getElementById("peticion").value;
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
    let limiteInferior = 0, limiteSuperior = 0;
    let subred = [];
    let parrafo = "";
    //obtenerRangoSubred = (ipv4Red, mascaraSubred, numHostsPorSubred, numSubred) => {
    for (let i = 0; i < 3; i++) {
        subred = obtenerRangoSubred(ip, mascara, numeroHostPorSubred, i);
        limiteInferior = subred[0];
        limiteSuperior = subred[1];
        parrafo = document.getElementById(`rango${i}`);
        parrafo.innerHTML = `Subred ${i+1}: [${limiteInferior} - ${limiteSuperior}]`;
    }
    //debugger
    for (let i = numeroSubredes; i > numeroSubredes-3; i--) {
        
        subred = obtenerRangoSubred(ip, mascara, numeroHostPorSubred, i-1);
        limiteInferior = subred[0];
        limiteSuperior = subred[1];
        parrafo = document.getElementById(`rangoN-${numeroSubredes-i}`);
        parrafo.innerHTML = `Subred ${i}: [${limiteInferior} - ${limiteSuperior}]`;
    }
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
obtenerRangoSubred = (ipv4Red, mascaraSubred, numHostsPorSubred, numSubred) => {
    // Convertir la dirección IP y la máscara de subred a números binarios
    let ipv4RedBin = ipv4Red.split('.').map(octeto => parseInt(octeto).toString(2).padStart(8, '0')).join('');
    let mascaraSubredBin = mascaraSubred.split('.').map(octeto => parseInt(octeto).toString(2).padStart(8, '0')).join('');

    // Calcular el número de subredes posibles
    let numBitsSubred = mascaraSubredBin.split('1').length - 1;
    let numSubredes = Math.pow(2, 32 - numBitsSubred) / numHostsPorSubred;

    // Verificar si el número de subred solicitado es válido
    if (numSubred < 0 || numSubred >= numSubredes) {
        throw new Error('Número de subred inválido');
    }

    // Calcular la dirección IP de inicio y fin de la subred solicitada
    let inicioSubredBin = (parseInt(ipv4RedBin, 2) + numHostsPorSubred * numSubred).toString(2).padStart(32, '0');
    let finSubredBin = (parseInt(inicioSubredBin, 2) + numHostsPorSubred - 1).toString(2);

    // Convertir las direcciones IP de inicio y fin a formato decimal
    let inicioSubred = inicioSubredBin.match(/.{8}/g).map(octeto => parseInt(octeto, 2)).join('.');
    let finSubred = finSubredBin.padStart(32, '0').match(/.{8}/g).map(octeto => parseInt(octeto, 2)).join('.');

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
obtenerHostPorSubred = (mascara = "", subredes = 0) => {
    let mascaraBinaria = mascara.split('.').map(octeto => parseInt(octeto).toString(2).padStart(8, '0')).join('');
    let numeroPotencia = -1;
    let primerCeroMascara = 0;
    let result = 0;
    do {
        numeroPotencia++;
        result = Math.pow(2, numeroPotencia);
    } while (subredes > result);
    primerCeroMascara = mascaraBinaria.split('1').length - 1;
    mascaraBinaria = mascaraBinaria.split('');
    while (numeroPotencia > 0) {
        mascaraBinaria[primerCeroMascara] = '1';
        numeroPotencia--;
        primerCeroMascara++;
    }
    mascaraBinaria = mascaraBinaria.join('');
    return Math.pow(2, mascaraBinaria.split('0').length - 1);

}
obtenerNumeroSubredes = (mascara = '', numHostsPorSubred) => {
    //debugger;
    let mascaraBinaria = mascara.split('.').map(octeto => parseInt(octeto).toString(2).padStart(8, '0')).join('');
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
