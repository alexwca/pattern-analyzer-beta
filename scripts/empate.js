let performanceChart;

function sanitizeData(data) {
    return data.replace(/\+/g, '').trim();
}

function createGameArray(data) {
    const sanitizedData = sanitizeData(data);
    const regex = /"([^"]+)"/g;
    const games = [];
    let match;

    while ((match = regex.exec(sanitizedData)) !== null) {
        games.push(match[1].trim());
    }

    return games;
}

function organizeGamesInColumns(games, columns) {
    const rows = Math.ceil(games.length / columns);
    const gameArray = Array.from({ length: rows }, () => Array(columns).fill(''));

    games.forEach((game, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        gameArray[row][col] = game;
    });

    return gameArray;
}

function invertGameArray(gameArray) {
    return gameArray.map(row => row).reverse();
}

function calculateMaximasEmpates(gameArray) {
    const teamStats = {};

    gameArray.forEach(row => {
        row.forEach(game => {
            if (game) {
                const [teams, score] = game.split(' ').join(' ').split(/\s(?=\d)/);
                const [team1, team2] = teams.split(' x ');
                const [score1, score2] = score.split('-').map(Number);

                if (!teamStats[team1]) {
                    teamStats[team1] = { currentNoDraw: 0, maxNoDraw: 0, totalDraws: 0, gamesPlayed: 0, maxDraws: 0, currentDraws: 0 };
                }
                if (!teamStats[team2]) {
                    teamStats[team2] = { currentNoDraw: 0, maxNoDraw: 0, totalDraws: 0, gamesPlayed: 0, maxDraws: 0, currentDraws: 0 };
                }

                teamStats[team1].gamesPlayed++;
                teamStats[team2].gamesPlayed++;

                if (score1 === score2) {
                    teamStats[team1].currentDraws++;
                    teamStats[team2].currentDraws++;
                    teamStats[team1].totalDraws++;
                    teamStats[team2].totalDraws++;
                    teamStats[team1].maxDraws = Math.max(teamStats[team1].maxDraws, teamStats[team1].currentDraws);
                    teamStats[team2].maxDraws = Math.max(teamStats[team2].maxDraws, teamStats[team2].currentDraws);

                    teamStats[team1].currentNoDraw = 0;
                    teamStats[team2].currentNoDraw = 0;
                } else {
                    teamStats[team1].currentNoDraw++;
                    teamStats[team2].currentNoDraw++;
                    teamStats[team1].maxNoDraw = Math.max(teamStats[team1].maxNoDraw, teamStats[team1].currentNoDraw);
                    teamStats[team2].maxNoDraw = Math.max(teamStats[team2].maxNoDraw, teamStats[team2].currentNoDraw);

                    teamStats[team1].currentDraws = 0;
                    teamStats[team2].currentDraws = 0;
                }

                if (teamStats[team1].currentNoDraw >= teamStats[team1].maxNoDraw) {
                    teamStats[team1].maxNoDraw = teamStats[team1].currentNoDraw;
                }

                if (teamStats[team2].currentNoDraw >= teamStats[team2].maxNoDraw) {
                    teamStats[team2].maxNoDraw = teamStats[team2].currentNoDraw;
                }
            }
        });
    });

    // Calcular a probabilidade de empate
    for (const team in teamStats) {
        const stats = teamStats[team];
        stats.drawProbability = (
            (stats.totalDraws / stats.gamesPlayed) * 0.5 +
            (stats.currentDraws / stats.gamesPlayed) * 0.3 +
            (stats.maxDraws / stats.gamesPlayed) * 0.2
        ).toFixed(2);
    }

    return teamStats;
}



function displayMaximas(teamStats) {
    const maximasTableBody = document.getElementById('maximasTable').querySelector('tbody');

    maximasTableBody.innerHTML = ''; // Limpar o corpo da tabela de máximas

    // Ordenar por currentNoDraw de forma decrescente inicialmente
    const sortedTeamStats = Object.entries(teamStats).sort(([, a], [, b]) => b.currentNoDraw - a.currentNoDraw);

    sortedTeamStats.forEach(([team, stats]) => {
        // Adicionar à tabela de máximas
        const maximasRow = document.createElement('tr');
        maximasRow.innerHTML = `
            <td>${team}</td>
            <td>${stats.currentNoDraw}</td>
            <td>${stats.maxNoDraw}</td>
            <td>${stats.totalDraws}</td>
            <td>${(stats.drawProbability * 100).toFixed(2)}%</td>
        `;
        maximasTableBody.appendChild(maximasRow);
    });

    document.getElementById('maximasTable').style.display = 'block';

    // Ordenação padrão pela coluna de máxima atual (coluna 1, que é a segunda coluna)
    sortTable('maximasTable', 1, 'desc');
}

