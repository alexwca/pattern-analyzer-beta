let chartAcumulada = null;  // Definir globalmente para armazenar a instância do gráfico
let chartContagem = null;  // Variável global para o gráfico combinado
let mosaico = [];
let resultadoMercado = [];
let minutos = [];

function gerarTabelaEGraficos() {
    // Obter os dados do textarea
    const dataInput = document.getElementById('dataInput').value.trim();

    // Função para sanitizar os dados (remover "+" e normalizar resultados como "5+")
    function sanitizarDados(data) {
        return data.split('\n').map(row => row.trim().split(/\s+/).map(value => value.replace('+', '')));
    }

    // Sanitizar o mosaico de dados logo após a entrada do usuário
    const mosaico = sanitizarDados(dataInput);

    // Obter o campeonato selecionado
    const campeonato = document.getElementById('selectCampeonato').value;

    // Obter o mercado selecionado
    const mercado = document.getElementById('selectMercado').value;

    // Definir o minuto inicial com base no campeonato selecionado
    let minutoInicial = campeonato === 'copa' || campeonato === 'super' ? 1 : (campeonato === 'euro' ? 2 : 0);

    // Lista dos minutos dos jogos (incrementos de 3 minutos a partir do minuto inicial)
    const minutos = Array.from({ length: 20 }, (_, i) => minutoInicial + i * 3);

    // Pegar a tabela onde os dados serão exibidos
    const table = document.getElementById('horario_fixo');

    // Limpar qualquer conteúdo anterior da tabela
    table.innerHTML = '';

    // Criar uma linha de cabeçalho
    const headerRow = document.createElement('tr');
    const headerCell = document.createElement('th');
    headerCell.innerText = 'Hora';
    headerRow.appendChild(headerCell);

    minutos.forEach(minuto => {
        const th = document.createElement('th');
        th.innerText = `${minuto < 10 ? '0' + minuto : minuto}`;
        headerRow.appendChild(th);
    });

    // Adicionar colunas com ícones
    const icones = ['⬆️', '↔️', '⬇️', '⇆'];
    icones.forEach(icone => {
        const th = document.createElement('th');
        th.innerText = icone;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Array para armazenar a oscilação acumulada e os dados de hora/minuto para o gráfico
    let oscilacaoAcumulada = [];
    let dadosGrafico = [];
    let valorOscilacao = 0;
    let comparacoesResultados = []; // Array para armazenar os resultados comparados

    const mercados = {

        under15: result => {
            if (!result) return false;
            const [time1, time2] = result.split('-').map(Number);
            return time1 + time2 < 1.5;
        },
        ambasTimesMarcam: result => {
            if (!result) return false;
            const [time1, time2] = result.split('-').map(Number);
            return time1 > 0 && time2 > 0;
        },
        over25: result => {
            if (!result) return false;
            const [time1, time2] = result.split('-').map(Number);
            return time1 + time2 > 2.5;
        },
        over35: result => {
            if (!result) return false;
            const [time1, time2] = result.split('-').map(Number);
            return time1 + time2 > 3.5;
        },
        over5: result => {
            if (!result) return false;
            const [time1, time2] = result.split('-').map(Number);
            return time1 + time2 >= 5;
        },
        casa: result => {
            if (!result) return false;
            const [time1, time2] = result.split('-').map(Number);
            return time1 > time2;
        },
        visitante: result => {
            if (!result) return false;
            const [time1, time2] = result.split('-').map(Number);
            return time1 < time2;
        },
        empate: result => {
            if (!result) return false;
            const [time1, time2] = result.split('-').map(Number);
            return time1 === time2;
        },
        casanao: result => {
            if (!result) return false;
            const [time1, time2] = result.split('-').map(Number);
            return time1 === 0;
        },
        visitantenao: result => {
            if (!result) return false;
            const [time1, time2] = result.split('-').map(Number);
            return time2 === 0;
        }
        // Adicione mais opções de mercado conforme necessário
    };

    // Função para escolher a verificação do mercado com base na seleção
    // Função para verificar o mercado
    function verificarMercado(mercado, result) {
        if (!result) return false;
        const [time1, time2] = result.split('-').map(Number);

        switch (mercado) {
            case 'under15':
                return time1 + time2 < 1.5;
            case 'ambas':
                return time1 > 0 && time2 > 0;
            case 'over25':
                return time1 + time2 > 2.5;
            case 'over35':
                return time1 + time2 > 3.5;
            case 'over5':
                return time1 + time2 >= 5;
            case 'casa':
                return time1 > time2;
            case 'visitante':
                return time1 < time2;
            case 'empate':
                return time1 === time2;
            case 'casanao':
                return time1 === 0;
            case 'visitantenao':
                return time2 === 0;
            default:
                return false;
        }
    }


    // Mapeia os dados para os valores de mercado selecionados
    const resultadoMercado = mosaico.map(row =>
        row.map(result => verificarMercado(mercado, result))
    );

    // Apresentar os dados na tabela conforme foram inseridos (de cima para baixo)
    mosaico.forEach((row, rowIndex) => {
        const tableRow = document.createElement('tr');
        const hourCell = document.createElement('td');
        hourCell.innerText = `${row[0]}`;
        tableRow.appendChild(hourCell);

        let subidas = 0, descidas = 0, lateralSimOver = 0, lateralNaoUnder = 0;

        for (let i = 1; i <= minutos.length; i++) {
            const cell = document.createElement('td');
            cell.innerText = row[i] || '';  // Preencher vazio se o dado estiver faltando

            // Coloração conforme o mercado
            const isPositiveMarket = resultadoMercado[rowIndex][i];
            cell.classList.add(isPositiveMarket ? 'green' : 'red');
            tableRow.appendChild(cell);

            // Atualizar contagens
            const nextRow = mosaico[rowIndex + 1] || [];
            const isPositiveNextMarket = resultadoMercado[rowIndex + 1] ? resultadoMercado[rowIndex + 1][i] : null;

            if (isPositiveMarket === isPositiveNextMarket) {
                if (isPositiveMarket) {
                    lateralSimOver++;
                } else {
                    lateralNaoUnder++;
                }
            } else {
                if (isPositiveMarket) {
                    subidas++;
                } else {
                    descidas++;
                }
            }
        }

        // Adicionar colunas com as contagens (subidas, descidas, lateralizações)
        const subidasCell = document.createElement('td');
        subidasCell.innerText = subidas;
        tableRow.appendChild(subidasCell);

        const lateralSimOverCell = document.createElement('td');
        lateralSimOverCell.innerText = lateralSimOver;
        tableRow.appendChild(lateralSimOverCell);

        const descidasCell = document.createElement('td');
        descidasCell.innerText = descidas;
        tableRow.appendChild(descidasCell);

        const lateralNaoUnderCell = document.createElement('td');
        lateralNaoUnderCell.innerText = lateralNaoUnder;
        tableRow.appendChild(lateralNaoUnderCell);

        table.appendChild(tableRow);
    });

    let acumuladoMercado = 0;

    // Comparação das linhas de baixo para cima (para o gráfico)
    for (let rowIndex = mosaico.length - 2; rowIndex >= 0; rowIndex--) {
        const currentRow = mosaico[rowIndex];
        const nextRow = mosaico[rowIndex + 1];

        // Garantir que currentRow e nextRow são válidos e que têm dados
        if (!currentRow || !nextRow || currentRow.length === 0 || nextRow.length === 0) {
            continue; // Pular linhas vazias ou incompletas
        }

        const currentMarket = resultadoMercado[rowIndex];
        const nextMarket = resultadoMercado[rowIndex + 1];

        let subidas = 0, descidas = 0, lateralSimOver = 0, lateralNaoUnder = 0;

        // Iterar sobre cada jogo
        for (let i = 1; i <= minutos.length; i++) {
            let isPositiveMarket = currentMarket[i];
            let isPositiveNextMarket = nextMarket[i];

            // Verificar se existem dados válidos para o jogo
            if (!currentRow[i] || !nextRow[i]) {
                continue;  // Pular jogos sem dados
            }

            // Atualizar a oscilação acumulada
            if (isPositiveMarket === isPositiveNextMarket) {
                if (isPositiveMarket) {
                    lateralSimOver++;
                } else {
                    lateralNaoUnder++;
                }
            } else {
                if (isPositiveMarket) {
                    subidas++;
                } else {
                    descidas++;
                }
                valorOscilacao += isPositiveMarket ? 1 : -1;
            }

            // Armazenar a oscilação e a hora/minuto do ponto
            oscilacaoAcumulada.push(valorOscilacao);
            dadosGrafico.push({
                oscilacao: valorOscilacao,
                hora: currentRow[0],  // Hora do jogo atual
                minuto: minutos[i - 1],  // Minuto do jogo específico
                ocorrenciasMercado: acumuladoMercado  // Quantas vezes o mercado ocorreu até o ponto atual
            });

            // Armazenar os resultados comparados
            comparacoesResultados.push({ current: currentRow[i], previous: nextRow[i] });
        }
    }

    // Capturar o valor do ponto mais recente
    const pontoMaisRecente = oscilacaoAcumulada[oscilacaoAcumulada.length - 1];

    // Encontre o ponto mais alto e o mais baixo
    const maxValor = Math.max(...oscilacaoAcumulada);
    const minValor = Math.min(...oscilacaoAcumulada);
    const maxIndex = oscilacaoAcumulada.indexOf(maxValor);
    const minIndex = oscilacaoAcumulada.indexOf(minValor);

    // Verificar se o gráfico anterior existe e destruir
    if (chartAcumulada !== null) {
        chartAcumulada.destroy();
    }

    // Gerar o gráfico de contagem acumulada com ApexCharts
    var optionsAcumulada = {
        chart: {
            type: 'line',
            height: 350,
            zoom: { enabled: true },
            toolbar: { tools: { pan: true, zoom: false } }
        },
        stroke: { width: 1 },
        series: [{ name: 'Oscilação Acumulada', data: oscilacaoAcumulada }],
        xaxis: {
            categories: dadosGrafico.map(d => `${d.hora < 10 ? '0' + d.hora : d.hora}:${d.minuto < 10 ? '0' + d.minuto : d.minuto}`),  // Formatar a hora e o minuto
            tickAmount: Math.min(dadosGrafico.length, 80)  // Mostrar apenas algumas labels para não sobrecarregar
        },
        yaxis: { title: { text: 'Oscilação' } },
        annotations: {
            yaxis: [
                { y: 0, borderColor: '#FF0000', label: { text: '', style: { color: "#FF0000", background: "#FFF" } } },
                { y: pontoMaisRecente, borderColor: '#00FF00', label: { text: '', style: { color: "#00FF00", background: "#FFF" } } }
            ],
            points: [
                { x: maxIndex, y: maxValor, marker: { size: 6 }, label: { text: `Máximo: ${maxValor}` } },
                { x: minIndex, y: minValor, marker: { size: 6 }, label: { text: `Mínimo: ${minValor}` } }
            ]
        },
        markers: {
            size: 1.7,  // Tamanho dos pontos no gráfico
            colors: ['#fff'],  // Cor dos pontos
            strokeColors: '#2980b9',  // Cor da borda do ponto
            strokeWidth: 1,  // Largura da borda do ponto
            hover: {
                size: 6  // Tamanho do ponto ao passar o mouse
            }
        },
        tooltip: {
            custom: function ({ dataPointIndex }) {
                const { hora, minuto, oscilacao } = dadosGrafico[dataPointIndex];
                const { current, previous } = comparacoesResultados[dataPointIndex];
                return `<div style="padding:5px;">
                            <strong>Hora:</strong> ${hora}:${minuto < 10 ? '0' + minuto : minuto}<br>
                            <strong>Operacional:</strong> ${current || "N/A"}<br>
                            <strong>Comparativa:</strong> ${previous || "N/A"}<br>
                            <strong>Ponto no gráfico:</strong> ${oscilacao}<br>
                        </div>`;
            }
        }
    };

    chartAcumulada = new ApexCharts(document.querySelector("#graficoContagemAcumulada"), optionsAcumulada);
    chartAcumulada.render();

    gerarGraficosCombinados(mosaico);
}



function gerarGraficosCombinados(mosaico) {
    // Arrays para armazenar as contagens de subidas, descidas e lateralizações
    let subidasArray = [];
    let descidasArray = [];
    let lateralSimOverArray = [];
    let lateralNaoUnderArray = [];
    let horaMinutoLabels = [];


    // Percorrer a matriz de cima para baixo (última linha para a primeira)
    for (let rowIndex = 0; rowIndex < mosaico.length - 1; rowIndex++) {
        const currentRow = mosaico[rowIndex];
        const nextRow = mosaico[rowIndex + 1];
        const currentMarket = resultadoMercado[rowIndex];
        const nextMarket = resultadoMercado[rowIndex + 1];

        let subidas = 0, descidas = 0, lateralSimOver = 0, lateralNaoUnder = 0;

        // Iterar sobre cada jogo
        for (let i = 1; i <= minutos.length; i++) {
            const isPositiveMarket = currentMarket[i];
            const isPositiveNextMarket = nextMarket[i];

            // Contagem de subidas, descidas e lateralizações
            if (isPositiveMarket === isPositiveNextMarket) {
                if (isPositiveMarket) {
                    lateralSimOver++;
                } else {
                    lateralNaoUnder++;
                }
            } else {
                if (isPositiveMarket) {
                    subidas++;
                } else {
                    descidas++;
                }
            }
        }

        // Adicionar as contagens às arrays
        subidasArray.push(subidas);
        descidasArray.push(descidas);
        lateralSimOverArray.push(lateralSimOver);
        lateralNaoUnderArray.push(lateralNaoUnder);

        // Adicionar a label da hora correspondente
        horaMinutoLabels.push(`Hora ${currentRow[0]}`);
    }


    // **INVERTER** as contagens e as labels para leitura correta de baixo para cima
    subidasArray.reverse();
    descidasArray.reverse();
    lateralSimOverArray.reverse();
    lateralNaoUnderArray.reverse();
    horaMinutoLabels.reverse();

    // Verificar se o gráfico anterior existe e destruí-lo
    if (chartContagem !== null) {
        chartContagem.destroy();
    }

    // Gerar o gráfico combinado com todas as contagens
    var optionsContagem = {
        chart: {
            type: 'line',  // Gráfico de linha
            height: 400,
            stacked: false,
            zoom: {
                enabled: true
            }
        },
        stroke: {
            width: [2, 2, 2, 2], // Largura das linhas de cada série
            curve: 'straight' // linhas - stepline, smooth, straight
        },
        colors: ['#00FF00', '#FF0000', '#0000FF', '#FFFF00'], // Exemplo com vermelho, verde, azul e amarelo
        series: [
            {
                name: 'Subidas',
                data: subidasArray
            },
            {
                name: 'Descidas',
                data: descidasArray
            },
            {
                name: 'Lateralizações Sim/Over',
                data: lateralSimOverArray
            },
            {
                name: 'Lateralizações Não/Under',
                data: lateralNaoUnderArray
            }
        ],
        xaxis: {
            categories: horaMinutoLabels // Exibir as labels da hora
        },
        yaxis: {
            title: {
                text: 'Contagens'
            }
        },
        tooltip: {
            shared: true,
            intersect: false
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            floating: true,
            offsetY: -25,
            offsetX: -5
        }
    };

    // Renderizar o gráfico dentro da div graficoContagemLinha
    chartContagem = new ApexCharts(document.querySelector("#graficoContagemLinha"), optionsContagem);
    chartContagem.render();
}
