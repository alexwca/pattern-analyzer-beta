document.addEventListener('DOMContentLoaded', () => {
    // Não precisamos chamar updateTableHeaders() aqui, pois isso será feito ao clicar no botão.
});

function updateTableHeaders() {
    const competition = document.getElementById('competition').value;
    const resultTable = document.getElementById('horario_fixo');
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

    // Gera as linhas da tabela
    for (let i = 23; i >= 0; i--) {
        const row = resultTable.insertRow();
        const cell = row.insertCell();
        cell.innerText = i.toString().padStart(2, '0');
        for (let j = 0; j < 20; j++) {
            row.insertCell(); // Cria células vazias
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

    // Itera pelas linhas da tabela, inserindo duas linhas em branco após cada linha de dados
    for (let i = 1, k = 0; i < rows.length; i++) { // Pula a linha do cabeçalho
        const cells = rows[i].cells;
        for (let j = 1; j < cells.length; j++) { // Pula os cabeçalhos das linhas
            const media = ((dataBlock1[k] + dataBlock2[k]) / 2).toFixed(2);
            cells[j].innerText = media;
            cells[j].className = ''; // Reseta a classe

            if (media < 40) {
                cells[j].classList.add('red');
            } else if (media >= 40 && media < 70) {
                cells[j].classList.add('orange');
            } else if (media >= 70 && media < 80) {
                cells[j].classList.add('blue');
            } else if (media >= 80 && media < 90) {
                cells[j].classList.add('darkblue');
            } else if (media >= 90) {
                cells[j].classList.add('violet');
            }
            k++;
        }

        // Adiciona duas linhas em branco após a linha atual
        if (i < rows.length - 1) { // Evita adicionar após a última linha
            const blankRow1 = resultTable.insertRow(i + 1);
            for (let j = 0; j < cells.length; j++) {
                blankRow1.insertCell();
            }

            const blankRow2 = resultTable.insertRow(i + 2);
            for (let j = 0; j < cells.length; j++) {
                blankRow2.insertCell();
            }

            // Incrementa o índice para pular as linhas em branco
            i += 2;
        }
    }
}
