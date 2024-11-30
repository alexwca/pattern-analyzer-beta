let chartUnderOver = null;
let chartAmbas = null;

document.getElementById('btn').addEventListener('click', function () {
    const resultadoAnalise = document.getElementById('graficos');
    resultadoAnalise.style.display = 'block';
    gerarTabelaEGraficos();
});

const buttons = document.getElementsByClassName('btnTables');
const tables = ['tabelao25', 'tabelaambas'];

for (let index = 0; index < tables.length; index++) {

    buttons[index].addEventListener('click', () => {
        mostrarEsconderTabela(tables[index])
    })
}

const mercadosUnderOver = ['under25', 'over25'];
const mercadosAmbas = ['ambasNao', 'ambas'];

const todasCores = {
    under25: '#f53246',
    over25: '#6bf58b',
    ambas: '#6bf58b',
    ambasNao: '#f53246',
};

function gerarTabelaEGraficos() {
    const dataInput = document.getElementById('dataInput').value.trim();
    if (!dataInput) return;

    const liga = document.getElementById('ligaSelect').value;
    const minutos = gerarMinutosPorLiga(liga);
    const mosaico = sanitizarDados(dataInput);

    const resultadosMercados = {};
    [...mercadosUnderOver, ...mercadosAmbas].forEach(mercado => {
        resultadosMercados[mercado] = verificarResultadosMercado(mosaico, mercado);
    });

    const oscilacoesPorMercado = calcularOscilacaoPorMercadoEspecifico(resultadosMercados, ['over25', 'ambas']);

    gerarTabela(minutos, mosaico, resultadosMercados, oscilacoesPorMercado);

    // gerarTabela(minutos, mosaico, resultadosMercados);

    const dadosOscilacao = calcularOscilacaoPorMercado(mosaico, resultadosMercados);

    const labelsHoraMaisMinuto = gerarLabelsHoraMaisMinuto(minutos, mosaico);

    gerarTodosGraficos(dadosOscilacao, labelsHoraMaisMinuto);

}

function gerarMinutosPorLiga(liga) {
    switch (liga) {
        case 'copa':
        case 'super':
            return Array.from({ length: 20 }, (_, i) => 1 + i * 3);
        case 'euro':
            return Array.from({ length: 20 }, (_, i) => 2 + i * 3);
        case 'premier':
            return Array.from({ length: 20 }, (_, i) => i * 3);
        default:
            return [];
    }
}

function sanitizarDados(data) {
    return data.split('\n').map((row, rowIndex) => {
        const columns = row.trim().split(/\s+/);
        if (!columns[0] || isNaN(columns[0])) {
            console.warn(`Hora invÃ¡lida na linha ${rowIndex}: ${columns[0]}`);
        }
        return columns.map(value => value.replace('+', ''));
    });
}

function verificarResultadosMercado(mosaico, mercado) {
    return mosaico.map(row =>
        row.map(result => {
            if (!result) return false;
            const [time1, time2] = result.split('-').map(Number);
            switch (mercado) {
                case 'under25':
                    return time1 + time2 < 2.5;
                case 'over25':
                    return time1 + time2 >= 2.5;
                case 'ambas':
                    return time1 > 0 && time2 > 0;
                case 'ambasNao':
                    return !(time1 > 0 && time2 > 0);
            }
        })
    );
}

function calcularOscilacaoPorMercadoEspecifico(resultadosMercados, mercadosAlvo) {
    const oscilacoesMercado = {};

    mercadosAlvo.forEach(mercado => {
        let acumulado = 0;
        const oscilacoes = [];

        for (let rowIndex = resultadosMercados[mercado].length - 2; rowIndex >= 0; rowIndex--) {
            const currentRow = resultadosMercados[mercado][rowIndex].slice(1);
            const nextRow = resultadosMercados[mercado][rowIndex + 1].slice(1);

            currentRow.forEach((result, colIndex) => {
                const nextResult = nextRow[colIndex];

                if (result === nextResult) {
                    acumulado += 0; // Sem mudança
                } else {
                    acumulado += result ? 1 : -1; // Incremento ou decremento
                }

                if (!oscilacoes[rowIndex]) oscilacoes[rowIndex] = [];
                oscilacoes[rowIndex][colIndex] = acumulado; // Armazena a oscilação
            });
        }

        oscilacoesMercado[mercado] = oscilacoes;
    });

    return oscilacoesMercado;
}

