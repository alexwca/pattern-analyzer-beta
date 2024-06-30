function clearData() {
    document.getElementById('dataInput').value = "";
    if (document.getElementById('negativeInput')) {
        document.getElementById('negativeInput').value = "";
    }
    document.getElementById('resultsTable').style.display = 'none';
    if (document.getElementById('matchTable')) {
        document.getElementById('matchTable').style.display = 'none';
    }
    if (document.getElementById('missingTeamsTable')) {
        document.getElementById('missingTeamsTable').style.display = 'none';
    }
}
