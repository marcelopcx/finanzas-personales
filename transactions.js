"use strict";

// Función para agregar datos al almacén "transaction"
function addTransaction() {
    if (!db) {
        console.error("La base de datos aún no está disponible.");
        return;
    }

    // Obtener valores de los inputs
    const type = document.getElementById("typeInputTransaction").value;
    const category = document.getElementById("categoryInputTransaction").value;
    const date = document.getElementById("dateInputTransaction").value;
    const year = date.split("-")[0];
    const month = date.split("-")[1];
    const day = date.split("-")[2];
    const amount = document.getElementById("amountInputTransaction").value;

    // Verificar que todos los campos tengan contenido
    if (type && category && month && amount) {
        // Crear una transacción en modo "readwrite" para escribir datos
        const transaction = db.transaction("transaction", "readwrite");
        const store = transaction.objectStore("transaction");

        // Intentar agregar los datos
        const addRequest = store.add({ type, category, year, month, day, amount });

        addRequest.onsuccess = function() {
            console.log("Datos agregados correctamente en el almacén transaction.");
            // Limpiar inputs después de agregar
            document.getElementById("typeInputTransaction").value = "";
            document.getElementById("categoryInputTransaction").value = "";
            document.getElementById("dateInputTransaction").value = "";
            document.getElementById("amountInputTransaction").value = "";

            displayTransaction();
        };

        addRequest.onerror = function(event) {
            console.error("Error al agregar los datos:", event.target.error);
        };
    } else {
        console.error("Todos los campos son requeridos.");
    }
}

// Función para eliminar una transacción por su id
function deleteTransaction(id) {
    if (!db) {
        console.error("La base de datos aún no está disponible.");
        return;
    }

    let transaction = db.transaction("transaction", "readwrite");
    let store = transaction.objectStore("transaction");

    let request = store.delete(id);
    request.onsuccess = function(event) {
        displayTransaction();
    };
}

// Función para mostrar las transacciones filtradas
function displayTransaction() {
    if (!db) {
        console.error("La base de datos aún no está disponible.");
        return;
    }

    let month = document.getElementById("monthInput").value;
    let year = document.getElementById("yearInput").value;
    let type = document.getElementById("typeSelect").value;
    let category = document.getElementById("categorySelect").value;

    if (!year) {
        year = new Date().getFullYear().toString();
    }

    if (!month) {
        month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    }

    const operation = db.transaction("transaction", "readonly");
    const store = operation.objectStore("transaction");

    const cursorRequest = store.openCursor();

    let tbody = document.getElementById("transaction");
    tbody.innerHTML = "";

    const shownIds = new Set();

    cursorRequest.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
            const objeto = cursor.value;

            // Aplicar filtros
            let cumpleFiltros =
                objeto.year === year.toString() &&
                objeto.month === month.toString() &&
                (category === "All" || objeto.category === category) &&
                (type === "All" || objeto.type === type);

            if (cumpleFiltros && !shownIds.has(cursor.key)) {
                shownIds.add(cursor.key);

                // Crear fila de la transacción
                let tr = document.createElement("tr");

                // Fecha
                let tdFecha = document.createElement("td");
                tdFecha.textContent = `${objeto.day}/${objeto.month}/${objeto.year}`;

                // Tipo
                let tdTipo = document.createElement("td");
                tdTipo.textContent = objeto.type;

                // Categoría
                let tdCat = document.createElement("td");
                tdCat.textContent = objeto.category;

                // Monto
                let tdMonto = document.createElement("td");
                tdMonto.textContent = objeto.amount + '$';

                // Botón para eliminar la transacción
                let tdAccion = document.createElement("td");
                let button = document.createElement("button");
                button.textContent = "Eliminar";
                button.style.backgroundColor = "#f44336";
                button.style.color = "#fff";
                button.style.border = "none";
                button.style.padding = "0.3rem 0.6rem";
                button.style.cursor = "pointer";

                button.addEventListener("click", function () {
                    deleteTransaction(objeto.id);
                });
                tdAccion.appendChild(button);

                // Agregar celdas a la fila
                tr.appendChild(tdFecha);
                tr.appendChild(tdTipo);
                tr.appendChild(tdCat);
                tr.appendChild(tdMonto);
                tr.appendChild(tdAccion);

                // Agregar la fila al tbody
                tbody.appendChild(tr);
            }
            cursor.continue();
        } else {
            console.log("Fin de los registros. Datos mostrados según filtros.");
            numberTransactions();
            resumeTransactions(month, year);
        }
    };

    cursorRequest.onerror = function (event) {
        console.error("Error al abrir el cursor:", event.target.errorCode);
    };
}

// Función para mostrar el número total de transacciones
function numberTransactions() {
    let tbody = document.getElementById("transaction");
    let numberTransactions = document.getElementById("numberTransactions");
    let total = tbody.children.length;
    numberTransactions.innerHTML = "Total de operaciones: " + total;
}

// Función para resumir las transacciones: ingresos, gastos y disponible
function resumeTransactions(month, year) {
    if (!db) {
        console.error("La base de datos aún no está disponible.");
        return;
    }

    const transaction = db.transaction("transaction", "readonly");
    const store = transaction.objectStore("transaction");

    const cursorRequest = store.openCursor();

    let totalRevenue = 0;
    let totalExpenditure = 0;

    cursorRequest.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
            const objeto = cursor.value;

            if (objeto.year === year.toString() && objeto.month === month.toString()) {
                if (objeto.type === "Ingresos") {
                    totalRevenue += parseFloat(objeto.amount);
                } else {
                    totalExpenditure += parseFloat(objeto.amount);
                }
            }
            cursor.continue();
        } else {
            const totalAvailable = totalRevenue - totalExpenditure;

            let revenue = document.getElementById("revenue");
            let expenditure = document.getElementById("expenditure");
            let available = document.getElementById("available");

            if (revenue && expenditure && available) {
                revenue.textContent = "Ingresos: " + totalRevenue.toFixed(2) + '$';
                expenditure.textContent = "Gastos: " + totalExpenditure.toFixed(2) + '$';
                available.textContent = "Disponible: " + totalAvailable.toFixed(2) + '$';
            }
        }
    };
}
