/**
 * SmartTrack - Module Charts
 * Gère les graphiques et visualisations avec Chart.js
 */

const ChartsManager = (function() {
    let charts = {};
    let isInitialized = false;

    /**
     * Initialiser le module charts
     */
    function init() {
        console.log('📊 Initialisation du ChartsManager...');
        
        // Vérifier que Chart.js est disponible
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js non disponible');
            return;
        }

        // Configuration globale de Chart.js
        Chart.defaults.font.family = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;
        Chart.defaults.plugins.legend.position = 'bottom';
        
        isInitialized = true;
        console.log('✓ ChartsManager initialisé');
    }

    /**
     * Créer un graphique en ligne
     */
    function createLineChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`❌ Canvas ${canvasId} non trouvé`);
            return null;
        }

        // Détruire le graphique existant si présent
        if (charts[canvasId]) {
            charts[canvasId].destroy();
        }

        const defaultOptions = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: options.showLegend !== false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: options.xTitle !== undefined,
                            text: options.xTitle || ''
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: options.yTitle !== undefined,
                            text: options.yTitle || ''
                        },
                        beginAtZero: true
                    }
                },
                ...options
            }
        };

        charts[canvasId] = new Chart(canvas, defaultOptions);
        return charts[canvasId];
    }

    /**
     * Créer un graphique en barres
     */
    function createBarChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`❌ Canvas ${canvasId} non trouvé`);
            return null;
        }

        // Détruire le graphique existant si présent
        if (charts[canvasId]) {
            charts[canvasId].destroy();
        }

        const defaultOptions = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: options.showLegend !== false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: options.xTitle !== undefined,
                            text: options.xTitle || ''
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: options.yTitle !== undefined,
                            text: options.yTitle || ''
                        },
                        beginAtZero: true
                    }
                },
                ...options
            }
        };

        charts[canvasId] = new Chart(canvas, defaultOptions);
        return charts[canvasId];
    }

    /**
     * Créer un graphique circulaire
     */
    function createPieChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`❌ Canvas ${canvasId} non trouvé`);
            return null;
        }

        // Détruire le graphique existant si présent
        if (charts[canvasId]) {
            charts[canvasId].destroy();
        }

        const defaultOptions = {
            type: options.doughnut ? 'doughnut' : 'pie',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        display: options.showLegend !== false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                label += percentage + '%';
                                return label;
                            }
                        }
                    }
                },
                ...options
            }
        };

        charts[canvasId] = new Chart(canvas, defaultOptions);
        return charts[canvasId];
    }

    /**
     * Créer un graphique radar
     */
    function createRadarChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`❌ Canvas ${canvasId} non trouvé`);
            return null;
        }

        // Détruire le graphique existant si présent
        if (charts[canvasId]) {
            charts[canvasId].destroy();
        }

        const defaultOptions = {
            type: 'radar',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        display: options.showLegend !== false
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        angleLines: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                ...options
            }
        };

        charts[canvasId] = new Chart(canvas, defaultOptions);
        return charts[canvasId];
    }

    /**
     * Mettre à jour les données d'un graphique
     */
    function updateChart(canvasId, newData) {
        const chart = charts[canvasId];
        if (!chart) {
            console.error(`❌ Graphique ${canvasId} non trouvé`);
            return;
        }

        chart.data = newData;
        chart.update();
        console.log(`📊 Graphique ${canvasId} mis à jour`);
    }

    /**
     * Détruire un graphique
     */
    function destroy(canvasId) {
        const chart = charts[canvasId];
        if (chart) {
            chart.destroy();
            delete charts[canvasId];
            console.log(`🗑️ Graphique ${canvasId} détruit`);
        }
    }

    /**
     * Détruire tous les graphiques
     */
    function destroyAll() {
        Object.keys(charts).forEach(canvasId => {
            charts[canvasId].destroy();
        });
        charts = {};
        console.log('🗑️ Tous les graphiques détruits');
    }

    /**
     * Créer un graphique de progression
     */
    function createProgressChart(canvasId, progress, options = {}) {
        const data = {
            labels: progress.labels || [],
            datasets: [{
                label: options.label || 'Progression',
                data: progress.values || [],
                borderColor: options.color || 'rgb(0, 122, 255)',
                backgroundColor: options.backgroundColor || 'rgba(0, 122, 255, 0.1)',
                tension: 0.1,
                fill: true
            }]
        };

        return createLineChart(canvasId, data, {
            yTitle: options.yTitle || 'Valeur',
            xTitle: options.xTitle || 'Date',
            ...options
        });
    }

    /**
     * Créer un graphique de distribution
     */
    function createDistributionChart(canvasId, distribution, options = {}) {
        const data = {
            labels: Object.keys(distribution),
            datasets: [{
                label: options.label || 'Distribution',
                data: Object.values(distribution),
                backgroundColor: options.colors || [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)'
                ],
                borderWidth: 1
            }]
        };

        return options.type === 'pie' ? 
            createPieChart(canvasId, data, options) : 
            createBarChart(canvasId, data, options);
    }

    /**
     * Créer un graphique de comparaison
     */
    function createComparisonChart(canvasId, datasets, options = {}) {
        const data = {
            labels: options.labels || [],
            datasets: datasets.map((dataset, index) => ({
                label: dataset.label,
                data: dataset.data,
                borderColor: dataset.color || ANALYTICS_CONFIG.CHART_COLORS[index % ANALYTICS_CONFIG.CHART_COLORS.length],
                backgroundColor: dataset.backgroundColor || 'transparent',
                tension: 0.1,
                fill: false
            }))
        };

        return createLineChart(canvasId, data, options);
    }

    /**
     * Exporter un graphique en image
     */
    function exportAsImage(canvasId, filename = 'chart.png') {
        const chart = charts[canvasId];
        if (!chart) {
            console.error(`❌ Graphique ${canvasId} non trouvé`);
            return;
        }

        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        
        console.log(`💾 Graphique ${canvasId} exporté`);
    }

    /**
     * Obtenir les statistiques
     */
    function getStats() {
        return {
            totalCharts: Object.keys(charts).length,
            chartTypes: Object.values(charts).reduce((acc, chart) => {
                acc[chart.config.type] = (acc[chart.config.type] || 0) + 1;
                return acc;
            }, {}),
            isInitialized
        };
    }

    // Interface publique
    return {
        init,
        createLineChart,
        createBarChart,
        createPieChart,
        createRadarChart,
        createProgressChart,
        createDistributionChart,
        createComparisonChart,
        updateChart,
        destroy,
        destroyAll,
        exportAsImage,
        getStats
    };
})();

// Export global
window.ChartsManager = ChartsManager;