function gerarContagensTabela(resultadosMercados, tabelas) {
    tabelas.forEach(mercadoTabela => {
        const table = document.getElementById(mercadoTabela);
        const linhas = table.querySelectorAll('tr');

        linhas.forEach((linha, rowIndex) => {
            // Ignora o cabeçalho
            if (rowIndex === 0) return;

            // Obtém as células da linha atual
            const cells = linha.querySelectorAll('td');
            const hora = cells[0].innerText;

            let overCount = 0;
            let subidaCount = 0;
            let lateralOverCount = 0;
            let descidaCount = 0;
            let lateralUnderCount = 0;

            // Faz as contagens com base nos resultadosMercados
            for (let colIndex = 1; colIndex < cells.length - 5; colIndex++) {
                const atualOver = resultadosMercados.over25[rowIndex - 1]?.[colIndex];
                const anteriorOver = resultadosMercados.over25[rowIndex]?.[colIndex];
                const atualAmbas = resultadosMercados.ambas[rowIndex - 1]?.[colIndex];
                const anteriorAmbas = resultadosMercados.ambas[rowIndex]?.[colIndex];

                // Porcentagem over
                if (atualOver) overCount++;

                // Subidas: Over25 em cima de Under25
                if (atualOver && !anteriorOver) subidaCount++;

                // Lateralizações Over25: Over25 em cima de Over25
                if (atualOver && anteriorOver) lateralOverCount++;

                // Descidas: Under25 em cima de Over25
                if (!atualOver && anteriorOver) descidaCount++;

                // Lateralizações Under25: Under25 em cima de Under25
                if (!atualOver && !anteriorOver) lateralUnderCount++;
            }

            // Atualiza as células extras para contagens
            const porcentagemCell = cells[cells.length - 5];
            porcentagemCell.innerText = `${((overCount / (cells.length - 6)) * 100).toFixed(0)}%`;

            const subidaCell = cells[cells.length - 4];
            subidaCell.innerText = subidaCount;

            const lateralOverCell = cells[cells.length - 3];
            lateralOverCell.innerText = lateralOverCount;

            const descidaCell = cells[cells.length - 2];
            descidaCell.innerText = descidaCount;

            const lateralUnderCell = cells[cells.length - 1];
            lateralUnderCell.innerText = lateralUnderCount;
        });
    });
}

function calcularPorcentagemColunas(mosaico, mercado, resultadosMercados) {
    const porcentagens = [];
    const totalLinhas = mosaico.length - 1;

    for (let colIndex = 1; colIndex <= 20; colIndex++) {
        let count = 0;

        for (let rowIndex = 1; rowIndex < mosaico.length; rowIndex++) {
            if (resultadosMercados[mercado] && resultadosMercados[mercado][rowIndex]) {
                const result = resultadosMercados[mercado][rowIndex][colIndex];
                if (result) {
                    count++;
                }
            }
        }
        const porcentagem = totalLinhas > 0 ? ((count / totalLinhas) * 100).toFixed(0) : 0;
        porcentagens.push(porcentagem);
    }

    return porcentagens;
}

function calcularPorcentagemPorBlocos(porcentagens) {
    const blocos = [];
    let soma = 0;

    porcentagens.forEach((porcentagem, index) => {
        soma += parseInt(porcentagem, 10); // Garante que seja tratado como número
        if ((index + 1) % 5 === 0) { // A cada 5 colunas, adiciona ao bloco
            blocos.push(soma / 5); // Calcula a média
            soma = 0; // Reseta a soma para o próximo bloco
        }
    });

    return blocos;
}

