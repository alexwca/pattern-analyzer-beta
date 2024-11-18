let chartUnderOver = null;
let chartAmbas = null;

document.getElementById('btn').addEventListener('click', function () {
    // Torna visÃ­vel a Ã¡rea de resultados
    const resultadoAnalise = document.getElementById('graficos');
    resultadoAnalise.style.display = 'block';

    // Chama a funÃ§Ã£o para gerar a tabela e os grÃ¡ficos
    gerarTabelaEGraficos();
});


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

    gerarTabela(minutos, mosaico, resultadosMercados);

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

        // Validar se a primeira coluna Ã© uma hora vÃ¡lida (formato HH)
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

function gerarTabela(minutos, mosaico, resultadosMercados) {
    const table = document.getElementById('horario_fixo');
    table.innerHTML = '';

    const headerRow = document.createElement('tr');
    const headerCell = document.createElement('th');
    headerCell.innerText = 'Hora';
    headerRow.appendChild(headerCell);

    minutos.forEach(minuto => {
        const th = document.createElement('th');
        th.innerText = `${minuto < 10 ? '0' + minuto : minuto}`;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    mosaico.forEach((row, rowIndex) => {
        const tableRow = document.createElement('tr');
        const hourCell = document.createElement('td');
        hourCell.innerText = row[0];
        hourCell.classList.add('firstCollumn')
        tableRow.appendChild(hourCell);

        row.slice(1).forEach((value, i) => {
            const cell = document.createElement('td');
            cell.innerText = value || '';

            const [time1, time2] = value.split('-').map(Number);
            if((time1 + time2) > 2) {
                cell.classList.add('green');
            } else {
                cell.classList.add('red');
            }

            tableRow.appendChild(cell);
        });

        table.appendChild(tableRow);
    });
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
                    maxRotation: 0, // Impede a rotaÃ§Ã£o excessiva das labels
                    autoSkip: true, // Pula labels automaticamente
                    stepSize: 5 // Ajusta o espaÃ§amento entre os pontos exibidos (alterar conforme necessÃ¡rio)
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