function sortTable(tableId, column, order) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    let sortedRows;
    if (column === 0) {
        sortedRows = rows.sort((a, b) => a.children[0].textContent.localeCompare(b.children[0].textContent));
    } else {
        sortedRows = rows.sort((a, b) => {
            const aValue = parseInt(a.children[column].textContent);
            const bValue = parseInt(b.children[column].textContent);
            return aValue - bValue;
        });
    }

    if (order === 'desc') {
        sortedRows.reverse();
    }

    tbody.innerHTML = '';
    sortedRows.forEach(row => tbody.appendChild(row));
}

function toggleSort(tableId, column) {
    const table = document.getElementById(tableId);
    const button = table.querySelector(`th button[data-order]`);

    if (!button) return; // Verifica se o botão existe antes de tentar acessar o atributo

    const currentOrder = button.getAttribute('data-order') || 'asc';
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';

    table.querySelectorAll('th button').forEach(btn => btn.setAttribute('data-order', 'asc'));
    button.setAttribute('data-order', newOrder);

    sortTable(tableId, column, newOrder);
}

function calculatePerformanceTrends(gameArray) {
    const teamStats = {};

    gameArray.forEach((row) => {
        if (!Array.isArray(row)) return; // Verifica se row é um array

        row.forEach((game) => {
            if (game) {
                const [teams, score] = game.split('\n');
                const [team1, team2] = teams.split(' x ');
                const [score1, score2] = score.split('-').map(Number);

                if (!teamStats[team1]) {
                    teamStats[team1] = { performance: [], results: [] };
                }
                if (!teamStats[team2]) {
                    teamStats[team2] = { performance: [], results: [] };
                }

                const team1LastPerformance = teamStats[team1].performance.slice(-1)[0] || 0;
                const team2LastPerformance = teamStats[team2].performance.slice(-1)[0] || 0;

                if (score1 === score2) {
                    teamStats[team1].performance.push(team1LastPerformance + 1);
                    teamStats[team2].performance.push(team2LastPerformance + 1);
                } else {
                    teamStats[team2].performance.push(team2LastPerformance - 1);
                    teamStats[team1].performance.push(team1LastPerformance - 1);
                }

                teamStats[team1].results.push(`${team1} ${score1}-${score2} ${team2}`);
                teamStats[team2].results.push(`${team1} ${score1}-${score2} ${team2}`);
            }
        });
    });

    return teamStats;
}

function renderPerformanceChart(teamStats) {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    const labels = Array.from({ length: Math.max(...Object.values(teamStats).map(stats => stats.performance.length)) }, (_, i) => i + 1);
    const datasets = [];

    for (const team in teamStats) {
        const stats = teamStats[team];
        datasets.push({
            label: team,
            data: stats.performance,
            fill: false,
            borderColor: getRandomColor(),
            tension: 0.1,
            gameResults: stats.results // Add game results to dataset
        });
    }

    if (performanceChart) {
        performanceChart.destroy();
    }

    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const dataset = context.dataset;
                            const index = context.dataIndex;
                            const gameResult = dataset.gameResults[index] || 'No game result';
                            return `${context.dataset.label}: ${context.raw} (${gameResult})`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Jogos'
                    }
                },
                y: {
                    beginAtZero: false, // Permitir valores negativos
                    title: {
                        display: true,
                        text: 'Desempenho'
                    }
                }
            }
        }
    });
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function generateMaximasDeTimes() {
    const data = document.getElementById('dataInput').value;
    const games = createGameArray(data);
    const gameArray = organizeGamesInColumns(games, 20);
    const invertedGameArray = invertGameArray(gameArray);
    const teamStats = calculateMaximasEmpates(invertedGameArray);
    displayMaximas(teamStats);

    document.getElementById('performanceChart').style.display = 'block !important';
    const performanceTrends = calculatePerformanceTrends(invertedGameArray);
    renderPerformanceChart(performanceTrends);
}