function calcularMediaPorcetagensLinhas(tabelaId) {
    const tabela = document.getElementById(tabelaId);
    const linhas = tabela.querySelectorAll('tr');
    let soma = 0;
    let contador = 0;

    linhas.forEach((linha, index) => {
        if (index > 1) {
            const celulaPorcentagem = linha.querySelector('td:nth-last-child(6)');
            if (celulaPorcentagem) {
                const valor = parseInt(celulaPorcentagem.innerText.replace('%', '').trim(), 10);
                if (!isNaN(valor)) {
                    soma += valor;
                    contador++;
                }
            }
        }
    });

    const media = contador > 0 ? `${Math.ceil((soma / contador).toFixed(2))}%` : 0;

    const mediaColunaPorcentagens = document.getElementById(`${tabelaId}mediaColunaPorcentagens`);
    mediaColunaPorcentagens.innerText = media;

}

function calcularMediaSubidas(tabelaId) {
    const tabela = document.getElementById(tabelaId);
    const linhas = Array.from(tabela.getElementsByClassName('subidasCell'));
    let soma = 0;
    let contador = 0;

    linhas.forEach((linha, index) => {

        if (index > 0) {
            const celulaSubida = linha.innerText;
            if (celulaSubida) {
                const valor = parseInt(celulaSubida.trim(), 10);

                if (!isNaN(valor)) {
                    soma += valor;
                    contador++;
                }
            }
        }
    });

    const media = contador > 0 ? `${Math.ceil((soma / (contador - 1)).toFixed(2))}` : 0;

    const mediaColunaSubidas = document.getElementById(`${tabelaId}mediaColunaSubidas`);
    mediaColunaSubidas.innerText = media;

}

function calcularMediaLateralizacaoOver(tabelaId) {
    const tabela = document.getElementById(tabelaId);
    const linhas = Array.from(tabela.getElementsByClassName('lateralizacoesOverCell'));
    let soma = 0;
    let contador = 0;

    linhas.forEach((linha, index) => {

        if (index > 0) {
            const celulaSubida = linha.innerText;
            if (celulaSubida) {
                const valor = parseInt(celulaSubida.trim(), 10);

                if (!isNaN(valor)) {
                    soma += valor;
                    contador++;
                }
            }
        }
    });

    const media = contador > 0 ? `${Math.ceil((soma / (contador - 1)).toFixed(2))}` : 0;

    const mediaColunaSubidas = document.getElementById(`${tabelaId}mediaColunaLateralizacoesOver`);
    mediaColunaSubidas.innerText = media;

}

function calcularMediaDescidas(tabelaId) {
    const tabela = document.getElementById(tabelaId);
    const linhas = Array.from(tabela.getElementsByClassName('descidasCell'));
    let soma = 0;
    let contador = 0;

    linhas.forEach((linha, index) => {

        if (index > 0) {
            const celulaSubida = linha.innerText;
            if (celulaSubida) {
                const valor = parseInt(celulaSubida.trim(), 10);

                if (!isNaN(valor)) {
                    soma += valor;
                    contador++;
                }
            }
        }
    });

    const media = contador > 0 ? `${Math.ceil((soma / (contador - 1)).toFixed(2))}` : 0;

    const mediaColunaSubidas = document.getElementById(`${tabelaId}mediaColunaDescidas`);
    mediaColunaSubidas.innerText = media;

}

function calcularMediaLateralizacoesUnder(tabelaId) {
    const tabela = document.getElementById(tabelaId);
    const linhas = Array.from(tabela.getElementsByClassName('lateralizacoesUnderCell'));
    let soma = 0;
    let contador = 0;

    linhas.forEach((linha, index) => {

        if (index > 0) {
            const celulaSubida = linha.innerText;
            if (celulaSubida) {
                const valor = parseInt(celulaSubida.trim(), 10);

                if (!isNaN(valor)) {
                    soma += valor;
                    contador++;
                }
            }
        }
    });

    const media = contador > 0 ? `${Math.ceil((soma / (contador - 1)).toFixed(2))}` : 0;

    const mediaColunaSubidas = document.getElementById(`${tabelaId}mediaColunaLateralizacoesUnder`);
    mediaColunaSubidas.innerText = media;

}

