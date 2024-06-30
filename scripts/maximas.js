let maximasSortOrder = {
    team: 'asc',
    currentWithoutWin: 'desc',
    maxNoWinsStreak: 'asc'
};

let statsSortOrder = {
    wins: 'asc',
    draws: 'asc'
};

function generateMaximasDeTimes() {
    const data = document.getElementById('dataInput').value.replace(/['"]+/g, '').replace(/\+/g, '').trim();
    if (!data) {
        alert("Por favor, insira os dados dos jogos.");
        return;
    }

    const games = data.split(/\t|\n/).filter(line => line.trim() !== '');

    const matches = [];
    for (let i = 0; i < games.length; i += 2) {
        if (i + 1 < games.length) {
            const teams = games[i].trim();
            const score = games[i + 1].trim();
            if (teams && score) {
                matches.push({ teams, score });
            }
        }
    }

    // Invertendo a ordem dos jogos para análise de trás para frente
    matches.reverse();

    const teamStats = {};

    matches.forEach(match => {
        const [team1, team2] = match.teams.split(' x ').map(team => team.trim());
        const [score1, score2] = match.score.split('-').map(Number);

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
    });

    // Transformar os dados do objeto em arrays para ordenação
    const teamStatsArray = Object.keys(teamStats).map(team => ({
        team,
        currentWithoutWin: teamStats[team].currentWithoutWin,
        maxNoWinsStreak: teamStats[team].maxNoWinsStreak,
        wins: teamStats[team].wins,
        draws: teamStats[team].draws
    }));

    // Ordenar pela coluna "currentWithoutWin" em ordem decrescente por padrão
    teamStatsArray.sort((a, b) => b.currentWithoutWin - a.currentWithoutWin);

    const maximasTable = document.getElementById('maximasTable');
    const statsTable = document.getElementById('statsTable');

    const maximasTbody = maximasTable.querySelector('tbody');
    const statsTbody = statsTable.querySelector('tbody');

    maximasTbody.innerHTML = '';
    statsTbody.innerHTML = '';

    teamStatsArray.forEach(teamStat => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teamStat.team}</td>
            <td>${teamStat.currentWithoutWin}</td>
            <td>${teamStat.maxNoWinsStreak}</td>
        `;
        maximasTbody.appendChild(row);
    });

    teamStatsArray.forEach(teamStat => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teamStat.team}</td>
            <td>${teamStat.wins}</td>
            <td>${teamStat.draws}</td>
        `;
        statsTbody.appendChild(row);
    });

    maximasTable.style.display = 'block';
    statsTable.style.display = 'block';
}

function sortMaximasTable(criteria) {
    const maximasTable = document.getElementById('maximasTable');
    const maximasTbody = maximasTable.querySelector('tbody');
    const rows = Array.from(maximasTbody.querySelectorAll('tr'));

    let sortedRows;
    if (criteria === 'team') {
        sortedRows = rows.sort((a, b) => a.children[0].textContent.localeCompare(b.children[0].textContent));
        if (maximasSortOrder[criteria] === 'desc') {
            sortedRows.reverse();
            maximasSortOrder[criteria] = 'asc';
        } else {
            maximasSortOrder[criteria] = 'desc';
        }
    } else if (criteria === 'currentWithoutWin') {
        sortedRows = rows.sort((a, b) => {
            const aValue = parseInt(a.children[1].textContent);
            const bValue = parseInt(b.children[1].textContent);
            return aValue - bValue;
        });
        if (maximasSortOrder[criteria] === 'desc') {
            sortedRows.reverse();
            maximasSortOrder[criteria] = 'asc';
        } else {
            maximasSortOrder[criteria] = 'desc';
        }
    } else if (criteria === 'maxNoWinsStreak') {
        sortedRows = rows.sort((a, b) => {
            const aValue = parseInt(a.children[2].textContent);
            const bValue = parseInt(b.children[2].textContent);
            return aValue - bValue;
        });
        if (maximasSortOrder[criteria] === 'desc') {
            sortedRows.reverse();
            maximasSortOrder[criteria] = 'asc';
        } else {
            maximasSortOrder[criteria] = 'desc';
        }
    }

    maximasTbody.innerHTML = '';
    sortedRows.forEach(row => maximasTbody.appendChild(row));
}

function sortStatsTable(criteria) {
    const statsTable = document.getElementById('statsTable');
    const statsTbody = statsTable.querySelector('tbody');
    const rows = Array.from(statsTbody.querySelectorAll('tr'));

    let sortedRows;
    if (criteria === 'wins') {
        sortedRows = rows.sort((a, b) => {
            const aValue = parseInt(a.children[1].textContent);
            const bValue = parseInt(b.children[1].textContent);
            return aValue - bValue;
        });
        if (statsSortOrder[criteria] === 'asc') {
            sortedRows.reverse();
            statsSortOrder[criteria] = 'desc';
        } else {
            statsSortOrder[criteria] = 'asc';
        }
    } else if (criteria === 'draws') {
        sortedRows = rows.sort((a, b) => {
            const aValue = parseInt(a.children[2].textContent);
            const bValue = parseInt(b.children[2].textContent);
            return aValue - bValue;
        });
        if (statsSortOrder[criteria] === 'asc') {
            sortedRows.reverse();
            statsSortOrder[criteria] = 'desc';
        } else {
            statsSortOrder[criteria] = 'asc';
        }
    }

    statsTbody.innerHTML = '';
    sortedRows.forEach(row => statsTbody.appendChild(row));
}
