/**
 * ANALYTICS DASHBOARD
 * Displays user engagement metrics, heatmaps, and personalized recommendations
 * Integrated into profil.html
 */

class AnalyticsDashboard {
    static async init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('[ANALYTICS] Container not found:', containerId);
            return;
        }

        try {
            console.log('[ANALYTICS] Initializing dashboard...');

            // Fetch dashboard data
            const dashboard = await this.fetchDashboard();
            if (!dashboard) return;

            // Render dashboard sections
            this.renderSummaryCards(container, dashboard);
            this.renderHeatmap(container, dashboard.heatmap);
            this.renderFeatureUsage(container, dashboard.features);
            await this.renderRecommendations(container);

            console.log('[ANALYTICS] Dashboard initialized successfully');
        } catch (error) {
            console.error('[ANALYTICS] Error initializing dashboard:', error);
        }
    }

    static async fetchDashboard() {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                console.warn('[ANALYTICS] User not authenticated');
                return null;
            }

            const response = await fetch('/api/user/analytics/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch dashboard: ${response.status}`);
            }

            const data = await response.json();
            return data.dashboard;
        } catch (error) {
            console.error('[ANALYTICS] Error fetching dashboard:', error);
            return null;
        }
    }

    static renderSummaryCards(container, dashboard) {
        const summaryHTML = `
            <div class="analytics-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div class="card analytics-card" style="padding: 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
                    <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">Celkem čtení</div>
                    <div style="font-size: 2rem; font-weight: bold;">${dashboard.totalReadings}</div>
                    <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.5rem;">Tento měsíc: ${dashboard.readingsThisMonth}</div>
                </div>

                <div class="card analytics-card" style="padding: 1.5rem; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border-radius: 8px;">
                    <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">Série aktivit</div>
                    <div style="font-size: 2rem; font-weight: bold;">${dashboard.streak}</div>
                    <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.5rem;">Po sobě jdoucích dní</div>
                </div>

                <div class="card analytics-card" style="padding: 1.5rem; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border-radius: 8px;">
                    <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">Skóre udržení</div>
                    <div style="font-size: 2rem; font-weight: bold;">${dashboard.retentionScore}</div>
                    <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.5rem;">/ 100 bodů</div>
                </div>

                <div class="card analytics-card" style="padding: 1.5rem; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; border-radius: 8px;">
                    <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">Riziko odchodu</div>
                    <div style="font-size: 2rem; font-weight: bold;">${dashboard.churnRiskScore}</div>
                    <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 0.5rem;">/ 100 (nižší je lepší)</div>
                </div>
            </div>
        `;

        // Insert after or before existing content
        const summaryElement = document.createElement('div');
        summaryElement.innerHTML = summaryHTML;
        container.appendChild(summaryElement);
    }

    static renderHeatmap(container, heatmapData) {
        const { hourly, daily } = heatmapData;

        // Hourly heatmap (when user is most active)
        const hours = ['0h', '3h', '6h', '9h', '12h', '15h', '18h', '21h'];
        const hourlyBars = hourly.map((count, hour) => {
            const percentage = hourly.length > 0 ? (count / Math.max(...hourly)) * 100 : 0;
            return `
                <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                    <div style="
                        width: 100%;
                        height: 40px;
                        background: linear-gradient(to top, #667eea, #764ba2);
                        opacity: ${Math.max(0.2, percentage / 100)};
                        border-radius: 4px 4px 0 0;
                        margin-bottom: 4px;
                        transition: opacity 0.2s;
                    " title="${count} čtení"></div>
                    <span style="font-size: 0.75rem;">${hour}h</span>
                </div>
            `;
        }).join('');

        const heatmapHTML = `
            <div style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">Kdy jsi nejaktivnější? 🔥</h3>
                <div style="display: flex; gap: 4px; height: 80px; align-items: flex-end;">
                    ${hourlyBars}
                </div>
                <p style="font-size: 0.9rem; color: #888; margin-top: 1rem;">Poslední 30 dní | Klikni pro více podrobností</p>
            </div>
        `;

        const heatmapElement = document.createElement('div');
        heatmapElement.innerHTML = heatmapHTML;
        container.appendChild(heatmapElement);
    }

    static renderFeatureUsage(container, features) {
        if (!features || features.length === 0) {
            return;
        }

        // Get top 5 features
        const topFeatures = features.slice(0, 5);
        const maxUses = Math.max(...topFeatures.map(f => f.total_uses), 1);

        const featureHTML = `
            <div style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem;">Oblíbené funkce 💫</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${topFeatures.map(feature => {
                        const percentage = (feature.total_uses / maxUses) * 100;
                        return `
                            <div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                    <span>${this.getFeatureLabel(feature.feature)}</span>
                                    <span style="font-weight: bold;">${feature.total_uses}x</span>
                                </div>
                                <div style="
                                    height: 8px;
                                    background: #e0e0e0;
                                    border-radius: 4px;
                                    overflow: hidden;
                                ">
                                    <div style="
                                        height: 100%;
                                        background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                                        width: ${percentage}%;
                                        transition: width 0.3s ease;
                                    "></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        const featureElement = document.createElement('div');
        featureElement.innerHTML = featureHTML;
        container.appendChild(featureElement);
    }

    static async renderRecommendations(container) {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;

            const response = await fetch('/api/user/analytics/recommendations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) return;

            const data = await response.json();
            const recommendations = data.recommendations || [];

            if (recommendations.length === 0) return;

            const recommendationsHTML = `
                <div style="margin-bottom: 2rem;">
                    <h3 style="margin-bottom: 1rem;">Doporučení pro tebe ✨</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                        ${recommendations.slice(0, 3).map(rec => `
                            <div style="
                                padding: 1rem;
                                background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%);
                                border-radius: 8px;
                                border-left: 4px solid #667eea;
                                cursor: pointer;
                                transition: transform 0.2s;
                            " class="recommendation-card" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                                <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">${rec.icon}</div>
                                <div style="font-weight: bold; font-size: 0.9rem; margin-bottom: 0.5rem;">${rec.title}</div>
                                <div style="font-size: 0.8rem; color: #666;">${rec.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            const recElement = document.createElement('div');
            recElement.innerHTML = recommendationsHTML;
            container.appendChild(recElement);
        } catch (error) {
            console.error('[ANALYTICS] Error rendering recommendations:', error);
        }
    }

    static getFeatureLabel(feature) {
        const labels = {
            'tarot': '🃏 Tarot',
            'horoscope': '♈ Horoskop',
            'numerology': '🔢 Numerologie',
            'astrology': '⭐ Astrologie',
            'compatibility': '💕 Kompatibilita',
            'mentorship': '🤖 Mentor'
        };
        return labels[feature] || feature;
    }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('analytics-dashboard')) {
        AnalyticsDashboard.init('analytics-dashboard');
    }
});

export default AnalyticsDashboard;
