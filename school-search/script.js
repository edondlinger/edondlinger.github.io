document.addEventListener('DOMContentLoaded', () => {
    const csvUrl = 'district_data.csv';
    let districtData = [];
    const searchInput = document.getElementById('district-search');
    const suggestionsList = document.getElementById('search-results-list');
    const resultContainer = document.getElementById('result-container');
    const districtNameHeading = document.getElementById('district-name');
    const dataTableBody = document.getElementById('data-table-body');
    let chartInstance = null;

    // Fetch and Parse CSV
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        dynamicTyping: true, // Automatically converts numbers
        skipEmptyLines: true,
        complete: function(results) {
            console.log("CSV Loaded", results.data);
            districtData = results.data;
        },
        error: function(error) {
            console.error("Error parsing CSV:", error);
            alert("Failed to load data.");
        }
    });

    // Search Input Event Listener
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        suggestionsList.innerHTML = '';
        
        if (query.length < 2) {
            suggestionsList.classList.add('hidden');
            return;
        }

        const matches = districtData.filter(row => 
            row.clean_name && row.clean_name.toLowerCase().includes(query)
        );

        if (matches.length > 0) {
            suggestionsList.classList.remove('hidden');
            matches.slice(0, 5).forEach(match => { // Limit to 5 suggestions
                const div = document.createElement('div');
                div.classList.add('suggestion-item');
                div.textContent = match.clean_name;
                div.addEventListener('click', () => {
                    selectDistrict(match);
                });
                suggestionsList.appendChild(div);
            });
        } else {
            suggestionsList.classList.add('hidden');
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.classList.add('hidden');
        }
    });

    function selectDistrict(district) {
        searchInput.value = district.clean_name;
        suggestionsList.classList.add('hidden');
        displayResult(district);
    }

    function displayResult(district) {
        resultContainer.classList.remove('hidden');
        districtNameHeading.textContent = district.clean_name;

        // Prepare data for Table and Chart
        // CSV columns are: clean_name, 20242025, 20232024, 20222023, 20212022, 20202021, 20192020
        // We want chronological order for the chart (oldest to newest)
        const yearsKeyMap = [
            { key: '20192020', label: '2019-2020' },
            { key: '20202021', label: '2020-2021' },
            { key: '20212022', label: '2021-2022' },
            { key: '20222023', label: '2022-2023' },
            { key: '20232024', label: '2023-2024' },
            { key: '20242025', label: '2024-2025' }
        ];

        const chartLabels = [];
        const chartDataPoints = [];
        let tableHtml = '';

        // Traverse years in reverse chronological order for the table (newest first)
        [...yearsKeyMap].reverse().forEach(yearObj => {
            const value = district[yearObj.key];
            const displayValue = (value === 'NA' || value === null || value === undefined) ? 'N/A' : value + '%';
            
            tableHtml += `
                <tr>
                    <td>${yearObj.label}</td>
                    <td>${displayValue}</td>
                </tr>
            `;
        });
        
        // Traverse years in chronological order for the chart
        yearsKeyMap.forEach(yearObj => {
            const value = district[yearObj.key];
             // Handle NA for chart: Chart.js handles null as a gap or skip
            const dataPoint = (value === 'NA' || value === null || value === undefined) ? null : value;
            
            chartLabels.push(yearObj.label);
            chartDataPoints.push(dataPoint);
        });

        // Update Table
        dataTableBody.innerHTML = tableHtml;

        // Update Chart
        updateChart(district.clean_name, chartLabels, chartDataPoints);
    }

    function updateChart(label, labels, data) {
        const ctx = document.getElementById('absenteeChart').getContext('2d');

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Chronic Absenteeism (%)',
                    data: data,
                    borderColor: '#2563eb', // Primary color
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    fill: true,
                    tension: 0.4 // Smooth curve
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        padding: 12,
                        titleFont: { family: "'Outfit', sans-serif", size: 14 },
                        bodyFont: { family: "'Outfit', sans-serif", size: 14 },
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `Rate: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e2e8f0',
                            borderDash: [5, 5]
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            },
                            font: { family: "'Outfit', sans-serif" },
                            color: '#64748b'
                        },
                        border: { display: false }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            font: { family: "'Outfit', sans-serif" },
                            color: '#64748b'
                        },
                        border: { display: false }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
            }
        });
    }
});
