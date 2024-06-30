function generateMaximasDeTimes() {
    const data = document.getElementById('dataInput').value.replace(/['"]+/g, '');
    const games = data.trim().split(/\t|\n/);

    const matches = [];
    for (let i = 0; i < games.length; i += 2) {
        const teams = games[i].trim();
        const score = games[i + 1].trim();
        matches.push({ teams, score });
    }

    // Invertendo a ordem dos jogos para análise de trás para frente
    matches.reverse();

    const teamStats = {};

    matches.forEach(match => {
        const [team1, team2] = match.teams.split(' x ');
        const [score1, score2] = match.score.split('-').map(Number);

        if (!teamStats[team1]) {
            teamStats[team1] = { currentStreak: 0, maxNoWinsStreak: 0, sinceLastWin: 0 };
        }
        if (!teamStats[team2]) {
            teamStats[team2] = { currentStreak: 0, maxNoWinsStreak: 0, sinceLastWin: 0 };
        }

        if (score1 > score2) {
            // Team 1 wins, reset its current streak
            teamStats[team1].sinceLastWin = 0;
            // Update Team 2
            teamStats[team2].sinceLastWin++;
            if (teamStats[team2].sinceLastWin > teamStats[team2].maxNoWinsStreak) {
                teamStats[team2].maxNoWinsStreak = teamStats[team2].sinceLastWin;
            }
        } else if (score2 > score1) {
            // Team 2 wins, reset its current streak
            teamStats[team2].sinceLastWin = 0;
            // Update Team 1
            teamStats[team1].sinceLastWin++;
            if (teamStats[team1].sinceLastWin > teamStats[team1].maxNoWinsStreak) {
                teamStats[team1].maxNoWinsStreak = teamStats[team1].sinceLastWin;
            }
        } else {
            // Draw, update both teams' streaks
            teamStats[team1].sinceLastWin++;
            teamStats[team2].sinceLastWin++;
            if (teamStats[team1].sinceLastWin > teamStats[team1].maxNoWinsStreak) {
                teamStats[team1].maxNoWinsStreak = teamStats[team1].sinceLastWin;
            }
            if (teamStats[team2].sinceLastWin > teamStats[team2].maxNoWinsStreak) {
                teamStats[team2].maxNoWinsStreak = teamStats[team2].sinceLastWin;
            }
        }

        // Set the current streak for the final result
        teamStats[team1].currentStreak = teamStats[team1].sinceLastWin;
        teamStats[team2].currentStreak = teamStats[team2].sinceLastWin;
    });

    // Transformar os dados do objeto em uma array para ordenação
    const teamStatsArray = Object.keys(teamStats).map(team => ({
        team,
        currentStreak: teamStats[team].currentStreak,
        maxNoWinsStreak: teamStats[team].maxNoWinsStreak
    }));

    // Ordenar pela coluna "Máxima Atual" em ordem decrescente
    teamStatsArray.sort((a, b) => b.currentStreak - a.currentStreak);

    const maximasTable = document.getElementById('maximasTable');
    const tbody = maximasTable.querySelector('tbody');
    tbody.innerHTML = '';

    teamStatsArray.forEach(teamStat => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${teamStat.team}</td>
            <td>${teamStat.currentStreak}</td>
            <td>${teamStat.maxNoWinsStreak}</td>
        `;
        tbody.appendChild(row);
    });

    maximasTable.style.display = 'block';
}
