// Declaración global para almacenar la base de datos
let db;

// Abrir (o crear) la base de datos "ClientesWeb" versión 1
const request = indexedDB.open("ClientesWeb", 1);

// Función que configura los eventos del request para crear la estructura
function createTable(request) {
    // Se ejecuta si es la primera vez o se necesita actualizar la estructura de la DB
    request.onupgradeneeded = function (event) {
        db = event.target.result;

        if (!db.objectStoreNames.contains("transaction")) {
            db.createObjectStore("transaction", { keyPath: "id", autoIncrement: true });
        }

        if (!db.objectStoreNames.contains("estimated")) {
            db.createObjectStore("estimated", { keyPath: "id", autoIncrement: true });
        }

        if (!db.objectStoreNames.contains("category")) {
            const categoryStore = db.createObjectStore("category", { keyPath: "id", autoIncrement: true });

            // Agregar categorías iniciales
            const categories = ["Comida", "Ropa", "Ocio", "Emergencia", "Trabajo"];
            categories.forEach((category) => {
                categoryStore.add({ name: category });
            });
        }
    };

    // Se ejecuta cuando la base de datos se abre correctamente
    request.onsuccess = function (event) {
        db = event.target.result;
        console.log("Base de datos abierta correctamente.");

        // Habilitar el botón para agregar datos
        document.getElementById("addBtnTransaction").disabled = false;
        document.getElementById("addBtnEstimated").disabled = false;
        document.getElementById("addBtnCategory").disabled = false;


        // Cargar categorías en los selectores
        loadCategories();

        // Mostrar datos de transacciones
        displayTransaction();
        displayEstimated();
        displayVs();
    };

    // En caso de error al abrir la base de datos
    request.onerror = function (event) {
        console.error("Error al abrir la base de datos:", event.target.error);
    };
}

// Función para agregar una nueva categoría
function addCategory() {
    if (!db) {
        console.error("La base de datos aún no está disponible.");
        return;
    }

    const category = document.getElementById("addCategory").value;

    if (category) {
        const transaction = db.transaction("category", "readwrite");
        const store = transaction.objectStore("category");

        const addRequest = store.add({ name: category });

        addRequest.onsuccess = function (event) {
            console.log("Dato agregado correctamente en el almacén category.");
            // Limpiar inputs después de agregar
            document.getElementById("addCategory").value = "";
        }
    }



}

// Función para cargar las categorías en los selectores
function loadCategories(){
    if (!db) {
        console.error("La base de datos aún no está disponible.");
        return;
    }

    const transaction = db.transaction("category", "readonly");
    const store = transaction.objectStore("category");

    const cursorRequest = store.openCursor();
    const categoryInputTransaction = document.getElementById("categoryInputTransaction");
    const categoryInputEstimated = document.getElementById("categoryInputEstimated");
    const categorySelect = document.getElementById("categorySelect");

    // Limpiar las opciones actuales antes de cargar nuevas
    categoryInputTransaction.innerHTML = '<option value="" disabled selected>Seleccione una Categoría</option>';
    categoryInputEstimated.innerHTML = '<option value="" disabled selected>Seleccione una Categoría</option>';
    categorySelect.innerHTML = '<option value="All" selected>Todo</option>';

    cursorRequest.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
            const objeto = cursor.value;

            // Opción para el formulario de Nueva Transacción
            const optionInputTransaction = document.createElement("option");
            optionInputTransaction.value = objeto.name;
            optionInputTransaction.textContent = objeto.name;
            categoryInputTransaction.appendChild(optionInputTransaction);

            // Opción para el formulario de Nuevo Gasto Estimado
            const optionInputEstimated = document.createElement("option");
            optionInputEstimated.value = objeto.name;
            optionInputEstimated.textContent = objeto.name;
            categoryInputEstimated.appendChild(optionInputEstimated);

            // Opción para el filtro de categoría
            const optionSelect = document.createElement("option");
            optionSelect.value = objeto.name;
            optionSelect.textContent = objeto.name;
            categorySelect.appendChild(optionSelect);

            cursor.continue();
        } else {
            console.log("Todas las categorías han sido cargadas en los selectores.");
        }
    };

    cursorRequest.onerror = function (event) {
        console.error("Error al cargar las categorías:", event.target.errorCode);
    };
}

function addHide() {
    // Selecciona todos los elementos que deben ocultarse
    var elements = document.querySelectorAll('.view-content, .new-transaction, .new-estimated, .type-select, .category-select');
    for (var i = 0; i < elements.length; i++) {
        elements[i].classList.add('hide');
    }
}

function btnTransaction() {
    addHide();

    document.getElementById("view-transacciones").classList.remove("hide");
    document.getElementById("resumeTransaction").classList.remove("hide");
    document.querySelector(".new-transaction").classList.remove("hide");

    document.querySelectorAll(".type-select").forEach(el => el.classList.remove("hide"));
    document.querySelectorAll(".category-select").forEach(el => el.classList.remove("hide"));
}

function btnEstimated() {
    addHide();

    document.getElementById("view-estimados").classList.remove("hide");
    document.getElementById("resumeEstimated").classList.remove("hide");
    document.querySelector(".new-estimated").classList.remove("hide");
    document.querySelectorAll(".category-select").forEach(el => el.classList.remove("hide"));

}

function btnVs() {
    addHide();
    document.getElementById("view-vs").classList.remove("hide");
    document.getElementById("resumeVs").classList.remove("hide");
    document.getElementById("chart").classList.remove("hide");
}

// Inicializar la creación de la DB
createTable(request);

// Listeners para los eventos de la interfaz
document.getElementById("addBtnTransaction").addEventListener("click", function() {
    addTransaction();
});

document.getElementById("addBtnEstimated").addEventListener("click", function() {
    addEstimated();
});

document.getElementById("addBtnCategory").addEventListener("click", function() {
    addCategory();
    loadCategories();
});

document.getElementById("transacciones").addEventListener("click", function() {
    btnTransaction();
    let transacciones = document.getElementById("transacciones");
    let estimados = document.getElementById("estimados");
    let comparacion = document.getElementById("comparacion");

    transacciones.classList.add("active");
    estimados.classList.remove("active");
    comparacion.classList.remove("active");

    displayTransaction();
});

document.getElementById("estimados").addEventListener("click", function() {
    btnEstimated();
    let transacciones = document.getElementById("transacciones");
    let estimados = document.getElementById("estimados");
    let comparacion = document.getElementById("comparacion");

    transacciones.classList.remove("active");
    estimados.classList.add("active");
    comparacion.classList.remove("active");

    displayEstimated();
});

document.getElementById("comparacion").addEventListener("click", function() {
    btnVs();
    let transacciones = document.getElementById("transacciones");
    let estimados = document.getElementById("estimados");
    let comparacion = document.getElementById("comparacion");

    transacciones.classList.remove("active");
    estimados.classList.remove("active");
    comparacion.classList.add("active");

    displayVs();
});

document.getElementById("typeSelect").addEventListener("change", function () {
    displayTransaction();
});

document.getElementById("monthInput").addEventListener("change", function () {
    displayTransaction();
    displayEstimated();
    displayVs();
});

document.getElementById("yearInput").addEventListener("change", function () {
    displayTransaction();
    displayEstimated();
    displayVs();
});

document.getElementById("categorySelect").addEventListener("change", function () {
    displayTransaction();
    displayEstimated();
    displayVs();
});
