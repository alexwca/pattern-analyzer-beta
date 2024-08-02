// scripts.js

document.addEventListener('DOMContentLoaded', () => {
    // Não precisamos chamar updateTableHeaders() aqui, pois isso será feito ao clicar no botão.
});

function updateTableHeaders() {
    const competition = document.getElementById('competition').value;
    const resultTable = document.getElementById('horario_fixo');
    resultTable.innerHTML = ''; // Clear existing table

    const headerRow = resultTable.insertRow();
    let colStart, colIncrement;

    switch (competition) {
        case 'Copa':
            colStart = 1;
            colIncrement = 3;
            break;
        case 'Super':
            colStart = 1;
            colIncrement = 3;
            break;
        case 'Euro':
            colStart = 2;
            colIncrement = 3;
            break;
        case 'Premier':
            colStart = 0;
            colIncrement = 3;
            break;
        default:
            colStart = 1;
            colIncrement = 3;
    }

    // Add an empty cell for row headers
    let cell = headerRow.insertCell();
    cell.innerText = '';

    // Generate column headers
    for (let i = 0; i < 20; i++) {
        cell = headerRow.insertCell();
        const colNumber = colStart + (i * colIncrement);
        cell.innerText = colNumber.toString().padStart(2, '0');
    }

    // Generate row headers
    for (let i = 23; i >= 0; i--) {
        const row = resultTable.insertRow();
        const cell = row.insertCell();
        cell.innerText = i.toString().padStart(2, '0');
        for (let j = 0; j < 20; j++) {
            row.insertCell(); // Create empty cells
        }
    }
}

function calcularMedia() {
    const dataBlock1 = document.getElementById('dataBlock1').value.trim().split(/\s+/).map(Number);
    const dataBlock2 = document.getElementById('dataBlock2').value.trim().split(/\s+/).map(Number);

    if (dataBlock1.length !== 480 || dataBlock2.length !== 480) {
        alert('Cada bloco deve conter exatamente 480 valores.');
        return;
    }

    updateTableHeaders();

    const resultTable = document.getElementById('horario_fixo');
    const rows = resultTable.rows;

    for (let i = 1, k = 0; i < rows.length; i++) { // Skip the header row
        const cells = rows[i].cells;
        for (let j = 1; j < cells.length; j++) { // Skip the row headers
            const media = ((dataBlock1[k] + dataBlock2[k]) / 2).toFixed(2);
            cells[j].innerText = media;
            cells[j].className = ''; // Reset class

            if (media < 40) {
                cells[j].classList.add('red');
            } else if (media >= 40 && media < 70) {
                cells[j].classList.add('orange');
            } else if (media >= 70 && media < 90) {
                cells[j].classList.add('blue');
            } else if (media >= 90) {
                cells[j].classList.add('violet');
            }
            k++;
        }
    }
}