function calcularMediaGols(tabelaId) {
    const tabela = document.getElementById(tabelaId);
    const linhas = Array.from(tabela.getElementsByClassName('golsCell'));
    let soma = 0;
    let contador = 0;

    linhas.forEach((linha, index) => {
        if (index > 0 && index < linhas.length) {
            const celulaSubida = linha.innerText;
            if (celulaSubida) {
                const valor = parseInt(celulaSubida.trim(), 10);

                if (!isNaN(valor)) {
                    soma += valor;
                    contador++;
                }
            }
        }
    });

    const media = contador > 0 ? `${Math.ceil((soma / (contador)).toFixed(2))}` : 0;

    const mediaColunaSubidas = document.getElementById(`${tabelaId}mediaColunaGols`);
    mediaColunaSubidas.innerText = media;

}

function adicionarLinhaSomaGols(tabelaId, mosaico) {
    const tabela = document.getElementById(tabelaId);

    if (!mosaico || mosaico.length === 0) {
        console.warn('O mosaico está vazio.');
        return;
    }

    const somaGolsPorColuna = Array(20).fill(0); 

    mosaico.forEach((row, rowIndex) => {
        if (rowIndex > 0) {
            row.slice(1, 21).forEach((cell, colIndex) => {
                const valores = cell.split('-').map(Number); 
                if (valores.length === 2 && !isNaN(valores[0]) && !isNaN(valores[1])) {
                    somaGolsPorColuna[colIndex] += valores[0] + valores[1]; 
                }
            });
        }
    });

    const linhaSoma = document.createElement('tr');
    const headerCell = document.createElement('td');
    headerCell.innerText = '⚽';
    linhaSoma.appendChild(headerCell);

    somaGolsPorColuna.forEach(soma => {
        const cell = document.createElement('td');
        cell.innerText = soma || 0;
        cell.classList.add('somaGolsCell'); 
        linhaSoma.appendChild(cell);
    });

    const colunasExtras = 6; 
    for (let i = 0; i < colunasExtras; i++) {
        const emptyCell = document.createElement('td');
        linhaSoma.appendChild(emptyCell);
    }

    tabela.insertBefore(linhaSoma, tabela.querySelector('tr:nth-child(3)'));
}


