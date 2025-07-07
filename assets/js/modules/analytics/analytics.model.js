/**
 * SmartTrack - Modèle Analytics
 * Gestion des statistiques et analyses avancées
 */

const AnalyticsModel = (function() {
    let analytics = null;
    let isLoaded = false;
    let sessionsData = [];
    let exercisesData = [];

    /**
     * Initialiser le modèle
     */
    async function init() {
        try {
            console.log('📊 Initialisation du modèle Analytics...');
            
            await loadAnalytics();
            await refreshData();
            
            // Écouter les événements de données
            if (typeof EventBus !== 'undefined') {
                EventBus.on('sessions:finished', handleSessionCompleted);
                EventBus.on('sessions:loaded', refreshData);
                EventBus.on('exercises:loaded', refreshData);
                EventBus.on('storage:saved', handleStorageUpdate);
            }
            
            console.log('✓ Modèle Analytics initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation modèle Analytics :', error);
            throw error;
        }
    }

    /**
     * Charger les données d'analytics
     */
    async function loadAnalytics() {
        try {
            analytics = await Storage.get(STORAGE_KEYS.ANALYTICS);
            
            if (!analytics) {
                // Initialiser les analytics
                analytics = {
                    lastUpdate: new Date().toISOString(),
                    totalSessions: 0,
                    totalDuration: 0,
                    totalExercises: 0,
                    totalSets: 0,
                    totalReps: 0,
                    totalWeight: 0,
                    averageSessionDuration: 0,
                    longestStreak: 0,
                    currentStreak: 0,
                    favoriteExercises: [],
                    weeklyStats: [],
                    monthlyStats: [],
                    muscleGroupStats: {},
                    progressMetrics: {},
                    created_at: new Date().toISOString()
                };
                await saveAnalytics();
            }
            
            isLoaded = true;
            return analytics;
            
        } catch (error) {
            console.error('❌ Erreur chargement analytics :', error);
            analytics = {
                lastUpdate: new Date().toISOString(),
                totalSessions: 0,
                totalDuration: 0,
                totalExercises: 0,
                totalSets: 0,
                totalReps: 0,
                totalWeight: 0,
                averageSessionDuration: 0,
                longestStreak: 0,
                currentStreak: 0,
                favoriteExercises: [],
                weeklyStats: [],
                monthlyStats: [],
                muscleGroupStats: {},
                progressMetrics: {},
                created_at: new Date().toISOString()
            };
            return analytics;
        }
    }

    /**
     * Sauvegarder les données d'analytics
     */
    async function saveAnalytics() {
        try {
            analytics.lastUpdate = new Date().toISOString();
            await Storage.set(STORAGE_KEYS.ANALYTICS, analytics);
            
            // Émettre événement
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('analytics:updated', { analytics });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde analytics :', error);
            return false;
        }
    }

    /**
     * Rafraîchir les données de base
     */
    async function refreshData() {
        try {
            if (typeof SessionsModel !== 'undefined') {
                sessionsData = await SessionsModel.getAll();
            }
            
            if (typeof ExercisesModel !== 'undefined') {
                exercisesData = await ExercisesModel.getAll();
            }
            
            // Recalculer toutes les statistiques
            await calculateAllStats();
            
        } catch (error) {
            console.error('❌ Erreur rafraîchissement données :', error);
        }
    }

    /**
     * Calculer toutes les statistiques
     */
    async function calculateAllStats() {
        try {
            if (!analytics) return;

            // Statistiques de base
            await calculateBasicStats();
            
            // Statistiques temporelles
            await calculateTimeStats();
            
            // Statistiques par groupe musculaire
            await calculateMuscleGroupStats();
            
            // Exercices favoris
            await calculateFavoriteExercises();
            
            // Métriques de progression
            await calculateProgressMetrics();
            
            // Sauvegarder
            await saveAnalytics();
            
        } catch (error) {
            console.error('❌ Erreur calcul statistiques :', error);
        }
    }

    /**
     * Calculer les statistiques de base
     */
    async function calculateBasicStats() {
        analytics.totalSessions = sessionsData.length;
        analytics.totalDuration = 0;
        analytics.totalExercises = 0;
        analytics.totalSets = 0;
        analytics.totalReps = 0;
        analytics.totalWeight = 0;

        sessionsData.forEach(session => {
            if (session.stats) {
                analytics.totalDuration += session.duration || 0;
                analytics.totalExercises += session.stats.exerciseCount || 0;
                analytics.totalSets += session.stats.completedSets || 0;
                analytics.totalReps += session.stats.totalReps || 0;
                analytics.totalWeight += session.stats.totalWeight || 0;
            }
        });

        // Moyenne
        analytics.averageSessionDuration = analytics.totalSessions > 0 ? 
            Math.round(analytics.totalDuration / analytics.totalSessions) : 0;
    }

    /**
     * Calculer les statistiques temporelles
     */
    async function calculateTimeStats() {
        // Calculer la série actuelle et la plus longue
        const { currentStreak, longestStreak } = calculateStreaks();
        analytics.currentStreak = currentStreak;
        analytics.longestStreak = longestStreak;

        // Statistiques hebdomadaires
        analytics.weeklyStats = calculateWeeklyStats();
        
        // Statistiques mensuelles
        analytics.monthlyStats = calculateMonthlyStats();
    }

    /**
     * Calculer les séries de jours consécutifs
     */
    function calculateStreaks() {
        if (sessionsData.length === 0) {
            return { currentStreak: 0, longestStreak: 0 };
        }

        // Grouper les sessions par jour
        const sessionDays = new Set();
        sessionsData.forEach(session => {
            const day = new Date(session.date).toDateString();
            sessionDays.add(day);
        });

        const sortedDays = Array.from(sessionDays).sort((a, b) => new Date(b) - new Date(a));
        
        // Calculer la série actuelle
        let currentStreak = 0;
        const today = new Date();
        
        for (let i = 0; i < sortedDays.length; i++) {
            const dayDate = new Date(sortedDays[i]);
            const daysDiff = Math.floor((today - dayDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === currentStreak || (daysDiff === currentStreak + 1 && currentStreak === 0)) {
                currentStreak++;
            } else {
                break;
            }
        }

        // Calculer la série la plus longue
        let longestStreak = 0;
        let tempStreak = 1;
        
        for (let i = 1; i < sortedDays.length; i++) {
            const prevDay = new Date(sortedDays[i-1]);
            const currDay = new Date(sortedDays[i]);
            const daysDiff = Math.floor((prevDay - currDay) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === 1) {
                tempStreak++;
            } else {
                longestStreak = Math.max(longestStreak, tempStreak);
                tempStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return { currentStreak, longestStreak };
    }

    /**
     * Calculer les statistiques hebdomadaires
     */
    function calculateWeeklyStats() {
        const weeklyData = {};
        const now = new Date();
        
        // Dernières 12 semaines
        for (let i = 0; i < 12; i++) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (now.getDay() + 7 * i));
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            const weekKey = `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getDate() + weekStart.getDay()) / 7)}`;
            
            weeklyData[weekKey] = {
                start: weekStart.toISOString(),
                end: weekEnd.toISOString(),
                sessions: 0,
                duration: 0,
                exercises: 0,
                sets: 0,
                reps: 0
            };
        }

        // Compter les sessions dans chaque semaine
        sessionsData.forEach(session => {
            const sessionDate = new Date(session.date);
            
            Object.keys(weeklyData).forEach(weekKey => {
                const week = weeklyData[weekKey];
                const weekStart = new Date(week.start);
                const weekEnd = new Date(week.end);
                
                if (sessionDate >= weekStart && sessionDate <= weekEnd) {
                    week.sessions++;
                    week.duration += session.duration || 0;
                    if (session.stats) {
                        week.exercises += session.stats.exerciseCount || 0;
                        week.sets += session.stats.completedSets || 0;
                        week.reps += session.stats.totalReps || 0;
                    }
                }
            });
        });

        return Object.entries(weeklyData)
            .map(([week, data]) => ({ week, ...data }))
            .sort((a, b) => new Date(b.start) - new Date(a.start));
    }

    /**
     * Calculer les statistiques mensuelles
     */
    function calculateMonthlyStats() {
        const monthlyData = {};
        const now = new Date();
        
        // Derniers 12 mois
        for (let i = 0; i < 12; i++) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
            
            monthlyData[monthKey] = {
                month: monthKey,
                year: month.getFullYear(),
                monthNum: month.getMonth() + 1,
                sessions: 0,
                duration: 0,
                exercises: 0,
                sets: 0,
                reps: 0,
                avgSessionDuration: 0
            };
        }

        // Compter les sessions dans chaque mois
        sessionsData.forEach(session => {
            const sessionDate = new Date(session.date);
            const monthKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].sessions++;
                monthlyData[monthKey].duration += session.duration || 0;
                if (session.stats) {
                    monthlyData[monthKey].exercises += session.stats.exerciseCount || 0;
                    monthlyData[monthKey].sets += session.stats.completedSets || 0;
                    monthlyData[monthKey].reps += session.stats.totalReps || 0;
                }
            }
        });

        // Calculer les moyennes
        Object.values(monthlyData).forEach(month => {
            if (month.sessions > 0) {
                month.avgSessionDuration = Math.round(month.duration / month.sessions);
            }
        });

        return Object.values(monthlyData)
            .sort((a, b) => `${b.year}-${b.monthNum}`.localeCompare(`${a.year}-${a.monthNum}`));
    }

    /**
     * Calculer les statistiques par groupe musculaire
     */
    async function calculateMuscleGroupStats() {
        analytics.muscleGroupStats = {};

        // Initialiser avec tous les groupes musculaires
        if (typeof MUSCLE_GROUPS !== 'undefined') {
            Object.keys(MUSCLE_GROUPS).forEach(group => {
                analytics.muscleGroupStats[group] = {
                    sessions: 0,
                    exercises: 0,
                    sets: 0,
                    reps: 0,
                    totalWeight: 0,
                    lastTrained: null
                };
            });
        }

        // Analyser les sessions
        sessionsData.forEach(session => {
            if (!session.exercises) return;

            session.exercises.forEach(sessionExercise => {
                const exercise = exercisesData.find(ex => ex.id === sessionExercise.exercise_id);
                if (!exercise) return;

                const muscleGroup = exercise.muscle_group;
                if (!analytics.muscleGroupStats[muscleGroup]) {
                    analytics.muscleGroupStats[muscleGroup] = {
                        sessions: 0,
                        exercises: 0,
                        sets: 0,
                        reps: 0,
                        totalWeight: 0,
                        lastTrained: null
                    };
                }

                const stats = analytics.muscleGroupStats[muscleGroup];
                stats.exercises++;
                
                if (sessionExercise.sets) {
                    sessionExercise.sets.forEach(set => {
                        if (set.completed) {
                            stats.sets++;
                            stats.reps += set.reps || 0;
                            stats.totalWeight += (set.reps || 0) * (set.weight || 0);
                        }
                    });
                }

                // Mettre à jour la dernière date d'entraînement
                if (!stats.lastTrained || new Date(session.date) > new Date(stats.lastTrained)) {
                    stats.lastTrained = session.date;
                }
            });
        });

        // Compter les sessions uniques par groupe musculaire
        sessionsData.forEach(session => {
            const muscleGroupsInSession = new Set();
            
            if (session.exercises) {
                session.exercises.forEach(sessionExercise => {
                    const exercise = exercisesData.find(ex => ex.id === sessionExercise.exercise_id);
                    if (exercise) {
                        muscleGroupsInSession.add(exercise.muscle_group);
                    }
                });
            }

            muscleGroupsInSession.forEach(group => {
                if (analytics.muscleGroupStats[group]) {
                    analytics.muscleGroupStats[group].sessions++;
                }
            });
        });
    }

    /**
     * Calculer les exercices favoris
     */
    async function calculateFavoriteExercises() {
        const exerciseStats = {};

        // Compter l'usage de chaque exercice
        sessionsData.forEach(session => {
            if (!session.exercises) return;

            session.exercises.forEach(sessionExercise => {
                const exerciseId = sessionExercise.exercise_id;
                
                if (!exerciseStats[exerciseId]) {
                    exerciseStats[exerciseId] = {
                        exerciseId,
                        sessions: 0,
                        sets: 0,
                        reps: 0,
                        totalWeight: 0,
                        lastUsed: null
                    };
                }

                const stats = exerciseStats[exerciseId];
                stats.sessions++;
                
                if (sessionExercise.sets) {
                    sessionExercise.sets.forEach(set => {
                        if (set.completed) {
                            stats.sets++;
                            stats.reps += set.reps || 0;
                            stats.totalWeight += (set.reps || 0) * (set.weight || 0);
                        }
                    });
                }

                if (!stats.lastUsed || new Date(session.date) > new Date(stats.lastUsed)) {
                    stats.lastUsed = session.date;
                }
            });
        });

        // Trier par usage et prendre les 10 premiers
        analytics.favoriteExercises = Object.values(exerciseStats)
            .sort((a, b) => b.sessions - a.sessions)
            .slice(0, 10)
            .map(stat => {
                const exercise = exercisesData.find(ex => ex.id === stat.exerciseId);
                return {
                    ...stat,
                    name: exercise ? exercise.name : 'Exercice inconnu',
                    muscleGroup: exercise ? exercise.muscle_group : 'unknown'
                };
            });
    }

    /**
     * Calculer les métriques de progression
     */
    async function calculateProgressMetrics() {
        if (sessionsData.length === 0) {
            analytics.progressMetrics = {};
            return;
        }

        const metrics = {
            sessionFrequency: calculateSessionFrequency(),
            volumeProgression: calculateVolumeProgression(),
            strengthProgression: calculateStrengthProgression(),
            enduranceProgression: calculateEnduranceProgression(),
            consistencyScore: calculateConsistencyScore()
        };

        analytics.progressMetrics = metrics;
    }

    /**
     * Calculer la fréquence des sessions
     */
    function calculateSessionFrequency() {
        const last30Days = sessionsData.filter(session => {
            const sessionDate = new Date(session.date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return sessionDate >= thirtyDaysAgo;
        });

        return {
            last30Days: last30Days.length,
            averagePerWeek: Math.round((last30Days.length / 30) * 7 * 10) / 10,
            trend: calculateTrend(last30Days, 'frequency')
        };
    }

    /**
     * Calculer la progression du volume
     */
    function calculateVolumeProgression() {
        const monthlyVolumes = analytics.monthlyStats.map(month => ({
            period: month.month,
            value: month.sets
        })).reverse();

        return {
            current: monthlyVolumes.length > 0 ? monthlyVolumes[monthlyVolumes.length - 1].value : 0,
            previous: monthlyVolumes.length > 1 ? monthlyVolumes[monthlyVolumes.length - 2].value : 0,
            trend: calculateTrend(monthlyVolumes, 'volume'),
            history: monthlyVolumes
        };
    }

    /**
     * Calculer la progression de force
     */
    function calculateStrengthProgression() {
        // Analyse des poids moyens par exercice sur le temps
        const strengthData = {};
        
        sessionsData.forEach(session => {
            if (!session.exercises) return;
            
            session.exercises.forEach(sessionExercise => {
                const exerciseId = sessionExercise.exercise_id;
                
                if (!strengthData[exerciseId]) {
                    strengthData[exerciseId] = [];
                }
                
                const avgWeight = sessionExercise.sets
                    .filter(set => set.completed && set.weight > 0)
                    .reduce((sum, set, _, arr) => sum + set.weight / arr.length, 0);
                
                if (avgWeight > 0) {
                    strengthData[exerciseId].push({
                        date: session.date,
                        weight: avgWeight
                    });
                }
            });
        });

        // Calculer la tendance moyenne
        let totalTrend = 0;
        let exerciseCount = 0;
        
        Object.values(strengthData).forEach(data => {
            if (data.length >= 2) {
                const trend = calculateTrend(data, 'strength');
                totalTrend += trend;
                exerciseCount++;
            }
        });

        return {
            averageTrend: exerciseCount > 0 ? totalTrend / exerciseCount : 0,
            exercisesTracked: exerciseCount,
            topGains: Object.entries(strengthData)
                .map(([exerciseId, data]) => {
                    const exercise = exercisesData.find(ex => ex.id === exerciseId);
                    return {
                        exerciseId,
                        name: exercise ? exercise.name : 'Inconnu',
                        trend: data.length >= 2 ? calculateTrend(data, 'strength') : 0,
                        current: data.length > 0 ? data[data.length - 1].weight : 0,
                        previous: data.length > 1 ? data[data.length - 2].weight : 0
                    };
                })
                .sort((a, b) => b.trend - a.trend)
                .slice(0, 5)
        };
    }

    /**
     * Calculer la progression d'endurance
     */
    function calculateEnduranceProgression() {
        const last3Months = sessionsData.filter(session => {
            const sessionDate = new Date(session.date);
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            return sessionDate >= threeMonthsAgo;
        });

        const avgDuration = last3Months.length > 0 ? 
            last3Months.reduce((sum, s) => sum + (s.duration || 0), 0) / last3Months.length : 0;

        const avgSetsPerSession = last3Months.length > 0 ?
            last3Months.reduce((sum, s) => sum + (s.stats?.completedSets || 0), 0) / last3Months.length : 0;

        return {
            averageSessionDuration: Math.round(avgDuration),
            averageSetsPerSession: Math.round(avgSetsPerSession * 10) / 10,
            trend: calculateTrend(last3Months.map(s => ({ value: s.duration })), 'endurance')
        };
    }

    /**
     * Calculer le score de constance
     */
    function calculateConsistencyScore() {
        if (sessionsData.length === 0) return 0;

        const last8Weeks = [];
        const now = new Date();
        
        for (let i = 0; i < 8; i++) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (now.getDay() + 7 * i));
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            const sessionsThisWeek = sessionsData.filter(session => {
                const sessionDate = new Date(session.date);
                return sessionDate >= weekStart && sessionDate <= weekEnd;
            }).length;
            
            last8Weeks.push(sessionsThisWeek);
        }

        // Score basé sur la régularité (faible variance = bon score)
        const avg = last8Weeks.reduce((sum, count) => sum + count, 0) / 8;
        const variance = last8Weeks.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / 8;
        
        // Score de 0 à 100 (100 = très constant)
        const consistencyScore = Math.max(0, Math.min(100, 100 - (variance * 20)));
        
        return Math.round(consistencyScore);
    }

    /**
     * Calculer une tendance simple
     */
    function calculateTrend(data, type) {
        if (data.length < 2) return 0;

        const values = data.map(item => {
            switch (type) {
                case 'strength': return item.weight;
                case 'volume': return item.value;
                case 'endurance': return item.value;
                case 'frequency': return 1; // Chaque session compte comme 1
                default: return item.value || 0;
            }
        });

        // Régression linéaire simple
        const n = values.length;
        const sumX = values.reduce((sum, _, i) => sum + i, 0);
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
        const sumXX = values.reduce((sum, _, i) => sum + (i * i), 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        
        // Normaliser la pente en pourcentage
        const avgY = sumY / n;
        return avgY !== 0 ? (slope / avgY) * 100 : 0;
    }

    /**
     * Obtenir les statistiques générales
     */
    function getOverviewStats() {
        if (!analytics) return null;

        return {
            totalSessions: analytics.totalSessions,
            totalDuration: analytics.totalDuration,
            totalExercises: analytics.totalExercises,
            totalSets: analytics.totalSets,
            totalReps: analytics.totalReps,
            totalWeight: analytics.totalWeight,
            averageSessionDuration: analytics.averageSessionDuration,
            currentStreak: analytics.currentStreak,
            longestStreak: analytics.longestStreak,
            lastUpdate: analytics.lastUpdate
        };
    }

    /**
     * Obtenir les données pour les graphiques
     */
    function getChartData(type, period = '3months') {
        if (!analytics) return null;

        switch (type) {
            case 'sessions':
                return getSessionsChartData(period);
            case 'volume':
                return getVolumeChartData(period);
            case 'muscles':
                return getMuscleGroupChartData();
            case 'progress':
                return getProgressChartData();
            default:
                return null;
        }
    }

    /**
     * Données graphique sessions
     */
    function getSessionsChartData(period) {
        const data = period === 'week' ? analytics.weeklyStats : analytics.monthlyStats;
        
        return {
            labels: data.map(item => period === 'week' ? item.week : item.month),
            datasets: [{
                label: 'Sessions',
                data: data.map(item => item.sessions),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2
            }]
        };
    }

    /**
     * Données graphique volume
     */
    function getVolumeChartData(period) {
        const data = period === 'week' ? analytics.weeklyStats : analytics.monthlyStats;
        
        return {
            labels: data.map(item => period === 'week' ? item.week : item.month),
            datasets: [{
                label: 'Sets',
                data: data.map(item => item.sets),
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2
            }]
        };
    }

    /**
     * Données graphique groupes musculaires
     */
    function getMuscleGroupChartData() {
        const labels = Object.keys(analytics.muscleGroupStats);
        const data = labels.map(group => analytics.muscleGroupStats[group].sessions);
        
        return {
            labels,
            datasets: [{
                label: 'Sessions par groupe musculaire',
                data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(199, 199, 199, 0.8)'
                ]
            }]
        };
    }

    /**
     * Données graphique progression
     */
    function getProgressChartData() {
        const volumeData = analytics.progressMetrics.volumeProgression?.history || [];
        
        return {
            labels: volumeData.map(item => item.period),
            datasets: [{
                label: 'Volume (Sets)',
                data: volumeData.map(item => item.value),
                fill: false,
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1
            }]
        };
    }

    /**
     * Gérer la fin d'une session
     */
    async function handleSessionCompleted(data) {
        try {
            console.log('📊 Mise à jour des analytics après session');
            await refreshData();
        } catch (error) {
            console.error('❌ Erreur mise à jour analytics après session :', error);
        }
    }

    /**
     * Générer un rapport personnalisé
     */
    function generateCustomReport(startDate, endDate, options = {}) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const filteredSessions = sessionsData.filter(session => {
            const sessionDate = new Date(session.date);
            return sessionDate >= start && sessionDate <= end;
        });

        const report = {
            period: { start: startDate, end: endDate },
            totalSessions: filteredSessions.length,
            totalDuration: filteredSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
            averageDuration: 0,
            totalSets: 0,
            totalReps: 0,
            muscleGroups: {},
            topExercises: []
        };

        // Calculer les moyennes
        if (report.totalSessions > 0) {
            report.averageDuration = Math.round(report.totalDuration / report.totalSessions);
        }

        // Analyser les sessions
        const exerciseUsage = {};
        
        filteredSessions.forEach(session => {
            if (session.stats) {
                report.totalSets += session.stats.completedSets || 0;
                report.totalReps += session.stats.totalReps || 0;
            }

            if (session.exercises) {
                session.exercises.forEach(sessionExercise => {
                    const exercise = exercisesData.find(ex => ex.id === sessionExercise.exercise_id);
                    if (exercise) {
                        // Groupes musculaires
                        const group = exercise.muscle_group;
                        report.muscleGroups[group] = (report.muscleGroups[group] || 0) + 1;

                        // Usage des exercices
                        if (!exerciseUsage[exercise.id]) {
                            exerciseUsage[exercise.id] = {
                                name: exercise.name,
                                count: 0,
                                sets: 0
                            };
                        }
                        exerciseUsage[exercise.id].count++;
                        exerciseUsage[exercise.id].sets += sessionExercise.sets?.length || 0;
                    }
                });
            }
        });

        // Top exercices
        report.topExercises = Object.values(exerciseUsage)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return report;
    }

    /**
     * Gérer les mises à jour du stockage
     */
    function handleStorageUpdate(data) {
        if (data.key === STORAGE_KEYS.ANALYTICS) {
            console.log('🔄 Mise à jour analytics détectée');
            loadAnalytics();
        }
    }

    // Interface publique
    return {
        init,
        refreshData,
        calculateAllStats,
        getOverviewStats,
        getChartData,
        generateCustomReport,
        getAnalytics: () => analytics,
        getFavoriteExercises: () => analytics?.favoriteExercises || [],
        getMuscleGroupStats: () => analytics?.muscleGroupStats || {},
        getProgressMetrics: () => analytics?.progressMetrics || {},
        getWeeklyStats: () => analytics?.weeklyStats || [],
        getMonthlyStats: () => analytics?.monthlyStats || []
    };
})();

// Export global
window.AnalyticsModel = AnalyticsModel;