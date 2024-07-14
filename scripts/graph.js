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

    return games.reverse();
}

function organizeGamesInColumns(games, columns) {
    const rows = Math.ceil(games.length / columns);
    // const gameArray = Array.from({ length: rows }, () => Array(columns).fill(''));
    const array = [];
    var countRow = 0;
    var countColumn = 0;
    var row = [];
    var column = [];

    // for (let i = 0; i < games.length; i++) {
    //     if (countColumn < columns) {
    //         row.unshift(games[i])
    //         countColumn += 1;
    //     }
    //     if(countColumn == columns) {
    //         // console.log(row)
    //         countColumn = 0;
    //         array.unshift(row);
    //         row = [];
    //     }

    // }

    // games.forEach((game, index) => {
    //     const row = Math.floor(index / columns);
    //     const col = index % columns;
    //     gameArray[row][col] = game;
    // });

// console.log(array)
    return array;
}

function invertGameArray(gameArray) {
    return gameArray.reverse();
}

function calculatePerformanceTrends(gameArray) {
    const teamStats = {};

    gameArray.forEach((row, rowIndex) => {
        row.forEach((game, colIndex) => {
            if (game) {
                const [teams, score] = game.split(' ').join(' ').split(/\s(?=\d)/);
                const [team1, team2] = teams.split(' x ');
                const [score1, score2] = score.split('-').map(Number);

                if (!teamStats[team1]) {
                    teamStats[team1] = { performance: [] };
                }
                if (!teamStats[team2]) {
                    teamStats[team2] = { performance: [] };
                }

                if (score1 > score2) {
                    if (teamStats[team1].performance.length === 0) {
                        teamStats[team1].performance.push(1);
                    } else {
                        teamStats[team1].performance.push(teamStats[team1].performance.slice(-1)[0] + 1);
                    }

                    if (teamStats[team2].performance.length === 0) {
                        teamStats[team2].performance.push(-1);
                    } else {
                        teamStats[team2].performance.push(teamStats[team2].performance.slice(-1)[0] - 1);
                    }
                } else if (score2 > score1) {
                    if (teamStats[team2].performance.length === 0) {
                        teamStats[team2].performance.push(1);
                    } else {
                        teamStats[team2].performance.push(teamStats[team2].performance.slice(-1)[0] + 1);
                    }

                    if (teamStats[team1].performance.length === 0) {
                        teamStats[team1].performance.push(-1);
                    } else {
                        teamStats[team1].performance.push(teamStats[team1].performance.slice(-1)[0] - 1);
                    }
                } else {
                    if (teamStats[team1].performance.length === 0) {
                        teamStats[team1].performance.push(0);
                    } else {
                        teamStats[team1].performance.push(teamStats[team1].performance.slice(-1)[0]);
                    }

                    if (teamStats[team2].performance.length === 0) {
                        teamStats[team2].performance.push(0);
                    } else {
                        teamStats[team2].performance.push(teamStats[team2].performance.slice(-1)[0]);
                    }
                }

                teamStats[team1].games = teamStats[team1].games || [];
                teamStats[team2].games = teamStats[team2].games || [];
                teamStats[team1].games.push(`Jogo ${rowIndex * 20 + colIndex + 1}: ${teams} ${score}`);
                teamStats[team2].games.push(`Jogo ${rowIndex * 20 + colIndex + 1}: ${teams} ${score}`);
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
            games: stats.games // Add games info to the dataset
        });
    }

    new Chart(ctx, {
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
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const dataset = context.dataset;
                            const index = context.dataIndex;
                            const gameInfo = dataset.games[index];
                            return `${dataset.label}: ${context.raw} (${gameInfo})`;
                        }
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
    const games = createGameArray(data);
    const gameArray = organizeGamesInColumns(games, 20);
    const invertedGameArray = invertGameArray(gameArray);

    const performanceTrends = calculatePerformanceTrends(invertedGameArray);
    renderPerformanceChart(performanceTrends);
}