document.addEventListener('DOMContentLoaded', () => {
    // Nenhuma ação necessária no DOMContentLoaded para esta implementação.
});

function updateTableHeaders(tableId, includeRows = true) {
    const competition = document.getElementById('competition').value;
    const resultTable = document.getElementById(tableId);
    resultTable.innerHTML = ''; // Limpa a tabela existente

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

    // Adiciona uma célula vazia para os cabeçalhos das linhas
    let cell = headerRow.insertCell();
    cell.innerText = '';

    // Gera os cabeçalhos das colunas
    for (let i = 0; i < 20; i++) {
        cell = headerRow.insertCell();
        const colNumber = colStart + (i * colIncrement);
        cell.innerText = colNumber.toString().padStart(2, '0');
    }

    // Somente inclui as linhas de dados para as tabelas base, não para a mesclada
    if (includeRows) {
        for (let i = 23; i >= 0; i--) {
            const row = resultTable.insertRow();
            const cell = row.insertCell();
            cell.innerText = i.toString().padStart(2, '0');
            for (let j = 0; j < 20; j++) {
                row.insertCell(); // Cria células vazias
            }
        }
    }
}

function calcularMedia() {
    const dataBlock1 = document.getElementById('dataBlock1').value.trim().split(/\s+/).map(Number);
    const dataBlock2 = document.getElementById('dataBlock2').value.trim().split(/\s+/).map(Number);
    const dataBlock3 = document.getElementById('dataBlock3').value.trim().split(/\s+/).map(Number);
    const dataBlock4 = document.getElementById('dataBlock4').value.trim().split(/\s+/).map(Number);

    if (dataBlock1.length !== 480 || dataBlock2.length !== 480 || dataBlock3.length !== 480 || dataBlock4.length !== 480) {
        alert('Cada bloco deve conter exatamente 480 valores.');
        return;
    }

    // Atualiza as tabelas base
    updateTableHeaders('horario_fixo1');
    updateTableHeaders('horario_fixo2');

    calcularEExibirMedia(dataBlock1, dataBlock2, 'horario_fixo1');
    calcularEExibirMedia(dataBlock3, dataBlock4, 'horario_fixo2');

    // Atualiza e preenche a tabela mesclada (somente cabeçalhos)
    updateTableHeaders('horario_fixo_mesclado', false);
    mesclarTabelas('horario_fixo1', 'horario_fixo2', 'horario_fixo_mesclado');


    document.getElementById('box-tables').classList.remove('hidden');
}

function calcularEExibirMedia(dataBlockA, dataBlockB, tableId) {
    const resultTable = document.getElementById(tableId);
    const rows = resultTable.rows;

    for (let i = 1, k = 0; i < rows.length; i++) { // Pula a linha do cabeçalho
        const cells = rows[i].cells;
        for (let j = 1; j < cells.length; j++) { // Pula os cabeçalhos das linhas
            const media = ((dataBlockA[k] + dataBlockB[k]) / 2).toFixed(2);
            cells[j].innerText = media;
            estilizarCelula(cells[j], media);
            k++;
        }
    }
}

function mesclarTabelas(tableId1, tableId2, tableIdMesclado) {
    const table1 = document.getElementById(tableId1);
    const table2 = document.getElementById(tableId2);
    const resultTable = document.getElementById(tableIdMesclado);

    const rows1 = table1.rows;
    const rows2 = table2.rows;

    // Inicia a mesclagem das tabelas, linha por linha
    for (let i = 1; i < rows1.length; i++) { // Pula a linha do cabeçalho
        // Adiciona linha da primeira tabela
        let row1 = resultTable.insertRow();
        for (let j = 0; j < rows1[i].cells.length; j++) {
            const cell = row1.insertCell();
            cell.innerText = rows1[i].cells[j].innerText;
            cell.className = rows1[i].cells[j].className;
        }

        // Adiciona linha da segunda tabela
        let row2 = resultTable.insertRow();
        for (let j = 0; j < rows2[i].cells.length; j++) {
            const cell = row2.insertCell();
            cell.innerText = rows2[i].cells[j].innerText;
            cell.className = rows2[i].cells[j].className;
        }

        // Adiciona uma linha em branco com a classe 'blank-row'
        let blankRow = resultTable.insertRow();
        blankRow.className = 'blank-row';
        blankRow.insertCell().innerText = '';
        for (let j = 1; j < rows1[i].cells.length; j++) {
            blankRow.insertCell();
        }
    }
}

function estilizarCelula(cell, media) {
    cell.className = ''; // Reseta a classe

    if (media < 40) {
        cell.classList.add('red');
    } else if (media >= 40 && media < 70) {
        cell.classList.add('orange');
    } else if (media >= 70 && media < 80) {
        cell.classList.add('blue');
    } else if (media >= 80 && media < 90) {
        cell.classList.add('darkblue');
    } else if (media >= 90) {
        cell.classList.add('violet');
    }
}
