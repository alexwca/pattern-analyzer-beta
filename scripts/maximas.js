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

function calculateMaximas(gameArray) {
    const teamStats = {};

    gameArray.forEach(row => {
        row.forEach(game => {
            if (game) {
                const [teams, score] = game.split(' ').join(' ').split(/\s(?=\d)/);
                const [team1, team2] = teams.split(' x ');
                const [score1, score2] = score.split('-').map(Number);

                if (!teamStats[team1]) {
                    teamStats[team1] = { currentWithoutWin: 0, maxNoWinsStreak: 0, wins: 0, draws: 0, gamesPlayed: 0, losses: 0, recentForm: [] };
                }
                if (!teamStats[team2]) {
                    teamStats[team2] = { currentWithoutWin: 0, maxNoWinsStreak: 0, wins: 0, draws: 0, gamesPlayed: 0, losses: 0, recentForm: [] };
                }

                teamStats[team1].gamesPlayed++;
                teamStats[team2].gamesPlayed++;

                if (score1 > score2) {
                    // Team 1 wins, reset its current streak
                    teamStats[team1].currentWithoutWin = 0;
                    teamStats[team1].wins++;
                    teamStats[team1].recentForm.push('W');
                    if (teamStats[team1].recentForm.length > 5) teamStats[team1].recentForm.shift();
                    teamStats[team2].losses++;
                    teamStats[team2].recentForm.push('L');
                    if (teamStats[team2].recentForm.length > 5) teamStats[team2].recentForm.shift();

                    // Update Team 2
                    teamStats[team2].currentWithoutWin++;
                    if (teamStats[team2].currentWithoutWin > teamStats[team2].maxNoWinsStreak) {
                        teamStats[team2].maxNoWinsStreak = teamStats[team2].currentWithoutWin;
                    }
                } else if (score2 > score1) {
                    // Team 2 wins, reset its current streak
                    teamStats[team2].currentWithoutWin = 0;
                    teamStats[team2].wins++;
                    teamStats[team2].recentForm.push('W');
                    if (teamStats[team2].recentForm.length > 5) teamStats[team2].recentForm.shift();
                    teamStats[team1].losses++;
                    teamStats[team1].recentForm.push('L');
                    if (teamStats[team1].recentForm.length > 5) teamStats[team1].recentForm.shift();

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
                    teamStats[team1].recentForm.push('D');
                    if (teamStats[team1].recentForm.length > 5) teamStats[team1].recentForm.shift();
                    teamStats[team2].recentForm.push('D');
                    if (teamStats[team2].recentForm.length > 5) teamStats[team2].recentForm.shift();
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

    // Calculate win probability for each team
    for (const team in teamStats) {
        const stats = teamStats[team];
        const winRate = stats.wins / stats.gamesPlayed;
        const drawRate = stats.draws / stats.gamesPlayed;
        const lossRate = stats.losses / stats.gamesPlayed;

        // Proximity of current streak to maximum no-win streak
        const streakProximity = (stats.maxNoWinsStreak - stats.currentWithoutWin) / stats.maxNoWinsStreak;

        // Recent form weighted
        const recentFormWeight = stats.recentForm.reduce((acc, result) => {
            if (result === 'W') return acc + 1;
            if (result === 'D') return acc + 0.5;
            return acc;
        }, 0) / 5;

        // Combining factors
        stats.winProbability = 0.4 * winRate + 0.3 * recentFormWeight + 0.2 * (1 - streakProximity) + 0.1 * drawRate;
    }

    return teamStats;
}

// Função para exibir as máximas no navegador
function displayMaximas(teamStats) {
    const maximasTableBody = document.getElementById('maximasTable').querySelector('tbody');

    maximasTableBody.innerHTML = ''; // Limpar o corpo da tabela de máximas

    // Ordenar por currentWithoutWin de forma decrescente inicialmente
    const sortedTeamStats = Object.entries(teamStats).sort(([, a], [, b]) => b.currentWithoutWin - a.currentWithoutWin);

    sortedTeamStats.forEach(([team, stats]) => {
        // Adicionar à tabela de máximas
        const maximasRow = document.createElement('tr');
        maximasRow.innerHTML = `
            <td>${team}</td>
            <td style="text-align: center">${stats.currentWithoutWin}</td>
            <td style="text-align: center">${stats.maxNoWinsStreak}</td>
            <td style="text-align: center">${stats.gamesPlayed}</td>
            <td style="text-align: center">${stats.wins} - <small>${(100 * (stats.wins / stats.gamesPlayed)).toFixed(2)}%</small></td>
            <td style="text-align: center">${stats.losses} - <small>${(100 * (stats.losses / stats.gamesPlayed)).toFixed(2)}%</small></td>
            <td style="text-align: center">${stats.draws} - <small>${(100 * (stats.draws / stats.gamesPlayed)).toFixed(2)}%</small></td>
            <td style="text-align: center">${(100 * stats.winProbability).toFixed(2)}%</td>
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

    console.log(currentOrder)
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
