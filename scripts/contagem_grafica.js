let chartAcumulada = null;  // Definir globalmente para armazenar a instância do gráfico
let chartContagem = null;  // Variável global para o gráfico combinado
let mosaico = [];
let resultadoMercado = [];
let minutos = [];

// Função principal para gerar a tabela e os gráficos
function gerarTabelaEGraficos() {
    // Obter os dados do textarea
    const dataInput = document.getElementById('dataInput').value.trim();
    if (!dataInput) {
        return;
    }

    // Pegar o valor do select que define quantas linhas comparar
    const linhasComparacao = parseInt(document.getElementById('linhaComparacao').value);  // Select que define quantas linhas comparar

    // Função para sanitizar os dados (remover "+" e normalizar resultados como "5+")
    function sanitizarDados(data) {
        return data.split('\n').map(row => row.trim().split(/\s+/).map(value => value.replace('+', '')));
    }

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
    table.innerHTML = '';  // Limpar qualquer conteúdo anterior da tabela

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
    const icones = ['％', '⬆️', '↔️', '⬇️', '⇆', '⚽'];
    icones.forEach(icone => {
        const th = document.createElement('th');
        th.innerText = icone;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    let oscilacaoAcumulada = [];
    let dadosGrafico = [];
    let valorOscilacao = 0;
    let comparacoesResultados = [];
    let acumuladoMercado = 0;  // Inicializando a variável

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

    const resultadoMercado = mosaico.map(row => row.map(result => verificarMercado(mercado, result)));

    let subidasArray = [];
    let descidasArray = [];
    let lateralSimOverArray = [];
    let lateralNaoUnderArray = [];
    let horaLabels = [];

    mosaico.forEach((row, rowIndex) => {
        const tableRow = document.createElement('tr');
        const hourCell = document.createElement('td');
        hourCell.innerText = `${row[0]}`;
        tableRow.appendChild(hourCell);

        let subidas = 0, descidas = 0, lateralSimOver = 0, lateralNaoUnder = 0, totalGols = 0, totalJogos = 0;

        for (let i = 1; i <= minutos.length; i++) {
            const cell = document.createElement('td');
            cell.innerText = row[i] || '';

            const isPositiveMarket = resultadoMercado[rowIndex][i];
            const nextRow = mosaico[rowIndex + 1] || [];
            const isPositiveNextMarket = resultadoMercado[rowIndex + 1] ? resultadoMercado[rowIndex + 1][i] : null;

            if (row[i]) {
                cell.classList.add(isPositiveMarket ? 'green' : 'red');

                totalJogos++;

                const [time1, time2] = row[i].split('-').map(Number);
                totalGols += (time1 + time2);
            }

            tableRow.appendChild(cell);

            // Continuar a contagem apenas se os resultados existirem para a linha atual e a próxima
            if (row[i] && nextRow[i]) {
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

        }

        // Adicionar colunas com as contagens (subidas, descidas, lateralizações)
        const porcentagem = document.createElement('td');
        porcentagem.title = "Porcentagem"
        porcentagem.innerText = `${((subidas + lateralSimOver) / totalJogos * 100).toFixed(0)}%`;
        tableRow.appendChild(porcentagem);

        const subidasCell = document.createElement('td');
        subidasCell.title = "Subidas"
        subidasCell.innerText = subidas;
        tableRow.appendChild(subidasCell);

        const lateralSimOverCell = document.createElement('td');
        lateralSimOverCell.title = "Lateralizações Green"
        lateralSimOverCell.innerText = lateralSimOver;
        tableRow.appendChild(lateralSimOverCell);

        const descidasCell = document.createElement('td');
        descidasCell.title = "Quedas"
        descidasCell.innerText = descidas;
        tableRow.appendChild(descidasCell);

        const lateralNaoUnderCell = document.createElement('td');
        lateralNaoUnderCell.title = "Lateralizações Red"
        lateralNaoUnderCell.innerText = lateralNaoUnder;
        tableRow.appendChild(lateralNaoUnderCell);

        const totalGolsCell = document.createElement('td');
        totalGolsCell.title = "Total de Gols";
        totalGolsCell.innerText = totalGols;
        tableRow.appendChild(totalGolsCell);

        table.appendChild(tableRow);


        subidasArray.push(subidas);
        descidasArray.push(descidas);
        lateralSimOverArray.push(lateralSimOver);
        lateralNaoUnderArray.push(lateralNaoUnder);
    });

    // Comparação das linhas com base no select escolhido pelo usuário (linhasComparacao)
    for (let rowIndex = mosaico.length - 1 - linhasComparacao; rowIndex >= 0; rowIndex--) {
        const currentRow = mosaico[rowIndex];
        const nextRow = mosaico[rowIndex + linhasComparacao];  // Comparando com o número de linhas selecionado

        // Garantir que currentRow e nextRow são válidos e que têm dados
        if (!currentRow || !nextRow || currentRow.length === 0 || nextRow.length === 0) {
            continue; // Pular linhas vazias ou incompletas
        }

        const currentMarket = resultadoMercado[rowIndex];
        const nextMarket = resultadoMercado[rowIndex + linhasComparacao];  // Comparação com o número de linhas

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

        horaLabels.push(currentRow[0]);
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
            height: 250,
            zoom: { enabled: true },
            toolbar: { tools: { pan: true, zoom: true } }
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

    gerarGraficosCombinados(horaLabels, subidasArray, descidasArray, lateralSimOverArray, lateralNaoUnderArray);
}





function gerarGraficosCombinados(horas, subidas, descidas, lateralGreen, lateralRed) {

    subidas = subidas.slice(1, -1).reverse();
    descidas = descidas.slice(1, -1).reverse();
    lateralGreen = lateralGreen.slice(1, -1).reverse();
    lateralRed = lateralRed.slice(1, -1).reverse();
    horas.pop();

    // Verificar se o gráfico anterior existe e destruir
    if (chartContagem !== null) {
        chartContagem.destroy();
    }


    var optionsContagem = {
        chart: {
            type: 'line',
            height: 250,
            stacked: false,
            zoom: { enabled: false },
            toolbar: { tools: { pan: true, zoom: false } }
        },
        stroke: {
            width: [2, 2, 2, 2],
            curve: 'straight'
        },
        colors: ['#28a745', '#dc3545', '#007bff', '#fd7e14'],
        series: [
            { name: 'Subidas', data: subidas },
            { name: 'Descidas', data: descidas },
            { name: 'Lateralizações Sim/Over', data: lateralGreen },
            { name: 'Lateralizações Não/Under', data: lateralRed }
        ],
        xaxis: { categories: horas },
        yaxis: { title: { text: 'Contagens' } },
        // tooltip: { shared: true, intersect: false },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            floating: true,
            offsetY: -25,
            offsetX: -5
        },
        markers: {
            size: 2.5,  // Tamanho dos pontos no gráfico
            colors: ['#fff'],  // Cor dos pontos
            strokeColors: '#000000',  // Cor da borda do ponto
            strokeWidth: 1,  // Largura da borda do ponto
            hover: {
                size: 6  // Tamanho do ponto ao passar o mouse
            }
        }
    };

    chartContagem = new ApexCharts(document.querySelector("#graficoContagemLinha"), optionsContagem);
    chartContagem.render();

    // Funções para mostrar/ocultar as séries ao clicar nos botões
    document.getElementById("toggleSubidas").addEventListener("click", function () {
        if (this.classList.contains("hidden")) {
            chartContagem.showSeries("Subidas");
            this.classList.remove("hidden");
        } else {
            chartContagem.hideSeries("Subidas");
            this.classList.add("hidden");
        }
    });

    document.getElementById("toggleDescidas").addEventListener("click", function () {
        if (this.classList.contains("hidden")) {
            chartContagem.showSeries("Descidas");
            this.classList.remove("hidden");
        } else {
            chartContagem.hideSeries("Descidas");
            this.classList.add("hidden");
        }
    });

    document.getElementById("toggleLateralGreen").addEventListener("click", function () {
        if (this.classList.contains("hidden")) {
            chartContagem.showSeries("Lateralizações Sim/Over");
            this.classList.remove("hidden");
        } else {
            chartContagem.hideSeries("Lateralizações Sim/Over");
            this.classList.add("hidden");
        }
    });

    document.getElementById("toggleLateralRed").addEventListener("click", function () {
        if (this.classList.contains("hidden")) {
            chartContagem.showSeries("Lateralizações Não/Under");
            this.classList.remove("hidden");
        } else {
            chartContagem.hideSeries("Lateralizações Não/Under");
            this.classList.add("hidden");
        }
    });
}
