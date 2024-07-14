let chartInstance = null;

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

function organizeGamesInTable(games, columns) {
    const rows = Math.ceil(games.length / columns);
    const gameArray = Array.from({ length: rows }, () => Array(columns).fill(''));

    games.forEach((game, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        gameArray[row][col] = game;
    });

    return gameArray.reverse(); // Invertendo a ordem para que a hora mais distante fique em primeiro
}

function linearizeGameArray(gameArray) {
    const linearArray = [];
    const rows = gameArray.length;
    const columns = gameArray[0].length;

    for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
            if (gameArray[row][col]) {
                linearArray.push(gameArray[row][col]);
            }
        }
    }
    return linearArray;
}

function calculatePerformanceTrends(games) {
    const teamStats = {};

    games.forEach((game) => {
        if (game) {
            const [teams, score] = game.split('\n');
            const [team1, team2] = teams.split(' x ');
            const [score1, score2] = score.split('-').map(Number);

            if (!teamStats[team1]) {
                teamStats[team1] = { performance: [0] };
            }
            if (!teamStats[team2]) {
                teamStats[team2] = { performance: [0] };
            }

            const team1LastPerformance = teamStats[team1].performance.slice(-1)[0];
            const team2LastPerformance = teamStats[team2].performance.slice(-1)[0];

            if (score1 > score2) {
                teamStats[team1].performance.push(team1LastPerformance + 1);
                teamStats[team2].performance.push(team2LastPerformance - 1);
            } else if (score2 > score1) {
                teamStats[team2].performance.push(team2LastPerformance + 1);
                teamStats[team1].performance.push(team1LastPerformance - 1);
            } else {
                teamStats[team1].performance.push(team1LastPerformance);
                teamStats[team2].performance.push(team2LastPerformance);
            }
        }
    });

    return teamStats;
}

function renderPerformanceChart(teamStats) {
    const ctx = document.getElementById('performanceChart').getContext('2d');

    // Destrói a instância anterior do gráfico, se existir
    if (chartInstance) {
        chartInstance.destroy();
    }

    const labels = Array.from({ length: Math.max(...Object.values(teamStats).map(stats => stats.performance.length)) }, (_, i) => i + 1);
    const datasets = [];

    for (const team in teamStats) {
        const stats = teamStats[team];
        datasets.push({
            label: team,
            data: stats.performance,
            fill: false,
            borderColor: getRandomColor(),
            tension: 0.1
        });
    }

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Jogos'
                    }
                },
                y: {
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

function analyzeData() {
    const data = document.getElementById('dataInput').value;
    document.getElementById('performanceChart').style.display = 'block !mportant';
    const games = createGameArray(data);
    const gameArray = organizeGamesInTable(games, 20); // Organizamos conforme a lógica da tabela
    const linearGameArray = linearizeGameArray(gameArray); // Linearizamos os jogos conforme descrito

    const performanceTrends = calculatePerformanceTrends(linearGameArray);
    renderPerformanceChart(performanceTrends);
}