function gerarTabela(minutos, mosaico, resultadosMercados, oscilacoesPorMercado) {

    const tabelas = ['tabelao25', 'tabelaambas'];

    tabelas.forEach((mercadoTabela, tabelaIndex) => {
        const mercado = tabelaIndex === 0 ? 'over25' : 'ambas';
        const table = document.getElementById(mercadoTabela);
        table.innerHTML = '';

        const porcentagens = calcularPorcentagemColunas(mosaico, mercado, resultadosMercados)
        const porcentagensBloco = calcularPorcentagemPorBlocos(porcentagens)

        const porcentagemBloco = document.createElement('tr');
        const porcentagemCellBloco = document.createElement('td');
        porcentagemCellBloco.classList.add('percentCell');
        porcentagemCellBloco.innerText = '%';
        porcentagemBloco.appendChild(porcentagemCellBloco);

        for (let index = 0; index < porcentagensBloco.length; index++) {
            const porcentagemCellsBloco = document.createElement('td');
            porcentagemCellsBloco.setAttribute('colspan', '5');
            porcentagemCellsBloco.innerText = `${porcentagensBloco[index]}%`;
            porcentagemCellsBloco.classList.add('percentCell');
            porcentagemCellsBloco.classList.add((porcentagensBloco[index] > 42) ? 'text-green' : 'text-red');
            porcentagemBloco.appendChild(porcentagemCellsBloco);
        }

        table.appendChild(porcentagemBloco)

        const porcentagemRow = document.createElement('tr');
        const porcentagemCell = document.createElement('td');
        porcentagemCell.classList.add('percentCell');
        porcentagemCell.innerText = '%';
        porcentagemRow.appendChild(porcentagemCell);

        for (let index = 0; index < porcentagens.length; index++) {
            const porcentagemCells = document.createElement('td');
            porcentagemCells.innerText = `${porcentagens[index]}%`;
            porcentagemCells.classList.add('percentCell');
            porcentagemCells.classList.add((porcentagens[index] > 42) ? 'text-green' : 'text-red');
            porcentagemRow.appendChild(porcentagemCells);
        }

        table.appendChild(porcentagemRow)

        const mediaColunaPorcentagens = document.createElement('td');
        mediaColunaPorcentagens.setAttribute('id', `${mercadoTabela}mediaColunaPorcentagens`);
        porcentagemRow.appendChild(mediaColunaPorcentagens);

        table.appendChild(porcentagemRow);

        const mediaColunaSubidas = document.createElement('td');
        mediaColunaSubidas.setAttribute('id', `${mercadoTabela}mediaColunaSubidas`);
        porcentagemRow.appendChild(mediaColunaSubidas);

        table.appendChild(porcentagemRow);

        const mediaColunaLateralizacoesOver = document.createElement('td');
        mediaColunaLateralizacoesOver.setAttribute('id', `${mercadoTabela}mediaColunaLateralizacoesOver`);
        porcentagemRow.appendChild(mediaColunaLateralizacoesOver);

        table.appendChild(porcentagemRow);

        const mediaColunaDescidas = document.createElement('td');
        mediaColunaDescidas.setAttribute('id', `${mercadoTabela}mediaColunaDescidas`);
        porcentagemRow.appendChild(mediaColunaDescidas);

        table.appendChild(porcentagemRow);

        const mediaColunaLateralizacoesUnder = document.createElement('td');
        mediaColunaLateralizacoesUnder.setAttribute('id', `${mercadoTabela}mediaColunaLateralizacoesUnder`);
        porcentagemRow.appendChild(mediaColunaLateralizacoesUnder);

        table.appendChild(porcentagemRow);

        const mediaColunaGols = document.createElement('td');
        mediaColunaGols.setAttribute('id', `${mercadoTabela}mediaColunaGols`);
        porcentagemRow.appendChild(mediaColunaGols);

        table.appendChild(porcentagemRow);

        const headerRow = document.createElement('tr');
        const headerCell = document.createElement('th');
        headerCell.innerText = 'Hora';
        headerRow.appendChild(headerCell);

        minutos.forEach(minuto => {
            const th = document.createElement('th');
            th.innerText = `${minuto < 10 ? '0' + minuto : minuto}`;
            headerRow.appendChild(th);
        });

        const icones = ['％', '⬆️', '↔️', '⬇️', '⇆', '⚽'];
        icones.forEach(icone => {
            const th = document.createElement('th');
            th.innerText = icone;
            headerRow.appendChild(th);
        });

        table.appendChild(headerRow);

        // Linhas
        mosaico.forEach((row, rowIndex) => {
            const tableRow = document.createElement('tr');
            const hourCell = document.createElement('td');
            hourCell.innerText = row[0] < 10 ? `0${row[0]}` : row[0];
            hourCell.classList.add('firstCollumn');
            tableRow.appendChild(hourCell);

            // Adiciona células para os resultados
            row.slice(1).forEach((value, colIndex) => {
                const cell = document.createElement('td');
                cell.innerText = value || '';

                // Cor para os mercados
                const [time1, time2] = value.split('-').map(Number);
                if (mercado === 'over25') {
                    if ((time1 + time2) > 2) {
                        cell.classList.add('green');
                    } else {
                        cell.classList.add('red');
                    }
                } else if (mercado === 'ambas') {
                    if (time1 > 0 && time2 > 0) {
                        cell.classList.add('green');
                    } else {
                        cell.classList.add('red');
                    }
                }

                if (oscilacoesPorMercado[mercado][rowIndex] && oscilacoesPorMercado[mercado][rowIndex][colIndex] !== undefined) {
                    const oscilacao = oscilacoesPorMercado[mercado][rowIndex][colIndex];
                    const spanOscilacao = document.createElement('span');
                    spanOscilacao.classList.add('pontosGraficos');
                    spanOscilacao.innerText = `p: ${oscilacao}`;
                    cell.appendChild(spanOscilacao);
                }

                tableRow.appendChild(cell);
            });

            // Preenche células vazias se a linha não tiver o número total de minutos
            const colunasRestantes = minutos.length - row.slice(1).length;
            for (let i = 0; i < colunasRestantes; i++) {
                const emptyCell = document.createElement('td');
                emptyCell.innerText = '';
                tableRow.appendChild(emptyCell);
            }

            // Adiciona as colunas adicionais ao final da linha
            const porcentagemMercadoCell = document.createElement('td');
            porcentagemMercadoCell.innerText = calcularPorcentagemLinha(rowIndex, resultadosMercados[mercado]);
            tableRow.appendChild(porcentagemMercadoCell);

            const subidasCell = document.createElement('td');
            subidasCell.classList.add('subidasCell');
            subidasCell.innerText = calcularSubidasLinha(rowIndex, resultadosMercados, mercado);
            tableRow.appendChild(subidasCell);

            const lateralizacoesOverCell = document.createElement('td');
            lateralizacoesOverCell.classList.add('lateralizacoesOverCell');
            lateralizacoesOverCell.innerText = calcularLateralizacaoVerde(rowIndex, resultadosMercados, mercado, mercado);
            tableRow.appendChild(lateralizacoesOverCell);

            const descidasCell = document.createElement('td');
            descidasCell.classList.add('descidasCell');
            descidasCell.innerText = calcularDescidasLinha(rowIndex, resultadosMercados, mercado);
            tableRow.appendChild(descidasCell);

            const lateralizacoesUnderCell = document.createElement('td');
            lateralizacoesUnderCell.classList.add('lateralizacoesUnderCell');
            lateralizacoesUnderCell.innerText = calcularLateralizacaoVermelho(rowIndex, resultadosMercados, mercado, mercado);
            tableRow.appendChild(lateralizacoesUnderCell);

            const golsCell = document.createElement('td');
            golsCell.classList.add('golsCell');
            golsCell.innerText = calcularGolsLinha(row);
            tableRow.appendChild(golsCell);

            table.appendChild(tableRow);

        });

        calcularMediaPorcetagensLinhas(mercadoTabela);
        calcularMediaSubidas(mercadoTabela);
        calcularMediaLateralizacaoOver(mercadoTabela);
        calcularMediaDescidas(mercadoTabela);
        calcularMediaLateralizacoesUnder(mercadoTabela);
        calcularMediaGols(mercadoTabela);
        adicionarLinhaSomaGols(mercadoTabela, mosaico);
        
    });

    ativarDestaquePontos();
}

