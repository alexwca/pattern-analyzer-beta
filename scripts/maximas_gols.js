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

function calculateMaximasGols(gameArray) {
    const teamStats = {};

    gameArray.forEach(row => {
        row.forEach(game => {
            if (game) {
                const [teams, score] = game.split(/\s(?=\d)/);
                const [team1, team2] = teams.split(' x ');
                const [score1, score2] = score.split('-').map(Number);
                const totalGols = score1 + score2;

                if (!teamStats[team1]) {
                    teamStats[team1] = { 
                        currentUnder2_5: 0, 
                        maxUnder2_5: 0, 
                        currentUnder3_5: 0, 
                        maxUnder3_5: 0, 
                        currentUnder5: 0, 
                        maxUnder5: 0, 
                        gamesPlayed: 0, 
                        under2_5Total: 0,
                        over2_5Total: 0 
                    };
                }
                if (!teamStats[team2]) {
                    teamStats[team2] = { 
                        currentUnder2_5: 0, 
                        maxUnder2_5: 0, 
                        currentUnder3_5: 0, 
                        maxUnder3_5: 0, 
                        currentUnder5: 0, 
                        maxUnder5: 0, 
                        gamesPlayed: 0, 
                        under2_5Total: 0,
                        over2_5Total: 0 
                    };
                }

                teamStats[team1].gamesPlayed++;
                teamStats[team2].gamesPlayed++;

                if (totalGols < 2.5) {
                    teamStats[team1].currentUnder2_5++;
                    teamStats[team2].currentUnder2_5++;
                    teamStats[team1].maxUnder2_5 = Math.max(teamStats[team1].maxUnder2_5, teamStats[team1].currentUnder2_5);
                    teamStats[team2].maxUnder2_5 = Math.max(teamStats[team2].maxUnder2_5, teamStats[team2].currentUnder2_5);
                    teamStats[team1].under2_5Total++;
                    teamStats[team2].under2_5Total++;
                } else {
                    teamStats[team1].currentUnder2_5 = 0;
                    teamStats[team2].currentUnder2_5 = 0;
                    teamStats[team1].over2_5Total++;
                    teamStats[team2].over2_5Total++;
                }

                if (totalGols < 3.5) {
                    teamStats[team1].currentUnder3_5++;
                    teamStats[team2].currentUnder3_5++;
                    teamStats[team1].maxUnder3_5 = Math.max(teamStats[team1].maxUnder3_5, teamStats[team1].currentUnder3_5);
                    teamStats[team2].maxUnder3_5 = Math.max(teamStats[team2].maxUnder3_5, teamStats[team2].currentUnder3_5);
                } else {
                    teamStats[team1].currentUnder3_5 = 0;
                    teamStats[team2].currentUnder3_5 = 0;
                }

                if (totalGols < 5) {
                    teamStats[team1].currentUnder5++;
                    teamStats[team2].currentUnder5++;
                    teamStats[team1].maxUnder5 = Math.max(teamStats[team1].maxUnder5, teamStats[team1].currentUnder5);
                    teamStats[team2].maxUnder5 = Math.max(teamStats[team2].maxUnder5, teamStats[team2].currentUnder5);
                } else {
                    teamStats[team1].currentUnder5 = 0;
                    teamStats[team2].currentUnder5 = 0;
                }
            }
        });
    });

    return teamStats;
}

function displayMaximasGols(teamStats) {
    const maximasGolsTableBody_2_5 = document.getElementById('maximasGolsTable_2_5').querySelector('tbody');
    const maximasGolsTableBody_3_5 = document.getElementById('maximasGolsTable_3_5').querySelector('tbody');
    const maximasGolsTableBody_5 = document.getElementById('maximasGolsTable_5').querySelector('tbody');

    maximasGolsTableBody_2_5.innerHTML = ''; // Limpar o corpo da tabela de máximas < 2.5
    maximasGolsTableBody_3_5.innerHTML = ''; // Limpar o corpo da tabela de máximas < 3.5
    maximasGolsTableBody_5.innerHTML = ''; // Limpar o corpo da tabela de máximas < 5

    const sortedTeamStats_2_5 = Object.entries(teamStats).sort(([, a], [, b]) => b.maxUnder2_5 - a.maxUnder2_5);
    const sortedTeamStats_3_5 = Object.entries(teamStats).sort(([, a], [, b]) => b.maxUnder3_5 - a.maxUnder3_5);
    const sortedTeamStats_5 = Object.entries(teamStats).sort(([, a], [, b]) => b.maxUnder5 - a.maxUnder5);

    sortedTeamStats_2_5.forEach(([team, stats]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${team}</td>
            <td>${stats.currentUnder2_5}</td>
            <td>${stats.maxUnder2_5}</td>
            <td>${stats.gamesPlayed}</td>
            <td>${stats.under2_5Total}</td>
            <td>${stats.over2_5Total}</td>
        `;
        maximasGolsTableBody_2_5.appendChild(row);
    });

    sortedTeamStats_3_5.forEach(([team, stats]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${team}</td>
            <td>${stats.currentUnder3_5}</td>
            <td>${stats.maxUnder3_5}</td>
        `;
        maximasGolsTableBody_3_5.appendChild(row);
    });

    sortedTeamStats_5.forEach(([team, stats]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${team}</td>
            <td>${stats.currentUnder5}</td>
            <td>${stats.maxUnder5}</td>
        `;
        maximasGolsTableBody_5.appendChild(row);
    });

    document.getElementById('maximasGolsTable_2_5').style.display = 'block';
    document.getElementById('maximasGolsTable_3_5').style.display = 'block';
    document.getElementById('maximasGolsTable_5').style.display = 'block';

    // Ordenação padrão pela coluna de máxima atual (coluna 1, que é a segunda coluna)
    sortTable('maximasGolsTable_2_5', 1, 'desc');
    sortTable('maximasGolsTable_3_5', 1, 'desc');
    sortTable('maximasGolsTable_5', 1, 'desc');
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

function generateMaximasDeGols() {
    const data = document.getElementById('dataInput').value;
    const games = createGameArray(data);
    const gameArray = organizeGamesInColumns(games, 20);
    const invertedGameArray = invertGameArray(gameArray);
    const teamStats = calculateMaximasGols(invertedGameArray);
    displayMaximasGols(teamStats);
}
