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
    return gameArray.reverse();
}

function calculateMaximas(gameArray) {
    const teamStats = {};

    gameArray.forEach(row => {
        row.forEach(game => {
            if (game) {
                const [teams, score] = game.split(' ').join(' ').split(/\s(?=\d)/);
                const [team1, team2] = teams.split(' x ');
                const [score1, score2] = score.split('-').map(Number);

                if (!teamStats[team1]) {
                    teamStats[team1] = { currentWithoutWin: 0, maxNoWinsStreak: 0, wins: 0, draws: 0 };
                }
                if (!teamStats[team2]) {
                    teamStats[team2] = { currentWithoutWin: 0, maxNoWinsStreak: 0, wins: 0, draws: 0 };
                }

                if (score1 > score2) {
                    // Team 1 wins, reset its current streak
                    teamStats[team1].currentWithoutWin = 0;
                    teamStats[team1].wins++;

                    // Update Team 2
                    teamStats[team2].currentWithoutWin++;
                    if (teamStats[team2].currentWithoutWin > teamStats[team2].maxNoWinsStreak) {
                        teamStats[team2].maxNoWinsStreak = teamStats[team2].currentWithoutWin;
                    }
                } else if (score2 > score1) {
                    // Team 2 wins, reset its current streak
                    teamStats[team2].currentWithoutWin = 0;
                    teamStats[team2].wins++;

                    // Update Team 1
                    teamStats[team1].currentWithoutWin++;
                    if (teamStats[team1].currentWithoutWin > teamStats[team1].maxNoWinsStreak) {
                        teamStats[team1].maxNoWinsStreak = teamStats[team1].currentWithoutWin;
                    }
                } else {
                    // Draw, update both teams' streaks
                    teamStats[team1].currentWithoutWin++;
                    teamStats[team2].currentWithoutWin++;
                    teamStats[team1].draws++;
                    teamStats[team2].draws++;
                    if (teamStats[team1].currentWithoutWin > teamStats[team1].maxNoWinsStreak) {
                        teamStats[team1].maxNoWinsStreak = teamStats[team1].currentWithoutWin;
                    }
                    if (teamStats[team2].currentWithoutWin > teamStats[team2].maxNoWinsStreak) {
                        teamStats[team2].maxNoWinsStreak = teamStats[team2].currentWithoutWin;
                    }
                }
            }
        });
    });

    return teamStats;
}

// Função para exibir as máximas no navegador
function displayMaximas(teamStats) {
    const maximasTableBody = document.getElementById('maximasTable').querySelector('tbody');
    const statsTableBody = document.getElementById('statsTable').querySelector('tbody');

    maximasTableBody.innerHTML = ''; // Limpar o corpo da tabela de máximas
    statsTableBody.innerHTML = ''; // Limpar o corpo da tabela de estatísticas

    // Ordenar por currentWithoutWin de forma decrescente inicialmente
    const sortedTeamStats = Object.entries(teamStats).sort(([, a], [, b]) => b.currentWithoutWin - a.currentWithoutWin);

    sortedTeamStats.forEach(([team, stats]) => {
        // Adicionar à tabela de máximas
        const maximasRow = document.createElement('tr');
        maximasRow.innerHTML = `
            <td>${team}</td>
            <td>${stats.currentWithoutWin}</td>
            <td>${stats.maxNoWinsStreak}</td>
        `;
        maximasTableBody.appendChild(maximasRow);

        // Adicionar à tabela de estatísticas
        const statsRow = document.createElement('tr');
        statsRow.innerHTML = `
            <td>${team}</td>
            <td>${stats.wins}</td>
            <td>${stats.draws}</td>
        `;
        statsTableBody.appendChild(statsRow);
    });

    document.getElementById('maximasTable').style.display = 'block';
    document.getElementById('statsTable').style.display = 'block';
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
    const headers = Array.from(table.querySelectorAll('th button'));
    const currentOrder = headers[column].dataset.order;

    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    headers.forEach(header => header.dataset.order = 'asc');
    headers[column].dataset.order = newOrder;

    sortTable(tableId, column, newOrder);
}

// Função principal para ser chamada no clique do botão
function generateMaximasDeTimes() {
    const data = document.getElementById('dataInput').value;
    const games = createGameArray(data);
    const gameArray = organizeGamesInColumns(games, 20);
    const invertedGameArray = invertGameArray(gameArray);
    const teamStats = calculateMaximas(invertedGameArray);
    displayMaximas(teamStats);
}