// Funções auxiliares
function calcularPorcentagemLinha(rowIndex, resultadosMercado) {
    const total = resultadosMercado[rowIndex].slice(1).length;
    const ocorrencias = resultadosMercado[rowIndex].slice(1).filter(Boolean).length;
    return `${Math.round((ocorrencias / total) * 100)}%`;
}

function calcularSubidasLinha(rowIndex, resultadosMercados, mercado) {
    return calcularMovimentosLinha(rowIndex, resultadosMercados, mercado, true, false);
}

function calcularDescidasLinha(rowIndex, resultadosMercados, mercado) {
    return calcularMovimentosLinha(rowIndex, resultadosMercados, mercado, false, true);
}


function calcularLateralizacaoVerde(rowIndex, resultadosMercados, mercado) {
    return calcularMovimentosLinha(rowIndex, resultadosMercados, mercado, true, true);
}

function calcularLateralizacaoVermelho(rowIndex, resultadosMercados, mercado) {
    return calcularMovimentosLinha(rowIndex, resultadosMercados, mercado, false, false);
}

// function calcularLateralizacoesLinha(rowIndex, resultadosMercados, mercadoAtual, mercadoComparado) {
//     return calcularMovimentosLinha(rowIndex, resultadosMercados, mercadoAtual, mercadoComparado, mercadoComparado);
// }

