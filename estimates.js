// Función para agregar datos al almacén "estimated"
function addEstimated() {
    if (!db) {
        console.error("La base de datos aún no está disponible.");
        return;
    }

    // Obtener valores de los inputs
    const category = document.getElementById("categoryInputEstimated").value;
    const date = document.getElementById("dateInputEstimated").value;
    const year = date.split("-")[0];
    const month = date.split("-")[1];
    const amount = document.getElementById("amountInputEstimated").value;

    // Verificar que todos los campos tengan contenido
    if (category && month && amount) {
        // Crear una transacción en modo "readwrite" para escribir datos
        const estimated = db.transaction("estimated", "readwrite");
        const store = estimated.objectStore("estimated");

        // Intentar agregar los datos
        const addRequest = store.add({ category, year, month, amount });

        addRequest.onsuccess = function() {
            console.log("Datos agregados correctamente en el almacén estimated.");
            // Limpiar inputs después de agregar
            document.getElementById("categoryInputEstimated").value = "";
            document.getElementById("dateInputEstimated").value = "";
            document.getElementById("amountInputEstimated").value = "";

            displayEstimated();
        };

        addRequest.onerror = function(event) {
            console.error("Error al agregar los datos:", event.target.error);
        };
    } else {
        console.error("Todos los campos son requeridos.");
    }
}

// Función para eliminar gastos estimados por su id
function deleteEstimated(id) {
    if (!db) {
        console.error("La base de datos aún no está disponible.");
        return;
    }

    let estimated = db.transaction("estimated", "readwrite");
    let store = estimated.objectStore("estimated");

    let request = store.delete(id);
    request.onsuccess = function(event) {
        displayEstimated();
    };
}

// Función para mostrar los gatos estimados filtrados
function displayEstimated() {
    if (!db) {
        console.error("La base de datos aún no está disponible.");
        return;
    }

    let month = document.getElementById("monthInput").value;
    let year = document.getElementById("yearInput").value;
    let category = document.getElementById("categorySelect").value;

    if (!year) {
        year = new Date().getFullYear().toString();
    }

    if (!month) {
        month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    }

    const operation = db.transaction("estimated", "readonly");
    const store = operation.objectStore("estimated");

    const cursorRequest = store.openCursor();

    let tbody = document.getElementById("estimated");
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
                (category === "All" || objeto.category === category)

            if (cumpleFiltros && !shownIds.has(cursor.key)) {
                shownIds.add(cursor.key);

                // Crear fila de la estimated
                let tr = document.createElement("tr");

                // Fecha
                let tdFecha = document.createElement("td");
                tdFecha.textContent = `${objeto.month}/${objeto.year}`;

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
                    deleteEstimated(objeto.id);
                });
                tdAccion.appendChild(button);

                // Agregar celdas a la fila
                tr.appendChild(tdFecha);
                tr.appendChild(tdCat);
                tr.appendChild(tdMonto);
                tr.appendChild(tdAccion);

                // Agregar la fila al tbody
                tbody.appendChild(tr);
            }
            cursor.continue();
        } else {
            console.log("Fin de los registros. Datos mostrados según filtros.");
            numberEstimated();
            resumeEstimated(month, year);
        }
    };

    cursorRequest.onerror = function (event) {
        console.error("Error al abrir el cursor:", event.target.errorCode);
    };
}

// Función para mostrar el número total de los gatos estimados
function numberEstimated() {
    let tbody = document.getElementById("estimated");
    let numberEstimated = document.getElementById("numberEstimated");
    let total = tbody.children.length;
    numberEstimated.innerHTML = "Total de operaciones: " + total;
}

// Función para resumir los gastos estimados
function resumeEstimated(month, year) {
    if (!db) {
        console.error("La base de datos aún no está disponible.");
        return;
    }

    const estimatedTransaction = db.transaction("estimated", "readonly");
    const store = estimatedTransaction.objectStore("estimated");
    const cursorRequest = store.openCursor();

    // Objeto para acumular los montos estimados por categoría
    const estimatedByCategory = {};

    cursorRequest.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const objeto = cursor.value;

            // Filtrar por año y mes
            if (objeto.year === year.toString() && objeto.month === month.toString()) {
                let cat = objeto.category;
                if (!estimatedByCategory[cat]) {
                    estimatedByCategory[cat] = 0;
                }
                estimatedByCategory[cat] += parseFloat(objeto.amount);
            }
            cursor.continue();
        } else {
            // Resumen por categoría.
            const container = document.getElementById("estimatedSummary");
            if (container) {
                container.innerHTML = "";
                const div = document.createElement("div");
                for (const cat in estimatedByCategory) {
                    const p = document.createElement("p");
                    p.textContent = `${cat}: ${estimatedByCategory[cat].toFixed(2)}$`;
                    div.appendChild(p);
                }
                container.appendChild(div);
            } else {
                console.error("No se encontró el contenedor 'estimatedSummary' para mostrar los datos.");
            }
        }
    };

    cursorRequest.onerror = function(event) {
        console.error("Error al abrir el cursor en 'estimated':", event.target.errorCode);
    };
}