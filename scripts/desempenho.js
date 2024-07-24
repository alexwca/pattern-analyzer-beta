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

                if (score1 > score2) {
                    // Vitória do time 1
                    teamStats[team1].performance.push(team1LastPerformance + 1);
                    teamStats[team2].performance.push(team2LastPerformance - 1);
                } else if (score2 > score1) {
                    // Vitória do time 2
                    teamStats[team2].performance.push(team2LastPerformance + 1);
                    teamStats[team1].performance.push(team1LastPerformance - 1);
                } else {
                    // Empate
                    teamStats[team1].performance.push(team1LastPerformance);
                    teamStats[team2].performance.push(team2LastPerformance);
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

    // Obter os times e ordená-los em ordem alfabética
    const teams = Object.keys(teamStats).sort();

    teams.forEach(team => {
        const stats = teamStats[team];
        datasets.push({
            label: team,
            data: stats.performance,
            fill: false,
            borderColor: getRandomColor(),
            tension: 0.1,
            gameResults: stats.results, // Add game results to dataset
            hidden: true // Initially hide all datasets
        });
    });

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
                        label: function(context) {
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

    // Create buttons for each team
    const buttonsContainer = document.getElementById('teamButtons');
    buttonsContainer.innerHTML = ''; // Clear existing buttons
    teams.forEach(team => {
        const button = document.createElement('button');
        button.textContent = team;
        button.addEventListener('click', () => toggleTeamVisibility(team));
        buttonsContainer.appendChild(button);
        teamButtons[team] = button;
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

function analyzeData() {
    const data = document.getElementById('dataInput').value;
    document.getElementById('performanceChart').style.display = 'block !important';

    const games = createGameArray(data);
    const gameArray = organizeGamesInColumns(games, 20);
    const invertedGameArray = invertGameArray(gameArray);

    const performanceTrends = calculatePerformanceTrends(invertedGameArray);
    renderPerformanceChart(performanceTrends);
}