function calcularGolsLinha(row) {
    return row.slice(1).reduce((total, value) => {
        const [time1, time2] = value.split('-').map(Number);
        return total + time1 + time2;
    }, 0);
}

function calcularMovimentosLinha(rowIndex, resultadosMercados, mercado, condicao1, condicao2) {
    let contador = 0;
    const currentRow = resultadosMercados[mercado][rowIndex];
    const nextRow = resultadosMercados[mercado][rowIndex + 1];

    if (!nextRow) return contador;

    currentRow.slice(1).forEach((result, colIndex) => {
        const nextResult = nextRow[colIndex + 1];
        if ((result === condicao1) && (nextResult === condicao2)) {
            contador++;
        }
    });

    return contador;
}

function gerarDadosContagem(resultados) {

    console.log(resultados)

}

function calcularOscilacaoPorMercado(mosaico, resultadosMercados) {

    return [...mercadosUnderOver, ...mercadosAmbas].map(mercado => {
        let acumulado = 0;
        const oscilacoes = [];

        for (let rowIndex = mosaico.length - 2; rowIndex >= 0; rowIndex--) {
            const currentRow = resultadosMercados[mercado][rowIndex].slice(1);
            const nextRow = resultadosMercados[mercado][rowIndex + 1].slice(1);

            currentRow.forEach((result, colIndex) => {
                const nextResult = nextRow[colIndex];

                if (result === nextResult) {
                    acumulado += 0;

                } else {
                    acumulado += result ? 1 : -1;
                }
                oscilacoes.push(acumulado);
            });
        }

        return {
            mercado,
            oscilacoes
        };
    });
}

function gerarLabelsHoraMaisMinuto(minutos, mosaico) {
    const labels = [];

    for (let rowIndex = mosaico.length - 2; rowIndex >= 0; rowIndex--) {
        const currentRow = mosaico[rowIndex].slice(1);
        const hora = mosaico[rowIndex][0];

        for (let label = 0; label < currentRow.length; label++) {
            labels.push(`${hora < 10 ? '0' + hora : hora}:${minutos[label] < 10 ? '0' + minutos[label] : minutos[label]}`);
        }

    }

    return labels;
}

function ativarDestaquePontos() {
    const cellsWithPoints = document.querySelectorAll('td span.pontosGraficos');

    cellsWithPoints.forEach(span => {
        span.addEventListener('click', function () {
            const ponto = this.innerText; // Ponto do span clicado
            const isHighlighted = this.parentElement.classList.contains('highlight'); // Verifica se já está destacado

            if (isHighlighted) {
                // Remove o destaque de todas as células com o mesmo ponto
                const allCells = document.querySelectorAll('td span.pontosGraficos');
                allCells.forEach(otherSpan => {
                    if (otherSpan.innerText === ponto) {
                        otherSpan.parentElement.classList.remove('highlight');
                    }
                });
            } else {
                // Remove os destaques globais
                document.querySelectorAll('.highlight').forEach(el => {
                    el.classList.remove('highlight');
                });

                // Adiciona o destaque nas células com o mesmo ponto
                const allCells = document.querySelectorAll('td span.pontosGraficos');
                allCells.forEach(otherSpan => {
                    if (otherSpan.innerText === ponto) {
                        otherSpan.parentElement.classList.add('highlight');
                    }
                });
            }
        });
    });
}



