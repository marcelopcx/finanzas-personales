function displayVs() {
    if (!db) {
        console.error("La base de datos aún no está disponible.");
        return;
    }

    var month = document.getElementById("monthInput").value;
    var year = document.getElementById("yearInput").value;

    if (!year) {
        year = new Date().getFullYear().toString();
    }
    if (!month) {
        month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    }

    // Objetos para acumular montos por categoría
    var estimatedByCategory = {};
    var realByCategory = {};

    // Usamos un contador para saber cuándo terminaron ambas consultas
    var pendingOperations = 2;

    function renderVs() {
        if (pendingOperations > 0) return;

        // Unir las categorías obtenidas de ambos procesos
        var categoriesSet = new Set(
            Object.keys(estimatedByCategory).concat(Object.keys(realByCategory))
        );
        var categories = Array.from(categoriesSet);

        // Generar las filas de la tabla
        var tbody = document.getElementById("vsTableBody");
        tbody.innerHTML = "";
        categories.forEach(function(cat) {
            var estimated = estimatedByCategory[cat] || 0;
            var real = realByCategory[cat] || 0;
            var difference =  estimated - real;

            var tr = document.createElement("tr");

            var tdCategory = document.createElement("td");
            tdCategory.textContent = cat;

            var tdEstimated = document.createElement("td");
            tdEstimated.textContent = estimated.toFixed(2) + "$";

            var tdReal = document.createElement("td");
            tdReal.textContent = real.toFixed(2) + "$";

            var tdDifference = document.createElement("td");
            tdDifference.textContent = difference.toFixed(2) + "$";

            tr.appendChild(tdCategory);
            tr.appendChild(tdEstimated);
            tr.appendChild(tdReal);
            tr.appendChild(tdDifference);

            tbody.appendChild(tr);
        });

        // Llamar al resumen global Vs
        resumeVs();

        // Llama a la función para renderizar la gráfica con los datos obtenidos
        createComparisonChart(estimatedByCategory, realByCategory);
    }

    // Consultar "estimated"
    var estimatedTransaction = db.transaction("estimated", "readonly");
    var estimatedStore = estimatedTransaction.objectStore("estimated");
    var cursorEstimated = estimatedStore.openCursor();
    cursorEstimated.onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
            var objeto = cursor.value;
            // Filtrar por año y mes
            if (objeto.year === year && objeto.month === month) {
                var cat = objeto.category;
                if (!estimatedByCategory[cat]) {
                    estimatedByCategory[cat] = 0;
                }
                estimatedByCategory[cat] += parseFloat(objeto.amount);
            }
            cursor.continue();
        } else {
            pendingOperations--;
            renderVs();
        }
    };
    cursorEstimated.onerror = function(event) {
        console.error("Error en cursor estimated en Vs:", event.target.errorCode);
        pendingOperations--;
        renderVs();
    };

    // Consultar "transaction" para obtener gastos reales (tipo "Gastos")
    var transactionTransaction = db.transaction("transaction", "readonly");
    var transactionStore = transactionTransaction.objectStore("transaction");
    var cursorTransaction = transactionStore.openCursor();
    cursorTransaction.onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
            var objeto = cursor.value;
            if (objeto.year === year && objeto.month === month && objeto.type === "Gastos") {
                var cat = objeto.category;
                if (!realByCategory[cat]) {
                    realByCategory[cat] = 0;
                }
                realByCategory[cat] += parseFloat(objeto.amount);
            }
            cursor.continue();
        } else {
            pendingOperations--;
            renderVs();
        }
    };
    cursorTransaction.onerror = function(event) {
        console.error("Error en cursor transaction en Vs:", event.target.errorCode);
        pendingOperations--;
        renderVs();
    };
}


function resumeVs() {
    // Calcula totales globales para la comparación Vs
    let month = document.getElementById("monthInput").value;
    let year = document.getElementById("yearInput").value;
    if (!year) {
        year = new Date().getFullYear().toString();
    }
    if (!month) {
        month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    }

    let totalEstimated = 0;
    let totalReal = 0;

    // Sumar todos los gastos estimados del mes y año seleccionados
    const estimatedTransaction = db.transaction("estimated", "readonly");
    const estimatedStore = estimatedTransaction.objectStore("estimated");
    const cursorEstimated = estimatedStore.openCursor();
    cursorEstimated.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const objeto = cursor.value;
            if (objeto.year === year && objeto.month === month) {
                totalEstimated += parseFloat(objeto.amount);
            }
            cursor.continue();
        } else {
            // Una vez terminado, sumar los gastos reales
            const transactionTransaction = db.transaction("transaction", "readonly");
            const transactionStore = transactionTransaction.objectStore("transaction");
            const cursorTransaction = transactionStore.openCursor();
            cursorTransaction.onsuccess = function(event) {
                const cursor2 = event.target.result;
                if (cursor2) {
                    const objeto = cursor2.value;
                    if (objeto.year === year && objeto.month === month && objeto.type === "Gastos") {
                        totalReal += parseFloat(objeto.amount);
                    }
                    cursor2.continue();
                } else {
                    const difference =  Math.abs(totalEstimated - totalReal);
                    const estimatedTotal = document.getElementById("estimatedTotal");
                    const actualTotal = document.getElementById("actualTotal");
                    const differenceTotal = document.getElementById("difference");
                    if (estimatedTotal && actualTotal && differenceTotal) {
                        estimatedTotal.textContent = `Total estimado: ${totalEstimated.toFixed(2)}$`;
                        actualTotal.textContent = `Total real: ${totalReal.toFixed(2)}$`;
                        differenceTotal.textContent = `Diferencia: ${difference}$`;
                    }
                }
            };
            cursorTransaction.onerror = function(event) {
                console.error("Error en cursor de transactions en resumeVs:", event.target.errorCode);
            };
        }
    };
    cursorEstimated.onerror = function(event) {
        console.error("Error en cursor de estimated en resumeVs:", event.target.errorCode);
    };
}

function createComparisonChart(estimatedByCategory, realByCategory) {
    // Obtener las categorías únicas de ambos conjuntos
    var categoriesSet = new Set();
    var keysEstimated = Object.keys(estimatedByCategory);
    for (var i = 0; i < keysEstimated.length; i++) {
        categoriesSet.add(keysEstimated[i]);
    }
    var keysReal = Object.keys(realByCategory);
    for (var j = 0; j < keysReal.length; j++) {
        categoriesSet.add(keysReal[j]);
    }

    var categories = [];
    categoriesSet.forEach(function(item) {
        categories.push(item);
    });

    // Preparar los datos para cada categoría
    var estimatedData = [];
    var realData = [];
    for (var k = 0; k < categories.length; k++) {
        var cat = categories[k];
        estimatedData.push(estimatedByCategory[cat] ? estimatedByCategory[cat] : 0);
        realData.push(realByCategory[cat] ? realByCategory[cat] : 0);
    }

    // Si ya existe una instancia de la gráfica, se destruye para actualizarla
    if (window.comparisonChartInstance) {
        window.comparisonChartInstance.destroy();
    }

    // Crear la gráfica en el canvas
    var ctx = document.getElementById('comparisonChart').getContext('2d');
    window.comparisonChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Estimado',
                    data: estimatedData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)'
                },
                {
                    label: 'Real',
                    data: realData,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