function gerarTodosGraficos(dadosOscilacao, labelsHoraMaisMinuto) {
    geraGraficosPorCategoria(dadosOscilacao, mercadosUnderOver, 'graficoUnderOver', 'controlesUnderOver', labelsHoraMaisMinuto);
    geraGraficosPorCategoria(dadosOscilacao, mercadosAmbas, 'graficoAmbas', 'controlesAmbas', labelsHoraMaisMinuto);
}

function geraGraficosPorCategoria(dadosOscilacao, mercadosIniciais, canvasId, controlesId, labels) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    if (canvasId === 'graficoUnderOver' && chartUnderOver) {
        chartUnderOver.destroy();
        chartUnderOver = null;
    } else if (canvasId === 'graficoAmbas' && chartAmbas) {
        chartAmbas.destroy();
        chartAmbas = null;
    }

    const datasets = dadosOscilacao
        .filter(dados => mercadosIniciais.includes(dados.mercado))
        .map(dados => ({
            label: dados.mercado.toUpperCase(),
            data: dados.oscilacoes,
            borderColor: todasCores[dados.mercado],
            backgroundColor: todasCores[dados.mercado],
            fill: false,
            tension: 0.4,
            pointStyle: 'circle',
            pointRadius: 3.5,
            pointHoverRadius: 4,
            pointBackgroundColor: 'transparent',
            pointBorderColor: todasCores[dados.mercado]
        }));

    const data = {
        labels,
        datasets
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top'
            },
            tooltip: {
                callbacks: {
                    label: function (tooltipItem) {
                        return ` ${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'HorÃ¡rio'
                },
                ticks: {
                    maxRotation: 0,
                    autoSkip: true,
                    stepSize: 5
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Valores Acumulados'
                }
            }
        }
    };


    const chart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });

    if (canvasId === 'graficoUnderOver') {
        chartUnderOver = chart;
    } else if (canvasId === 'graficoAmbas') {
        chartAmbas = chart;
    }

    configurarControleDeMercados(dadosOscilacao, mercadosIniciais, chart, controlesId);
}

function configurarControleDeMercados(dadosOscilacao, mercadosIniciais, chart, controlesId) {
    const controlesContainer = document.getElementById(controlesId);
    controlesContainer.innerHTML = '';

    dadosOscilacao.forEach(dados => {
        const mercado = dados.mercado;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `mercado-${mercado}-${controlesId}`;
        checkbox.checked = mercadosIniciais.includes(mercado);

        const label = document.createElement('label');
        label.htmlFor = `mercado-${mercado}-${controlesId}`;
        label.textContent = mercado.toUpperCase();

        checkbox.addEventListener('change', () => {
            atualizarGrafico(dadosOscilacao, chart, controlesId);
        });

        const container = document.createElement('div');
        container.style.marginRight = '10px';
        container.style.display = 'inline-block';
        container.appendChild(checkbox);
        container.appendChild(label);
        controlesContainer.appendChild(container);
    });
}

function atualizarGrafico(dadosOscilacao, chart, controlesId) {
    const mercadosSelecionados = Array.from(document.querySelectorAll(`#${controlesId} input:checked`)).map(
        input => input.id.replace(`mercado-`, '').replace(`-${controlesId}`, '')
    );

    const datasets = dadosOscilacao
        .filter(dados => mercadosSelecionados.includes(dados.mercado))
        .map(dados => ({
            label: dados.mercado.toUpperCase(),
            data: dados.oscilacoes,
            borderColor: todasCores[dados.mercado],
            backgroundColor: todasCores[dados.mercado],
            fill: false,
            tension: 0.4,
            pointStyle: 'circle',
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: 'transparent',
            pointBorderColor: todasCores[dados.mercado]
        }));

    chart.data.datasets = datasets;
    chart.update();
}

function mostrarEsconderTabela(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        if (element.style.display === 'none' || getComputedStyle(element).display === 'none') {
            element.style.display = 'table';
        } else {
            element.style.display = 'none';
        }
    } else {
        console.error(`Elemento com ID "${elementId}" não encontrado.`);
    }

}